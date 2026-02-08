
import { dbRun, dbQuery, dbGet } from './database.js';

/**
 * Log an administrative action (GLI-11: Significant Event Log)
 */
export const logAudit = async (action, details, user = 'SYSTEM') => {
    try {
        await dbRun(
            `INSERT INTO rgs_audit (action, user_id, details) VALUES (?, ?, ?)`,
            [action, user, JSON.stringify(details)]
        );
    } catch (error) {
        console.error('CRITICAL: Failed to write to audit log', error);
    }
};

/**
 * Log a game round transaction (GLI-11: Game History)
 */
export const logGameRound = async (roundData) => {
    // roundData: { gameId, roundId, playerId, operatorId, bet, win, currency, details... }
    const { gameId, roundId, playerId, operatorId, bet, win, currency, ...details } = roundData;

    try {
        await dbRun(
            `INSERT INTO rgs_history (
                game_id, round_id, player_id, operator_id, bet, win, currency, details
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                gameId,
                roundId,
                playerId || 'guest',
                operatorId || 'demo',
                bet || 0,
                win || 0,
                currency || 'USD',
                JSON.stringify(details)
            ]
        );
    } catch (error) {
        console.error('CRITICAL: Failed to write to game history log', error);
    }
};

/**
 * Update a game round with completion data
 */
export const updateGameRound = async (roundId, completedAt, durationMs) => {
    try {
        await dbRun(
            `UPDATE rgs_history 
             SET completed_at = ?, duration_ms = ? 
             WHERE round_id = ?`,
            [completedAt, durationMs, roundId]
        );
        console.log(`[Backoffice] Updated round ${roundId} with duration ${durationMs}ms`);
        return true;
    } catch (error) {
        console.error('CRITICAL: Failed to update game history', error);
        return false;
    }
};

/**
 * Retrieve Single Game Round (Inspector)
 */
export const getGameRound = async (roundId) => {
    try {
        const rows = await dbQuery(
            `SELECT * FROM rgs_history WHERE round_id = ?`,
            [roundId]
        );
        if (rows.length === 0) return null;

        const row = rows[0];
        return {
            ...row,
            details: JSON.parse(row.details || '{}')
        };
    } catch (error) {
        console.error('Error fetching round', error);
        return null;
    }
};

/**
 * Retrieve Audit Logs
 */
export const getAuditLogs = async (limit = 100) => {
    try {
        const rows = await dbQuery(
            `SELECT * FROM rgs_audit ORDER BY timestamp DESC LIMIT ?`,
            [limit]
        );
        return rows.map(r => ({
            ...r,
            details: JSON.parse(r.details)
        }));
    } catch (error) {
        console.error('Error reading audit logs', error);
        return [];
    }
};

/**
 * Retrieve Game History
 */
export const getGameHistory = async (gameId = null, limit = 50) => {
    try {
        let sql = `SELECT * FROM rgs_history`;
        const params = [];

        if (gameId) {
            sql += ` WHERE game_id = ?`;
            params.push(gameId);
        }

        sql += ` ORDER BY timestamp DESC LIMIT ?`;
        params.push(limit);

        const rows = await dbQuery(sql, params);

        // Map to expected format
        return rows.map(r => ({
            gameId: r.game_id,
            roundId: r.round_id,
            playerId: r.player_id,
            bet: r.bet,
            win: r.win,
            timestamp: r.timestamp,
            ...JSON.parse(r.details)
        }));
    } catch (error) {
        console.error('Error reading game history', error);
        return [];
    }
};

/**
 * Generate Financial Report
 */
export const getFinancialStats = async () => {
    try {
        const result = await dbGet(`
            SELECT 
                COUNT(*) as rounds,
                SUM(bet) as totalBet,
                SUM(win) as totalWon
            FROM rgs_history
        `);

        const totalBet = result.totalBet || 0;
        const totalWon = result.totalWon || 0;

        return {
            totalBet,
            totalWon,
            rounds: result.rounds,
            rtp: totalBet > 0 ? (totalWon / totalBet) : 0,
            netGamingRevenue: totalBet - totalWon
        };
    } catch (error) {
        console.error('Error calculating financials', error);
        return { error: 'Failed' };
    }
};

// --- EXTENDED ANALYTICS ---

/**
 * Get Analytics Data for Charts (Hourly)
 */
export const getAnalyticsData = async () => {
    try {
        // SQLite doesn't have robust date grouping built-in everywhere, 
        // but strftime works. We want hours for today/overall.
        // Let's just grab recent history and aggregate in JS for simplicity with timezone, 
        // OR use SQL group by hour. SQL is cleaner.

        const rows = await dbQuery(`
            SELECT 
                strftime('%H:00', timestamp) as name,
                SUM(bet) as bets,
                SUM(win) as wins,
                COUNT(*) as rounds
            FROM rgs_history
            GROUP BY 1
            ORDER BY 1 ASC
        `);

        const chartData = rows.map(r => ({
            name: r.name,
            GGR: r.bets - r.wins,
            Bets: r.bets,
            Rounds: r.rounds
        }));

        return { chartData };

    } catch (error) {
        console.error('Error getting analytics', error);
        return { chartData: [] };
    }
};

/**
 * Get Player Statistics
 */
export const getPlayerStats = async () => {
    try {
        const rows = await dbQuery(`
            SELECT 
                player_id as id,
                SUM(bet) as totalBet,
                SUM(win) as totalWin,
                COUNT(*) as rounds,
                MAX(timestamp) as lastActive
            FROM rgs_history
            GROUP BY player_id
        `);

        return rows.map(p => ({
            ...p,
            ngr: p.totalBet - p.totalWin,
            rtp: p.totalBet > 0 ? (p.totalWin / p.totalBet) : 0
        }));

    } catch (error) {
        return [];
    }
};

/**
 * Get Game Performance Stats (Merged with Catalog from DB)
 */
export const getGamePerformance = async () => {
    try {
        // 1. Stats from History
        const stats = await dbQuery(`
            SELECT 
                game_id as id,
                SUM(bet) as totalBet,
                SUM(win) as totalWin,
                COUNT(*) as rounds,
                SUM(CASE WHEN win > 0 THEN 1 ELSE 0 END) as wins,
                MAX(timestamp) as lastPlayed
            FROM rgs_history
            GROUP BY game_id
        `);

        const statsMap = {};
        stats.forEach(s => statsMap[s.id] = s);

        // 2. Games from Catalog Table
        const games = await dbQuery(`SELECT * FROM rgs_games`);

        // Merge
        // Note: If a game is in history but not in catalog (legacy), we still show it
        const allIds = new Set([...games.map(g => g.id), ...stats.map(s => s.id)]);

        const result = [];

        for (const id of allIds) {
            const gameDef = games.find(g => g.id === id);
            const gameStats = statsMap[id];

            const totalBet = gameStats?.totalBet || 0;
            const totalWin = gameStats?.totalWin || 0;
            const rounds = gameStats?.rounds || 0;

            result.push({
                id,
                name: gameDef?.display_name || id,
                version: gameDef?.version,
                publishedAt: gameDef?.published_at,
                status: gameStats ? 'LIVE' : (gameDef?.status || 'READY'),
                totalBet,
                totalWin,
                rounds,
                wins: gameStats?.wins || 0,
                lastPlayed: gameStats?.lastPlayed || null,
                rtp: totalBet > 0 ? (totalWin / totalBet) : 0,
                hitRate: rounds > 0 ? ((gameStats?.wins || 0) / rounds) : 0
            });
        }

        return result;

    } catch (error) {
        console.error('Error getting game performance:', error);
        return [];
    }
};
