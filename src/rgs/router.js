
import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const { promises: fsPromises } = fs;
import { resolveRound } from './engine.js';
import { logAudit, logGameRound, updateGameRound, getGameHistory, getFinancialStats, getAuditLogs } from './backoffice.js';
import { saveDraft, listDrafts, deleteDraft } from './workshop.js';
import { listStudios, createStudio, getStudio, updateStudio } from './studios.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to get game config path
const getGameConfigPath = (gameId) => {
    // Navigate up from src/rgs to root, then to games/gameId
    const rootDir = path.resolve(__dirname, '../../');
    return path.join(rootDir, 'games', gameId, 'config', 'rgs-config.json');
};

// Helper: Get Deck Path
const getDeckPath = (gameId) => {
    const rootDir = path.resolve(__dirname, '../../');
    return path.join(rootDir, 'games', gameId, 'config', 'deck.json');
};

/**
 * POST /api/rgs/play
 * Resolves a game round (Finite or Probabilistic) and logs it.
 */
router.post('/play', async (req, res) => {
    try {
        const { gameId, draftId, wager = 1.0, currency = 'USD', userId = 'guest_player' } = req.body;

        let config;
        let deck = null;
        let isDraft = !!draftId;

        // 1. Load Config (Draft or Published)
        if (draftId) {
            // Load Draft Config from DB or Memory
            // For now, simpler to fetch from DB
            const { listDrafts } = await import('./workshop.js');
            const drafts = await listDrafts();
            const draft = drafts.find(d => d.draftId === draftId);
            if (!draft) return res.status(404).json({ error: 'Draft not found' });
            config = draft.config;
            config.gameId = draftId; // Override for logging context
        } else {
            // Load Published Game Config
            const configPath = getGameConfigPath(gameId);
            const raw = await fsPromises.readFile(configPath, 'utf-8');
            config = JSON.parse(raw).game;

            // Try load Deck
            try {
                const deckPath = getDeckPath(gameId);
                const deckRaw = await fsPromises.readFile(deckPath, 'utf-8');
                deck = JSON.parse(deckRaw);
            } catch (e) {
                console.warn('[RGS] No deck found, using Infinite Math');
            }
        }

        // 2. Determine Outcome
        let tierId = null;

        // Finite Deck Logic
        if (deck && deck.tickets.length > 0 && deck.currentIndex < deck.tickets.length) {
            tierId = deck.tickets[deck.currentIndex];
            deck.currentIndex++;

            // Save Deck State (Async, fire and forget for speed in dev)
            // In prod, use atomic DB transaction suitable for high concurrency
            const deckPath = getDeckPath(gameId);
            fsPromises.writeFile(deckPath, JSON.stringify(deck, null, 2)).catch(e => console.error('Deck Save Error', e));
        }

        // 3. Resolve Round
        const seed = crypto.randomBytes(16).toString('hex');
        const round = resolveRound(config, seed, tierId);

        // 4. Log to Database (Audit & Analytics)
        // Ensure values are numbers
        const betAmount = Number(wager);
        const winAmount = Number(round.finalPrize);

        await logGameRound({
            gameId: config.gameId,
            userId,
            roundId: round.roundId,
            bet: betAmount,
            win: winAmount,
            currency,
            payout: winAmount, // For reporting
            // Inspector Data
            outcome: round,
            serverSeed: seed, // Vital for "Provably Fair" inspector
            clientSeed: null, // If we add client seed later
            deckInfo: deck ? { index: deck.currentIndex, size: deck.tickets?.length } : 'RNG'
        });

        // 5. Update Financial Stats (Aggregation)
        // Note: logGameRound now handles atomic updates to stats table if implemented correctly.
        // If not, we trigger explicit update:
        // await updateGameRound(config.gameId, betAmount, winAmount); // (Make sure this exists in backoffice.js)

        res.json({
            success: true,
            roundId: round.roundId,
            outcome: round,
            balance: 1000 - betAmount + winAmount // Mock Balance
        });

    } catch (error) {
        console.error('[RGS] Play Error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/rgs/preview
 * Generates a game round result without logging transaction or affecting balance.
 * Used by the Editor to show "WYSIWYG" preview.
 */
router.post('/preview', async (req, res) => {
    try {
        const { config } = req.body;
        if (!config) return res.status(400).json({ error: 'Config required' });

        // Generate a random seed for preview
        const seed = crypto.randomBytes(16).toString('hex');

        // Resolve using the Server Engine
        // This ensures the Editor Preview is EXACTLY what the player will get
        const result = resolveRound(config, seed);

        res.json({
            success: true,
            outcome: result,
            debug: { seed }
        });
    } catch (error) {
        console.error('[RGS] Preview Error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/rgs/publish
 * Publishes a game configuration to the RGS "live" state.
 */
router.post('/publish', async (req, res) => {
    console.log('[RGS-DEBUG] /publish hit', req.body);
    try {
        let { gameId, ticketId, config, studioId } = req.body;

        if (!gameId) {
            console.error('[RGS-DEBUG] Missing gameId');
            return res.status(400).json({ success: false, message: 'Missing gameId' });
        }

        // 1. Resolve Config
        if (!config) {
            console.log('[RGS-DEBUG] Config missing, looking up draft...', gameId);
            try {
                const { dbGet } = await import('./database.js');
                const draft = await dbGet('SELECT * FROM rgs_drafts WHERE id = ? OR game_name = ?', [gameId, gameId]);
                if (draft) {
                    console.log('[RGS-DEBUG] Draft found:', draft.id);
                    let parsed;
                    try {
                        parsed = JSON.parse(draft.data || '{}');
                    } catch (e) {
                        console.error('[RGS-DEBUG] JSON Parse error for draft data', e);
                        parsed = {};
                    }

                    config = parsed.config || parsed;
                    console.log('[RGS-DEBUG] Config Type:', typeof config);
                    console.log('[RGS-DEBUG] Config Keys:', Object.keys(config));

                    if (!config.gameId) config.gameId = gameId;
                    if (!studioId && parsed.studioId) studioId = parsed.studioId;
                } else {
                    console.error('[RGS-DEBUG] Draft NOT found for id', gameId);
                }
            } catch (dbErr) {
                console.error('[RGS-DEBUG] DB Error looking up draft:', dbErr);
                throw dbErr;
            }
        }

        if (!config || Object.keys(config).length === 0) {
            console.error('[RGS-DEBUG] Config is empty after lookup');
            return res.status(404).json({ error: 'Game configuration not found. Please save to Workshop first.' });
        }

        console.log(`[RGS] Publishing game: ${gameId} with Ticket: ${ticketId}`);

        // 2. Save Config to File System
        let filePath;
        try {
            const rootDir = path.resolve(__dirname, '../../');
            const gameDir = path.join(rootDir, 'games', gameId);
            const configDir = path.join(gameDir, 'config');

            console.log('[RGS-DEBUG] Writing config to:', configDir);
            await fsPromises.mkdir(configDir, { recursive: true });

            const rgsConfig = {
                meta: {
                    publishedAt: new Date().toISOString(),
                    ticketId: ticketId || 'DEV-AUTO',
                    version: '1.0.0',
                    engineVersion: 'rgs-v1'
                },
                game: config
            };

            filePath = path.join(configDir, 'rgs-config.json');
            await fsPromises.writeFile(filePath, JSON.stringify(rgsConfig, null, 2));
            console.log('[RGS-DEBUG] Config written.');
        } catch (fsErr) {
            console.error('[RGS-DEBUG] FS Error:', fsErr);
            throw fsErr;
        }

        // 3. Generate Finite Deck (GLI-14 Mock)
        // ONLY if config.scratch.math.mathMode === 'POOL'
        const isFinite = config.scratch?.math?.mathMode === 'POOL';

        if (isFinite) {
            console.log('[RGS-DEBUG] Generating Finite Deck (POOL Mode)...');
            const pool = [];
            const prizes = config.scratch?.prizes || [];
            console.log('[RGS-DEBUG] Prizes count:', prizes.length);

            if (prizes.length > 0) {
                prizes.forEach(p => {
                    if (!p.weight) return; // safety
                    // Use the exact weight as ticket count (Finite Pool)
                    const count = p.weight;
                    for (let i = 0; i < count; i++) pool.push(p.id);
                });
            } else {
                for (let i = 0; i < 10; i++) pool.push('tier_win_big');
                for (let i = 0; i < 90; i++) pool.push('tier_lose');
            }

            // Shuffle (Fisher-Yates)
            for (let i = pool.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [pool[i], pool[j]] = [pool[j], pool[i]];
            }

            console.log('[RGS-DEBUG] Saving Deck...');
            const deckPath = getDeckPath(gameId);
            await fsPromises.writeFile(deckPath, JSON.stringify({
                tickets: pool,
                currentIndex: 0
            }, null, 2));
        } else {
            console.log('[RGS-DEBUG] RNG Mode - Skipping Deck Generation');
            // Ensure no stale deck exists if switching modes
            const deckPath = getDeckPath(gameId);
            if (fs.existsSync(deckPath)) {
                await fsPromises.unlink(deckPath);
            }
        }

        // 4. Database Insert (Catalog)
        console.log('[RGS-DEBUG] Updating Catalog DB...');
        const { dbRun } = await import('./database.js');
        await dbRun(`
            INSERT OR REPLACE INTO rgs_games (
                id, studio_id, display_name, version, status, config, published_at
            ) VALUES (?, ?, ?, ?, 'LIVE', ?, datetime('now'))
        `, [
            gameId,
            studioId || null,
            config.displayName || 'Untitled Game',
            '1.0.0', // version
            JSON.stringify(config) // config
        ]);

        // 5. Log Audit
        try {
            await logAudit('GAME_PUBLISH', { gameId, ticketId, deckSize: pool.length });
        } catch (auditErr) {
            console.warn('[RGS-DEBUG] Audit log failed (non-fatal):', auditErr.message);
        }

        console.log(`[RGS] Game published successfully: ${filePath}`);

        res.json({
            success: true,
            version: '1.0.0',
            endpoint: `/api/rgs/play/${gameId}`,
            deployedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('[RGS-FATAL] Publish Error Stack:', error.stack);
        await logAudit('GAME_PUBLISH_ERROR', { error: error.message }); // This might fail if logAudit is broken
        res.status(500).json({ success: false, message: error.message, stack: error.stack });
    }
});

/**
 * POST /api/rgs/play
 * Plays a round of the game.
 */
router.post('/play', async (req, res) => {
    try {
        const { gameId, currency = 'USD', bet = 1.0, playerId = 'guest', operatorId = 'demo' } = req.body;

        if (!gameId) return res.status(400).json({ error: 'Missing gameId' });

        // 1. Load Game Config
        const configPath = getGameConfigPath(gameId);
        if (!fs.existsSync(configPath)) {
            return res.status(404).json({ error: 'Game configuration not found' });
        }
        const fileContent = await fsPromises.readFile(configPath, 'utf8');
        const rgsConfig = JSON.parse(fileContent);
        const gameConfig = rgsConfig.game;

        // 2. Load Deck (GLI-14)
        let forcedTierId = null;
        const deckPath = getDeckPath(gameId);

        // Lock mechanism would be needed here for concurrency; skipping for MVP
        if (fs.existsSync(deckPath)) {
            try {
                const deckContent = await fsPromises.readFile(deckPath, 'utf8');
                const deck = JSON.parse(deckContent);

                if (deck.currentIndex < deck.tickets.length) {
                    forcedTierId = deck.tickets[deck.currentIndex];
                    deck.currentIndex++;
                    // Save state (Async verify warning: might have race condition in high load)
                    // Blocking write for safety in this demo
                    await fsPromises.writeFile(deckPath, JSON.stringify(deck, null, 2));
                } else {
                    return res.status(400).json({ error: 'Shoe Empty (GLI-14 Finite Deck Ended)' });
                }
            } catch (e) {
                console.error('[RGS] Deck Error:', e);
            }
        }

        // 3. Generate Seed
        const serverSeed = crypto.randomBytes(16).toString('hex');

        // 4. Resolve Round
        const result = resolveRound(gameConfig, serverSeed, forcedTierId);

        // 5. Calculate Financials
        const winAmount = result.finalPrize * bet;



        // ... (/play endpoint start)
        // 6. Log Game History (GLI-11)
        const startedAt = new Date();
        await logGameRound({
            gameId,
            roundId: result.roundId,
            playerId,
            operatorId,
            bet,
            currency,
            win: winAmount,
            prizeId: result.tierId, // Log the actual tier
            deckIndex: forcedTierId ? 'tracked' : 'rng',
            startedAt: startedAt.toISOString()
        });

        // 7. Return outcome
        res.json({
            success: true,
            round: {
                id: result.roundId,
                currency: currency,
                bet: bet,
                win: winAmount,
                isWin: result.isWin,
                prizeId: result.tierId,
                startedAt: startedAt.toISOString()
            },
            outcome: {
                revealMap: result.revealMap,
                symbols: result.revealMap
            }
        });

    } catch (error) {
        console.error('[RGS] Play Error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/rgs/play/complete
 * Updates the game round with finish time and duration.
 * Called by frontend when user finishes "scratching" or animation ends.
 */
router.post('/play/complete', async (req, res) => {
    const { roundId, durationMs } = req.body;
    if (!roundId) return res.status(400).json({ error: 'Missing roundId' });

    const completedAt = new Date().toISOString();

    // If duration not provided, calculate it? No, backend doesn't know start time easily without query.
    // Client should provide duration or we assume difference from now (less accurate).
    // Let's assume client sends duration.

    await updateGameRound(roundId, completedAt, durationMs || 0);

    res.json({ success: true });
});

/**
 * GET /api/rgs/financials
 * Backoffice Report
 */
router.get('/financials', async (req, res) => {
    const stats = await getFinancialStats();
    res.json(stats);
});

/**
 * GET /api/rgs/history
 * Backoffice Game History
 */
router.get('/history', async (req, res) => {
    const { gameId } = req.query;
    const history = await getGameHistory(gameId, 100);
    res.json(history);
});

/**
 * GET /api/rgs/audit
 * Backoffice Audit Logs
 */
router.get('/audit', async (req, res) => {
    const logs = await getAuditLogs(100);
    res.json(logs);
});

// --- NEW ANALYTICS ENDPOINTS ---

import { getAnalyticsData, getPlayerStats, getGamePerformance } from './backoffice.js';

router.get('/analytics/overview', async (req, res) => {
    const data = await getAnalyticsData();
    res.json(data);
});

router.get('/analytics/players', async (req, res) => {
    const stats = await getPlayerStats();
    res.json(stats);
});

router.get('/analytics/games', async (req, res) => {
    const stats = await getGamePerformance();
    res.json(stats);
});

// --- WORKSHOP / DRAFTS ---

router.post('/draft', async (req, res) => {
    try {
        const { draftId, ...data } = req.body;
        if (!draftId) return res.status(400).json({ error: 'Missing draftId' });

        await saveDraft(draftId, data);
        res.json({ success: true });
    } catch (e) {
        console.error('[RGS] Draft Save Error:', e);
        res.status(500).json({ error: e.message, code: e.code });
    }
});

// --- STUDIOS API ---

router.get('/studios', async (req, res) => {
    const studios = await listStudios();
    res.json(studios);
});

router.post('/studios', async (req, res) => {
    try {
        const result = await createStudio(req.body);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.put('/studios/:id', async (req, res) => {
    try {
        await updateStudio(req.params.id, req.body);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/catalog', async (req, res) => {
    try {
        // Fetch all published games
        // Join with studio info if possible, but basic select is fine for now
        const { dbQuery } = await import('./database.js');
        const rows = await dbQuery(`
            SELECT g.id, g.display_name, g.studio_id, g.config, g.status, s.name as studio_name, s.logo_url as studio_logo 
            FROM rgs_games g
            LEFT JOIN rgs_studios s ON g.studio_id = s.id
            WHERE g.status IN ('READY', 'LIVE')
        `);

        // Parse config if necessary
        const catalog = rows.map(row => ({
            ...row,
            config: JSON.parse(row.config || '{}')
        }));

        res.json(catalog);
    } catch (e) {
        console.error('Catalog error', e);
        res.status(500).json({ error: e.message });
    }
});

// Duplicate publish route removed


router.get('/games/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { dbGet } = await import('./database.js');
        const game = await dbGet('SELECT * FROM rgs_games WHERE id = ?', [id]);

        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        // Parse config
        const config = JSON.parse(game.config || '{}');

        res.json({
            ...game,
            config
        });
    } catch (e) {
        console.error('Fetch game error', e);
        res.status(500).json({ error: e.message });
    }
});


// --- RGS CONFIG API MIRROR ---
// These endpoints mirror the https://rgs-config.onrender.com API for local development

router.post('/config/save', async (req, res) => {
    try {
        const { gameId, ...data } = req.body;
        if (!gameId) return res.status(400).json({ error: 'Missing gameId' });

        console.log(`[RGS - MOCK] Saving config for ${gameId}`);
        // Reuse saveDraft logic but treat as "config"
        await saveDraft(gameId, data);
        res.json({ success: true, message: 'Saved to local mock RGS' });
    } catch (e) {
        console.error('[RGS-MOCK] Save failed', e);
        res.status(500).json({ error: e.message });
    }
});

router.get('/configs', async (req, res) => {
    try {
        const drafts = await listDrafts();
        // Transform drafts to match RGS /configs/ response structure if needed
        // Remote API returns { configs: [], metadata: {} }
        res.json({
            configs: drafts,
            metadata: {
                total: drafts.length,
                page: 1,
                pageSize: 100
            }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/drafts', async (req, res) => {
    const drafts = await listDrafts();
    res.json(drafts);
});

router.delete('/draft/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await deleteDraft(id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
