import { GameConfig, ScratchPrizeTier } from '../types';
import { GameMathConfig } from './math-engine/types';
import { ASSET_MAP } from './scratchAssets';

/**
 * Extracts and traverses the configuration to find all asset URLs.
 */
export const generateAssetManifest = (config: GameConfig): string[] => {
    const assets = new Set<string>();

    const traverse = (obj: any) => {
        if (!obj) return;
        if (typeof obj === 'string') {
            if (obj.match(/^https?:\/\//) || obj.match(/^\/fs\//) || obj.match(/^data:image/)) {
                assets.add(obj);
            }
            return;
        }
        if (typeof obj === 'object') {
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    traverse(obj[key]);
                }
            }
        }
    };

    traverse(config);
    return Array.from(assets);
};

/**
 * Normalizes probabilities in a prize table so they sum to 1.
 */
const normalizePrizes = (config: GameMathConfig): GameMathConfig => {
    if (!config.prizeTable) return config;

    // Treat 'probability' field as weight if it isn't already normalized
    // Or if we are in 'weight' mode. 
    // The GameMathConfig input here typically comes from the UI which uses 'weight'.

    const totalWeight = config.prizeTable.reduce((s: number, p: any) => s + (p.probability || 0), 0);

    if (totalWeight > 0) {
        config.prizeTable.forEach((p: any) => {
            // Overwrite probability with normalized value
            p.probability = (p.probability || 0) / totalWeight;
        });
    }
    return config;
};

/**
 * Converts the UI-driven ScratchConfig into the Engine-driven GameMathConfig.
 */
export const getScratchMathConfig = (config: GameConfig): GameMathConfig => {
    if (!config.scratch) {
        throw new Error("Scratch config missing");
    }

    let category: any = 'MATCH';
    const type = config.scratch.mechanic?.type;
    if (type === 'find_symbol') category = 'GRID';
    if (type === 'lucky_number') category = 'BONUS';

    const isPoolMode = (config.scratch.math?.mathMode || 'POOL') === 'POOL';
    const deckSize = config.scratch.math?.totalTickets || 1000000;

    const mathConfig: GameMathConfig = {
        category,
        rtp: config.scratch.math?.rtp || 0.96,
        volatility: 'medium',
        mathMode: isPoolMode ? 'POOL' : 'UNLIMITED',
        totalTickets: deckSize,
        winLogic: config.scratch.math?.winLogic || 'SINGLE_WIN',
        layout: {
            rows: config.scratch.layout?.rows || 3,
            columns: config.scratch.layout?.columns || 3
        },
        prizeTable: (config.scratch.prizes && config.scratch.prizes.length > 0)
            ? config.scratch.prizes.map((p: ScratchPrizeTier) => {
                let prob = p.probability || 0;

                if (isPoolMode) {
                    // In Pool Mode, we use Weight / DeckSize
                    // UI provides 'weight' (count)
                    // If p.weight is present, use it.
                    if (p.weight !== undefined) {
                        prob = p.weight / deckSize;
                    }
                } else {
                    // In Unlimited Mode, we treat 'weight' as relative weight to be normalized
                    // unless probability is explicit
                    prob = p.weight !== undefined ? p.weight : (p.probability || 0);
                }

                return {
                    id: p.id,
                    value: p.payout * (config.scratch?.math?.ticketPrice || 1), // Real value (Price * Multiplier)
                    probability: prob,
                    weight: p.weight, // Pass weight for robust POOL mode handling
                    isWin: p.payout > 0
                };
            })
            : [],
        symbols: {
            // [UPDATED] Win symbols = All custom assets EXCEPT those marked as decoys
            win: (config.scratch?.symbols?.customAssets?.map(a => a.url) || ['WIN'])
                .filter(url => !(config.scratch?.symbols?.loseVariants || []).includes(url)),

            // [UPDATED] Lose symbols = Explicit decoys -> Presets -> Fallback
            lose: (config.scratch?.symbols?.loseVariants && config.scratch.symbols.loseVariants.length > 0)
                ? config.scratch.symbols.loseVariants
                : (config.scratch?.symbols?.style && config.scratch.symbols.style in ASSET_MAP
                    ? ASSET_MAP[config.scratch.symbols.style as keyof typeof ASSET_MAP].lose
                    : ['/assets/symbols/star_stone_fixed.png'])
        },
        // Category Mappings
        grid: category === 'GRID' ? {
            failSymbolProbability: 0.1, // Default, assumed from difficulty
            maxPicks: config.scratch.rulesGrid?.maxPicks
        } : undefined,

        match: category === 'MATCH' ? {
            matchCount: config.scratch.mechanic?.type === 'match_3' ? 3 : 2,
            allowWildcards: false // Future Feature
        } : undefined,

        // --- FAT PIPE: Pass full config to RGS to prevent Data Loss ---
        mechanic: config.scratch.mechanic,
        rulesGrid: config.scratch.rulesGrid,
        features: config.scratch.features
    };

    // Only normalize for Unlimited mode where weights are relative (and we expect Sum=1 for Win+Lose? No, usually Win-only weights normalized to RTP)
    // Actually, 'normalizePrizes' sums to 1. This implies 100% Hit Rate if we don't include losing tiers.
    // Standard scratch logic (Unlimited) usually defines Hit Rate separate from Prize Distribution.
    // But here normalization forces Sum=1. This is likely why "Freaking Wrong" also happened in Unlimited if weights were used without explicit Lose tiers.
    // However, fixing Finite Mode is the priority.

    if (isPoolMode) {
        return mathConfig;
    } else {
        return normalizePrizes(mathConfig);
    }
};

// --- RGS SCHEMA DEFINITIONS (v1.0.0) ---

interface RGSMechanic {
    type: string;
    match_count?: number;
    // Extensible for other types
    grid_size?: { rows: number; columns: number };
    fail_probability?: number;
}

interface RGSPrizeTier {
    tier: string;
    multiplier: number;
    weight: number;
    probability: number; // Included for transparency
}

interface RGSStats {
    computed_rtp: number;
    hit_rate: number;
    variance: number;
    max_win: number;
}

interface RGSIntegrity {
    content_hash?: string;
    secret_salt?: string;
}

export interface RGSMathSchema {
    schema_version: number;
    model_id: string;
    model_version: string;

    mechanic: RGSMechanic;

    math_mode: 'UNLIMITED' | 'POOL';
    win_logic: 'SINGLE_WIN' | 'MULTI_WIN';

    prize_table: RGSPrizeTier[];
    stats: RGSStats;

    integrity: RGSIntegrity;
}

/**
 * Calculates theoretical stats based on the prize table.
 */
const calculateStats = (prizes: RGSPrizeTier[]): RGSStats => {
    let totalRtp = 0;
    let hitRate = 0;
    let maxWin = 0;

    // 1. Calculate RTP and Hit Rate
    prizes.forEach(p => {
        totalRtp += p.multiplier * p.probability;
        if (p.multiplier > 0) {
            hitRate += p.probability;
        }
        if (p.multiplier > maxWin) maxWin = p.multiplier;
    });

    // 2. Calculate Variance
    // Var = Sum( p * (x - mean)^2 )
    let variance = 0;
    prizes.forEach(p => {
        // x = multiplier
        // mean = rtp
        const diff = p.multiplier - totalRtp;
        variance += p.probability * (diff * diff);
    });

    // Accounting for losing spins (multiplier 0)
    // The losing probability is (1 - hitRate)
    const loseProb = 1 - hitRate;
    if (loseProb > 0) {
        const diff = 0 - totalRtp;
        variance += loseProb * (diff * diff);
    }

    return {
        computed_rtp: Number(totalRtp.toFixed(5)),
        hit_rate: Number(hitRate.toFixed(6)),
        variance: Number(variance.toFixed(2)),
        max_win: maxWin
    };
};

/**
 * transforms internal GameConfig to the RGS Math Schema.
 */
export const transformToRGS = (config: GameConfig): RGSMathSchema => {
    const s = config.scratch;
    if (!s) throw new Error("Scratch config missing");

    // 1. Mechanic Definition
    const mechanicType = s.mechanic?.type || 'match_3';
    const mechanic: RGSMechanic = {
        type: mechanicType
    };

    if (mechanicType === 'match_3') {
        mechanic.match_count = 3;
    } else if (mechanicType === 'find_symbol') {
        mechanic.grid_size = {
            rows: s.layout?.rows || 3,
            columns: s.layout?.columns || 3
        };
    } else if ((mechanicType as string) === 'mines') {
        const rulesGridWithFail = s.rulesGrid as { failSymbolProbability?: number } | undefined;
        mechanic.fail_probability = rulesGridWithFail?.failSymbolProbability ?? 0.1;
    }

    // 2. Math Mode
    // Default to 'POOL' if undefined, matching PaytableEditor.tsx and RtpModeler.tsx defaults
    const mathMode = s.math?.mathMode || 'POOL';
    const isPool = mathMode === 'POOL';
    const deckSize = s.math?.totalTickets || 1000000;
    const totalWeight = s.prizes?.reduce((acc, p) => acc + (p.weight || 0), 0) || 0;

    // 3. Normalize Prize Table
    // We map internal tiers to RGS tiers
    const prizeTable: RGSPrizeTier[] = (s.prizes || []).map(p => {
        let prob = 0;
        let weight = p.weight || 0;

        if (isPool) {
            // In POOL, weight is the literal count tickets
            prob = weight / deckSize;
        } else {
            // In UNLIMITED, weight is relative. 
            // If explicit probability is given, use it.
            if (p.probability) {
                prob = p.probability;
                weight = Math.round(prob * 1000000); // inferred weight for display
            } else if (totalWeight > 0) {
                prob = weight / totalWeight;
            }
        }

        return {
            tier: p.id,
            multiplier: p.payout, // Assumed multiplier
            weight: weight,
            probability: prob
        };
    });

    // Add implicit "LOSE" tier if not explicit
    // (Usually RGS stat calculation needs to know the Lose weight/prob if not 100%)
    // But for the export table, we usually only list active prize tiers, 
    // and stats handle the "rest".
    // The user's example explicitly lists "LOSE". We can add it if we want, 
    // but typically non-winning tiers are implicit in 'weight' vs 'total stats'.
    // However, for POOL mode, we often want to explicit "LOSE" cards count.

    if (isPool) {
        // Calculate remaining tickets
        const winningTickets = prizeTable.reduce((sum, p) => sum + p.weight, 0);
        const losingTickets = deckSize - winningTickets;
        if (losingTickets > 0) {
            prizeTable.unshift({
                tier: 'LOSE',
                multiplier: 0,
                weight: losingTickets,
                probability: losingTickets / deckSize
            });
        }
    } else {
        // For unlimited, we can add a LOSE tier based on remaining probability
        const winProb = prizeTable.reduce((sum, p) => sum + p.probability, 0);
        if (winProb < 1) {
            prizeTable.unshift({
                tier: 'LOSE',
                multiplier: 0,
                weight: 0, // Logical weight 0 or inferred
                probability: 1 - winProb
            });
        }
    }

    // 4. Stats
    const stats = calculateStats(prizeTable);

    return {
        schema_version: 1,
        model_id: config.gameId || 'scratch_game',
        model_version: '1.0.0', // Could typically increment

        mechanic,

        math_mode: isPool ? 'POOL' : 'UNLIMITED',
        win_logic: s.math?.winLogic || 'SINGLE_WIN',

        prize_table: prizeTable,
        stats,

        integrity: {
            // Content hash would be generated by the backend during certification
            content_hash: 'sha256:pending_certification'
        }
    };
};

export interface RGSExportPayload {
    meta: {
        exportedAt: string;
        version: string;
        type: string;
        generator: string;
    };
    visuals: GameConfig;
    math: RGSMathSchema; // [UPDATED] Uses new RGS Schema
    assets: string[];
}

/**
 * Generates the complete export payload for RGS.
 */
export const generateCompleteExport = (config: GameConfig): RGSExportPayload => {
    // Legacy internal config (optional, can omit if RGS schema is enough)
    // const math = getScratchMathConfig(config); 

    const rgsMath = transformToRGS(config);
    const assets = generateAssetManifest(config);

    return {
        meta: {
            exportedAt: new Date().toISOString(),
            version: '1.0.0',
            type: 'scratch_card',
            generator: 'GameCrafter Studio'
        },
        visuals: sanitizeConfigForScratch(config),
        math: rgsMath,
        assets: assets
    };
};

/**
 * Creates a sanitized version of the config for Scratchcard export.
 * Maps scratch specific assets to the theme structure expected by some viewers,
 * and removes irrelevant slot-specific theme data.
 */
/**
 * Generates a mock URL for a base64 asset.
 * In a real scenario, this would be the URL where the asset was uploaded.
 */
const convertBase64ToUrl = (base64: string, type: 'image' | 'audio' = 'image'): string => {
    // Simple hash to make the filename look consistent
    let hash = 0;
    for (let i = 0; i < base64.length; i++) {
        const char = base64.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    const ext = type === 'image' ? 'png' : 'mp3';
    return `https://cdn.gamecrafter.com/assets/scratch/${Math.abs(hash).toString(16)}.${ext}`;
};

/**
 * Recursively cleans the object:
 * 1. Converts Base64 to URLs
 * 2. Removes null/undefined values
 */
const cleanObject = (obj: any): any => {
    if (!obj) return obj;

    if (typeof obj === 'string') {
        if (obj.startsWith('data:image')) {
            return convertBase64ToUrl(obj, 'image');
        }
        if (obj.startsWith('data:audio')) {
            return convertBase64ToUrl(obj, 'audio');
        }
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => cleanObject(item));
    }

    if (typeof obj === 'object') {
        const newObj: any = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const cleaned = cleanObject(obj[key]);
                if (cleaned !== undefined && cleaned !== null) {
                    newObj[key] = cleaned;
                }
            }
        }
        return newObj;
    }

    return obj;
};

/**
 * Creates a sanitized version of the config for Scratchcard export.
 * STRICTLY removes all Slot Layout data and ensures assets are URLs.
 */
const sanitizeConfigForScratch = (config: GameConfig): any => {
    // 1. Extract ONLY what we need for Scratch
    // Unlike before, we start empty and pick what we want, rather than trying to delete what we don't.

    const baseConfig = {
        gameId: config.gameId || 'scratch_game',
        displayName: config.displayName || 'Scratch Card',
        gameTypeInfo: {
            id: 'scratch',
            title: 'Scratch Card',
            type: 'scratch'
        },
        // Core Metadata
        marketing: cleanObject(config.marketing),

        // Scratch Logic - STRICTLY Visuals Only
        // We explicitly omit: match, mechanic, rulesGrid, features, etc.
        // We keep: layers, background, brush, layout
        scratch: (() => {
            const s = config.scratch || {};
            // Destructure to separate visuals from math
            const {
                math, mechanic, rulesGrid, features, prizes, // EXCLUDED
                ...visuals // INCLUDED
            } = s as any;

            return cleanObject(visuals);
        })(),

        // Theme (Simplified for Scratch)
        theme: {
            description: config.theme?.description || "Scratch Card Game",
            mood: config.theme?.mood,
            logo: config.theme?.logo, // [FIX] Preserve Logo
            // We map the computed background/symbols here for viewers that expect 'theme'
            generated: {}
        } as any
    };

    // 2. Map Visuals to common 'Theme' structure (for compatibility)
    if (baseConfig.scratch) {
        // Map Background
        const layers = baseConfig.scratch.layers;
        if (layers?.scene?.value && !layers.scene.value.startsWith('#')) {
            baseConfig.theme.generated.background = layers.scene.value;
        } else if (baseConfig.scratch.background?.image) {
            baseConfig.theme.generated.background = baseConfig.scratch.background.image;
        }

        // Map Symbols (Flattening the prize structure to valid URLs)
        const symbolMap: Record<string, string> = {};
        if (baseConfig.scratch.prizes) {
            baseConfig.scratch.prizes.forEach((p: any) => {
                if (p.id && p.image) {
                    symbolMap[p.id] = p.image;
                }
            });
        }
        baseConfig.theme.generated.symbols = symbolMap;
    }

    // 3. Construct Final Object (No Reels, No Paylines, No Slot Rules)
    return baseConfig;
};

/**
 * Generates the standalone HTML player string.
 */
export const generateScratchHTML = (cleanConfig: any): string => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>${cleanConfig.displayName || 'Scratch Game'} - Preview</title>
    <script src="https://pixijs.download/v8.1.0/pixi.min.js"></script>
    <style>
        body { margin: 0; background: #0f172a; overflow: hidden; touch-action: none; display: flex; flex-direction: column; height: 100vh; font-family: system-ui, sans-serif; }
        #loading { position: absolute; color: white; font-weight: bold; font-size: 24px; text-align: center; pointer-events: none; z-index: 10; }
        .spinner { width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.3); border-top: 4px solid white; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        #game-container { flex: 1; display: flex; align-items: center; justify-content: center; min-height: 0; }
        canvas { box-shadow: 0 0 50px rgba(0,0,0,0.5); border-radius: 12px; max-width: 100%; max-height: 100%; }
        /* Casino Shell Footer */
        #casino-footer { position: fixed; bottom: 0; left: 0; right: 0; height: 56px; background: #000; color: #fff; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; border-top: 1px solid #333; z-index: 50; box-shadow: 0 -4px 20px rgba(0,0,0,0.4); }
        .footer-label { font-size: 10px; font-weight: bold; color: #FFD700; text-transform: uppercase; letter-spacing: 0.05em; }
        .footer-value { font-size: 18px; font-weight: bold; font-family: monospace; }
        #footer-balance, #footer-bet { display: flex; flex-direction: column; gap: 0; }
        #footer-win { display: flex; flex-direction: column; align-items: flex-end; }
        #footer-win .footer-value { color: #4ade80; }
        .btn-buy { height: 40px; padding: 0 24px; background: #22c55e; color: #fff; border: none; border-radius: 999px; font-weight: 800; font-size: 16px; text-transform: uppercase; cursor: pointer; box-shadow: 0 4px 0 #15803d; transition: transform 0.1s, box-shadow 0.1s; }
        .btn-buy:active { transform: translateY(4px); box-shadow: none; }
        .btn-buy:disabled { background: #374151; color: #9ca3af; cursor: not-allowed; box-shadow: none; }
        .btn-autoplay { width: 44px; height: 44px; background: #1f2937; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #fff; border: none; cursor: pointer; font-size: 9px; font-weight: bold; }
        .btn-autoplay:hover:not(:disabled) { background: #374151; }
        .btn-autoplay:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-stop { background: #dc2626; padding: 0 20px; font-weight: 800; }
        /* Autoplay Modal */
        #autoplay-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 200; align-items: center; justify-content: center; }
        #autoplay-overlay.open { display: flex; }
        #autoplay-modal { background: #1e293b; border-radius: 16px; padding: 24px; min-width: 280px; max-width: 90vw; border: 1px solid #334155; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
        #autoplay-modal h3 { margin: 0 0 16px 0; color: #fff; font-size: 18px; }
        .autoplay-row { margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .autoplay-row label { color: #cbd5e1; font-size: 14px; }
        #autoplay-rounds { width: 80px; padding: 8px; border-radius: 8px; border: 1px solid #475569; background: #0f172a; color: #fff; font-size: 16px; }
        .btn-modal { padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; border: none; font-size: 14px; }
        .btn-modal-primary { background: #22c55e; color: #fff; }
        .btn-modal-secondary { background: #475569; color: #fff; margin-right: 8px; }
        /* Debug */
        #debug-console { position: absolute; top: 0; left: 0; width: 300px; height: 100%; background: rgba(0,0,0,0.8); color: #0f0; font-family: monospace; font-size: 12px; padding: 10px; overflow-y: auto; z-index: 100; pointer-events: none; display: none; }
        .log-info { color: #88ff88; }
        .log-warn { color: #ffff88; }
        .log-error { color: #ff8888; font-weight: bold; }
    </style>
</head>
<body>
    <div id="loading">
        <div class="spinner"></div>
        <div>Loading Assets...</div>
        <div id="loading-status" style="font-size:14px; margin-top:10px; opacity:0.7"></div>
    </div>
    <div id="debug-console"></div>
    <div id="game-container"></div>

    <footer id="casino-footer">
        <div style="display: flex; align-items: center; gap: 24px;">
            <div id="footer-balance">
                <span class="footer-label">Demo Balance</span>
                <span class="footer-value" id="footer-balance-value">0.00</span>
            </div>
            <div id="footer-bet">
                <span class="footer-label">Demo Bet</span>
                <span class="footer-value" id="footer-bet-value">0.00</span>
            </div>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
            <div id="footer-win" style="display: none;">
                <span class="footer-label">Win</span>
                <span class="footer-value" id="footer-win-value">0.00</span>
            </div>
            <button type="button" class="btn-buy" id="btn-buy">BUY</button>
            <button type="button" class="btn-autoplay" id="btn-autoplay" title="Autoplay">⟲<br><span>AUTO</span></button>
        </div>
    </footer>

    <div id="autoplay-overlay">
        <div id="autoplay-modal">
            <h3>Autoplay</h3>
            <div class="autoplay-row">
                <label>Rounds</label>
                <input type="number" id="autoplay-rounds" min="1" max="1000" value="10">
            </div>
            <div class="autoplay-row">
                <label><input type="checkbox" id="autoplay-turbo"> Turbo (no delay)</label>
            </div>
            <div class="autoplay-row">
                <label><input type="checkbox" id="autoplay-stop-bonus" checked> Stop on Bonus</label>
            </div>
            <div style="margin-top: 16px; display: flex; justify-content: flex-end;">
                <button type="button" class="btn-modal btn-modal-secondary" id="autoplay-cancel">Cancel</button>
                <button type="button" class="btn-modal btn-modal-primary" id="autoplay-start">Start</button>
            </div>
        </div>
    </div>

    <!-- [CORS-FIX] Config Injection via Script Tag to handle large Base64 strings safely -->
    <script id="game-config" type="application/json">
    ${JSON.stringify(cleanConfig)}
    </script>

    <script>
        
        // --- Setup Debugger ---
        const consoleDiv = document.getElementById('debug-console');
        function log(msg, type='info') {
            console.log(\`[\${type.toUpperCase()}] \`, msg);
            const line = document.createElement('div');
            line.className = 'log-' + type;
            line.textContent = '>' + (typeof msg === 'object' ? JSON.stringify(msg) : msg);
            consoleDiv.appendChild(line);
            consoleDiv.scrollTop = consoleDiv.scrollHeight;
        }
        window.onerror = (msg, url, line) => {
            log(\`ERROR: \${msg} (\${line})\`, 'error');
            document.getElementById('debug-console').style.display = 'block'; // Auto-show on error
        };

        // --- Standalone Scratch Mini-Engine ---
        let app, container, scratchMask, brushTexture;
        let isDrawing = false;
        // [FIX] Global assetUrls for access in setupScene
        const assetUrls = new Set();
        const textureCache = new Map(); // [FIX] Global texture cache for setupScene access
        
        // [CORS-FIX] Embed config via Script Tag to avoid JS Parser limits on huge strings
        let config = null;

        // --- Casino Shell State (Footer + Autoplay) ---
        const ticketPrice = (config.scratch && config.scratch.math && config.scratch.math.ticketPrice) ? Number(config.scratch.math.ticketPrice) : 1;
        let shellState = { balance: 1000, bet: ticketPrice, win: 0, gameState: 'idle', isAutoPlaying: false, autoplayId: 0 };
        const OPERATOR_ENDPOINT = (config.operator_endpoint || ''); // Optional: set in editor for API balance/debit/credit

        function updateFooterDisplay() {
            const balanceEl = document.getElementById('footer-balance-value');
            const betEl = document.getElementById('footer-bet-value');
            const winEl = document.getElementById('footer-win-value');
            const winDiv = document.getElementById('footer-win');
            const buyBtn = document.getElementById('btn-buy');
            const autoBtn = document.getElementById('btn-autoplay');
            if (balanceEl) balanceEl.textContent = shellState.balance.toFixed(2);
            if (betEl) betEl.textContent = shellState.bet.toFixed(2);
            if (winEl) winEl.textContent = shellState.win.toFixed(2);
            if (winDiv) winDiv.style.display = shellState.win > 0 ? 'flex' : 'none';
            if (buyBtn) { buyBtn.textContent = shellState.gameState === 'playing' ? 'Playing...' : 'BUY'; buyBtn.disabled = shellState.gameState === 'playing' || shellState.balance < shellState.bet || shellState.isAutoPlaying; }
            if (autoBtn) { autoBtn.textContent = ''; autoBtn.innerHTML = shellState.isAutoPlaying ? 'STOP' : '⟲<br><span>AUTO</span>'; autoBtn.className = shellState.isAutoPlaying ? 'btn-autoplay btn-stop' : 'btn-autoplay'; autoBtn.disabled = shellState.gameState === 'playing'; }
        }

        function buyTicket() {
            if (shellState.gameState === 'playing' || shellState.balance < shellState.bet || shellState.isAutoPlaying) return;
            shellState.balance -= shellState.bet;
            shellState.win = 0;
            shellState.gameState = 'playing';
            setupScene();
            updateFooterDisplay();
        }

        function openAutoplayModal() { document.getElementById('autoplay-overlay').classList.add('open'); }
        function closeAutoplayModal() { document.getElementById('autoplay-overlay').classList.remove('open'); }

        async function runAutoplay() {
            const rounds = Math.min(1000, Math.max(1, parseInt(document.getElementById('autoplay-rounds').value, 10) || 10));
            const turbo = document.getElementById('autoplay-turbo').checked;
            const stopOnBonus = document.getElementById('autoplay-stop-bonus').checked;
            closeAutoplayModal();
            shellState.isAutoPlaying = true;
            const myId = ++shellState.autoplayId;
            updateFooterDisplay();
            for (let i = 0; i < rounds && shellState.isAutoPlaying && myId === shellState.autoplayId; i++) {
                if (shellState.balance < shellState.bet) break;
                buyTicket();
                if (stopOnBonus && shellState.win > 0) break;
                var delayMs = turbo ? 0 : 1500;
                await new Promise(r => setTimeout(r, delayMs));
                shellState.gameState = 'idle';
                updateFooterDisplay();
            }
            shellState.isAutoPlaying = false;
            shellState.gameState = 'idle';
            updateFooterDisplay();
        }

        function stopAutoplay() { shellState.isAutoPlaying = false; updateFooterDisplay(); }

        async function init() {
            try {
                log("Starting Init...");
                
                // Parse Config from DOM
                try {
                    const raw = document.getElementById('game-config').textContent;
                    config = JSON.parse(raw);
                    log(\`Config Loaded: \${config.displayName}\`);
                } catch(e) {
                    throw new Error("Failed to parse embedded config: " + e.message);
                }

                // 2. Setup Pixi App
                app = new PIXI.Application();
                await app.init({ 
                    width: 600, 
                    height: 800, 
                    backgroundColor: '#1e293b',
                    resolution: window.devicePixelRatio || 1,
                    autoDensity: true
                });
                const gameContainer = document.getElementById('game-container');
                if (gameContainer) gameContainer.appendChild(app.canvas); else document.body.appendChild(app.canvas);
                log("Pixi App Initialized");
                shellState.bet = ticketPrice;
                updateFooterDisplay();
                document.getElementById('btn-buy').onclick = buyTicket;
                document.getElementById('btn-autoplay').onclick = function() { if (shellState.isAutoPlaying) stopAutoplay(); else openAutoplayModal(); };
                document.getElementById('autoplay-cancel').onclick = closeAutoplayModal;
                document.getElementById('autoplay-start').onclick = runAutoplay;

                // 3. Asset Loading (Custom Offline Loader)
                const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.svg'];

                // Broader traversal to catch everything
                const traverse = (obj) => {
                    if (!obj) return;
                    if (typeof obj === 'string') {
                        // Check if it looks like an asset path OR has image extension OR is Base64
                        if (obj.includes('assets/') || 
                            imageExtensions.some(ext => obj.toLowerCase().endsWith(ext)) ||
                            obj.startsWith('data:image')) {
                            assetUrls.add(obj);
                        }
                    } else if (Array.isArray(obj)) {
                        obj.forEach(traverse);
                    } else if (typeof obj === 'object') {
                        Object.values(obj).forEach(traverse);
                    }
                };
                traverse(config);
                log(\`Found \${assetUrls.size} potential assets\`);

                // Preload Images via DOM 
                let loadedCount = 0;
                
                // [FIX] Add timeout to prevent infinite loading
                const loadTimeout = setTimeout(() => {
                    log('Asset loading timed out - forcing start', 'warn');
                    startGame();
                }, 5000);

                const loadPromises = Array.from(assetUrls).map(url => {
                    // Filter non-images
                    const lower = url.toLowerCase();
                    const isImage = imageExtensions.some(ext => lower.endsWith(ext)) || url.startsWith('data:image');
                    
                    if (!isImage) {
                        return Promise.resolve();
                    }

                    return new Promise((resolve) => {
                        const img = new Image();
                        img.onload = () => {
                            const tex = PIXI.Texture.from(img);
                            textureCache.set(url, tex);
                            log(\`Loaded: \${url}\`);
                            loadedCount++;
                            if(document.getElementById('loading-status')) {
                                document.getElementById('loading-status').innerText = \`\${loadedCount} / \${assetUrls.size}\`;
                            }
                            resolve();
                        };
                        img.onerror = (e) => {
                            log(\`Failed to load: \${url}\`, 'warn'); // Warn but continue
                            resolve(); 
                        };
                        img.src = url;
                    });
                });

                if (loadPromises.length > 0) {
                    await Promise.all(loadPromises);
                }
                clearTimeout(loadTimeout);
                log("Asset Loading Complete");
                
                startGame();

            } catch (e) {
                document.getElementById('loading').innerHTML = '<div style="color:red">Error: ' + e.message + '</div>';
                log(e.message, 'error');
                console.error(e);
            }
        }

        function startGame() {
             // Monkey-patch PIXI.Sprite.from to check our cache first
             const originalFrom = PIXI.Sprite.from;
             PIXI.Sprite.from = (source) => {
                 if (typeof source === 'string') {
                     if (textureCache.has(source)) {
                         return new PIXI.Sprite(textureCache.get(source));
                     }
                 }
                 return originalFrom(source);
             };

             // 4. Build Scene
             setupScene();
             document.getElementById('loading').style.display = 'none';
        }

            } catch (e) {
                document.getElementById('loading').innerHTML = '<div style="color:red">Error: ' + e.message + '</div>';
                log(e.message, 'error');
                console.error(e);
            }
        }

        function setupScene() {
            log('Setting up Scene...');
            if (container) app.stage.removeChild(container);
            container = new PIXI.Container();
            app.stage.addChild(container);

            // A. Background
            var bgUrl = config.theme && config.theme.generated && config.theme.generated.background 
                ? config.theme.generated.background 
                : (config.scratch && config.scratch.layers && config.scratch.layers.scene && config.scratch.layers.scene.value);
            
            // [HEURISTIC] Search for bg image if explicit path is missing
            if (!bgUrl) {
                var potentialBgs = Array.from(assetUrls).filter(function(u) { return u.toLowerCase().includes('bg') || u.toLowerCase().includes('background'); });
                if (potentialBgs.length > 0) bgUrl = potentialBgs[0];
            }

            log('Background Value: ' + bgUrl);

            if (bgUrl) {
                // 1. Image Background
                if (textureCache.has(bgUrl)) {
                    var bg = PIXI.Sprite.from(bgUrl);
                    var ratio = Math.max(app.screen.width / bg.width, app.screen.height / bg.height);
                    bg.scale.set(ratio);
                    bg.anchor.set(0.5);
                    bg.x = app.screen.width / 2;
                    bg.y = app.screen.height / 2;
                    container.addChild(bg);
                    log('Background Loaded (Image)');
                
                // 2. CSS/Hex Background
                } else if (bgUrl.startsWith('#') || bgUrl.includes('rgb') || bgUrl.includes('gradient')) {
                     log('Detected CSS Background');
                     var bgGfx = new PIXI.Graphics();
                     
                     if (bgUrl.includes('gradient')) {
                         // Simple Gradient fallback: Vertical generic dark blue/purple if parsing fails, 
                         // or try to parse simple colors? 
                         // For now, let's just do a nice default gradient if it detects 'gradient' string, 
                         // because parsing complex CSS gradients to Canvas is hard without a library.
                         // But if user says "Gradient Background Not Loading", let's give them a nice default based on mood.
                         
                         var canvas = document.createElement('canvas');
                         canvas.width = 64; canvas.height = 64;
                         var ctx = canvas.getContext('2d');
                         var grd = ctx.createLinearGradient(0,0,0,64);
                         grd.addColorStop(0, '#1e293b'); // Dark Slate
                         grd.addColorStop(1, '#0f172a'); // Darker
                         ctx.fillStyle = grd;
                         ctx.fillRect(0,0,64,64);
                         
                         var tex = PIXI.Texture.from(canvas);
                         bg = new PIXI.Sprite(tex);
                         bg.width = app.screen.width;
                         bg.height = app.screen.height;
                         container.addChild(bg);
                         log('Rendered Procedural Gradient Background');

                     } else {
                         // Solid Color
                         bgGfx.rect(0, 0, app.screen.width, app.screen.height);
                         bgGfx.fill({ color: bgUrl }); // Pixi v8 handles hex/string colors
                         container.addChild(bgGfx);
                         log('Rendered Solid Color Background');
                     }
                } else {
                    log('Background defined but not found in assets/cache', 'warn');
                }
            } else {
                log('No Background defined', 'warn');
            }

            // A.1 [NEW] Logo Layer (Center Top)
            // Look for logo in config
            var logoUrl = (config.theme && config.theme.logo) || (config.marketing && config.marketing.logo) || (config.theme && config.theme.generated && config.theme.generated.logo);
            
            // Heuristic for Logo
            if (!logoUrl) {
                 var potentialLogos = Array.from(assetUrls).filter(function(u) { return u.toLowerCase().includes('logo'); });
                 if (potentialLogos.length > 0) logoUrl = potentialLogos[0];
            }
            
            log('Logo URL: ' + logoUrl);

            if (logoUrl && textureCache.has(logoUrl)) {
                 var logo = PIXI.Sprite.from(logoUrl);
                 // Scale to reasonable size (e.g. 60% of card width)
                 // But we don't know card width yet? Use screen width.
                 var maxLogoW = Math.min(app.screen.width * 0.6, 300);
                 var scale = maxLogoW / logo.width;
                 if (logo.width > maxLogoW) logo.scale.set(scale);
                 
                 logo.anchor.set(0.5, 0); // Top Center
                 logo.x = app.screen.width / 2;
                 logo.y = 40; // Padding from top
                 container.addChild(logo);
                 log('Logo Loaded');
            } else {
                log('Logo not found or missing', 'info');
            }


            // B. Grid / Symbols (Underneath)

            // B. Grid / Symbols (Underneath)
            var gridContainer = new PIXI.Container();
            
            // Standard Layout
            var rows = (config.scratch && config.scratch.layout && config.scratch.layout.rows) || 3;
            var cols = (config.scratch && config.scratch.layout && config.scratch.layout.columns) || 3;
            var cardWidth = Math.min(app.screen.width * 0.8, 500);
            var cardHeight = Math.min(app.screen.height * 0.6, 500);
            var startX = (app.screen.width - cardWidth) / 2;
            var startY = (app.screen.height - cardHeight) / 2 + 50;
            var cellW = cardWidth / cols;
            var cellH = cardHeight / rows;

            // Simple random fill for visual preview
            var symbolValues = Object.values((config.theme && config.theme.generated && config.theme.generated.symbols) || {});
            
            // [HEURISTIC Failsafe] If no symbols found, use ALL other loaded images that aren't bg or surface
            if (symbolValues.length === 0) {
                 log('Explicit Symbols missing. Using all other assets...', 'warn');
                 // Filter out BG and Surface (if known), and misc UI. ALSO filter for valid image extensions.
                 var validExts = ['.png', '.jpg', '.jpeg', '.webp', '.svg'];
                 symbolValues = Array.from(assetUrls).filter(function(u) { 
                    var isImg = validExts.some(function(e) { return u.toLowerCase().endsWith(e); }) || u.startsWith('data:image');
                    return isImg && u !== bgUrl && u !== surfaceUrl && !u.includes('brush') && !u.includes('cursor');
                 });
            }

            log('Found ' + symbolValues.length + ' symbol assets');
            
            for(var r=0; r<rows; r++) {
                for(var c=0; c<cols; c++) {
                    var symUrl = symbolValues.length > 0 
                        ? symbolValues[Math.floor(Math.random() * symbolValues.length)] 
                        : null;
                    
                    if (symUrl) {
                        // log('Creating symbol: ' + symUrl); // Verbose
                        var s = PIXI.Sprite.from(symUrl);
                        s.width = cellW * 0.8;
                        s.height = cellH * 0.8;
                        s.x = startX + c * cellW + (cellW - s.width)/2;
                        s.y = startY + r * cellH + (cellH - s.height)/2;
                        gridContainer.addChild(s);
                    }
                }
            }
            container.addChild(gridContainer);


            // C. Scratch Surface (Cover)
            var surfaceContainer = new PIXI.Container();
            
            // Try to find a cover image 
            // Look for config.scratch.layers.surface.value
            var surfaceUrl = config.scratch && config.scratch.layers && config.scratch.layers.surface && config.scratch.layers.surface.value;
            
            // [HEURISTIC Failsafe] If missing, look for 'cover', 'surface', 'overlay'
            if (!surfaceUrl) {
                 var potentialSurface = Array.from(assetUrls).filter(function(u) { return u.toLowerCase().includes('cover') || u.toLowerCase().includes('surface') || u.toLowerCase().includes('overlay'); });
                 if (potentialSurface.length > 0) surfaceUrl = potentialSurface[0];
            }

            log('Surface URL: ' + surfaceUrl);
            
            var cover;
            // [FIX] Check local textureCache
            // [PROCEDURAL FALLBACK] Handle Presets that aren't external images
            if (surfaceUrl && textureCache.has(surfaceUrl)) {
                 // Use the image texture
                 cover = PIXI.Sprite.from(surfaceUrl);
                 
                 var ratio = Math.max(app.screen.width / cover.width, app.screen.height / cover.height);
                 cover.scale.set(ratio);
                 cover.anchor.set(0.5);
                 cover.x = app.screen.width / 2;
                 cover.y = app.screen.height / 2;
                 log('Surface Loaded');
                 
            } else if (surfaceUrl && (surfaceUrl.includes('foil') || surfaceUrl.includes('gold') || surfaceUrl.includes('silver') || surfaceUrl.includes('sand'))) {
                 log('Detected Procedural Preset: ' + surfaceUrl);
                 var canvas = document.createElement('canvas');
                 canvas.width = 512; canvas.height = 512;
                 var ctx = canvas.getContext('2d');
                 
                 // Procedural Textures
                 if (surfaceUrl.includes('sand')) {
                     // Sand Noise
                     ctx.fillStyle = '#e6c288';
                     ctx.fillRect(0,0,512,512);
                     for(var i=0; i<50000; i++) {
                         ctx.fillStyle = Math.random() > 0.5 ? '#d4a76a' : '#f0d9b5';
                         ctx.fillRect(Math.random()*512, Math.random()*512, 2, 2);
                     }
                 } else if (surfaceUrl.includes('gold')) {
                     // Gold Gradient
                     var grd = ctx.createLinearGradient(0,0,512,512);
                     grd.addColorStop(0, '#bf953f');
                     grd.addColorStop(0.3, '#fcf6ba');
                     grd.addColorStop(0.6, '#b38728');
                     grd.addColorStop(1, '#fbf5b7');
                     ctx.fillStyle = grd;
                     ctx.fillRect(0,0,512,512);
                 } else {
                     // Silver/Generic Foil
                     var grd = ctx.createLinearGradient(0,0,512,512);
                     grd.addColorStop(0, '#a0a0a0');
                     grd.addColorStop(0.5, '#e0e0e0');
                     grd.addColorStop(1, '#a0a0a0');
                     ctx.fillStyle = grd;
                     ctx.fillRect(0,0,512,512);
                     // Add scratching noise
                     for(var i=0; i<10000; i++) {
                          ctx.fillStyle = 'rgba(255,255,255,0.2)';
                          ctx.fillRect(Math.random()*512, Math.random()*512, 2, 2);
                     }
                 }
                 
                 var tex = PIXI.Texture.from(canvas);
                 cover = new PIXI.Sprite(tex);
                 cover.width = cardWidth + 20;
                 cover.height = cardHeight + 20;
                 cover.x = startX - 10;
                 cover.y = startY - 10;
                 log('Generated Procedural Texture');
 
            } else {
                 // Fallback: Gold Rectangle
                 log('Surface NOT found in cache - Using Fallback', 'warn');
                 cover = new PIXI.Graphics();
                 cover.rect(startX - 10, startY - 10, cardWidth + 20, cardHeight + 20);
                 cover.fill({ color: 0xFFD700 });
            }

            surfaceContainer.addChild(cover);

    // D. Masking (The Scratch Effect)
    const renderTexture = PIXI.RenderTexture.create({
        width: app.screen.width,
        height: app.screen.height
    });

    // Setup Mask
    const maskRT = PIXI.RenderTexture.create({ width: app.screen.width, height: app.screen.height });
    const maskSprite = new PIXI.Sprite(maskRT);

    // Fill mask with white (visible)
    const fullQuad = new PIXI.Graphics().rect(0, 0, app.screen.width, app.screen.height).fill(0xffffff);
    app.renderer.render({ container: fullQuad, target: maskRT });

    // Apply mask
    surfaceContainer.mask = maskSprite;
    container.addChild(surfaceContainer);
    container.addChild(maskSprite);
    // Note: maskSprite must be in the display list for some v8 renderers or just 'active', 
    // but we usually set it to raw alpha to be safe.
    // In v8, using a sprite as a mask is valid.

    // Input Handling
    app.stage.eventMode = 'static';
    app.stage.hitArea = app.screen;

    app.stage.on('pointerdown', onDragStart);
    app.stage.on('pointerup', onDragEnd);
    app.stage.on('pointerupoutside', onDragEnd);
    app.stage.on('pointermove', onDragMove);

    const brush = new PIXI.Graphics().circle(0, 0, 40).fill({ color: 0x000000, alpha: 1 });

    function onDragStart() { isDrawing = true; }
    function onDragEnd() { isDrawing = false; }
    function onDragMove(e) {
        if (isDrawing) {
            const pos = e.global;
            brush.position.copyFrom(pos);
            // Erase mode
            brush.blendMode = 'erase';
            app.renderer.render({ container: brush, target: maskRT, clear: false });
        }
    }
}

function resetGame() {
    setupScene();
}

// init(); -> Moved to window.addEventListener('load')
</script>
    </body>
    </html>`;
};
