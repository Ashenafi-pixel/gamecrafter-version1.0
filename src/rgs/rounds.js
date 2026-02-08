import { tx, get, run } from "../db/sqlite.js";
import { uuid, randomSeedB64 } from "../lib/utils.js";
import { resolveRound } from "./engine.js";

// Integration with existing engine
export async function resolveOutcome({ gameConfig, seedB64 }) {
    // Call existing logic
    // resolveRound(config, seedProp, forcedTierId)
    const outcome = resolveRound(gameConfig, seedB64);

    // Map to expected operator format
    // Existing engine returns: { gameId, roundId, finalPrize, isWin, tierId, revealMap, presentationSeed }

    // We need to ensure we return what the aggregator expects for outcome_json
    return {
        isWin: outcome.isWin,
        finalPrizeCents: Math.round(Number(outcome.finalPrize || 0) * 100),
        revealMap: outcome.revealMap,
        seedUsed: seedB64,
        // Pass through extra metadata
        tierId: outcome.tierId,
        presentationSeed: outcome.presentationSeed
    };
}

export async function initRound(db, { operatorId, playerId, gameId, currency, wagerCents }) {
    const roundId = `rnd_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const seedB64 = randomSeedB64();

    await run(
        db,
        `INSERT INTO rgs_rounds (round_id, operator_id, player_id, game_id, currency, wager_cents, status, seed_b64)
     VALUES (?, ?, ?, ?, ?, ?, 'INITIATED', ?);`,
        [roundId, operatorId, playerId, gameId, currency, wagerCents, seedB64]
    );

    return { roundId, seedB64 };
}

export async function commitRound(db, { operatorId, roundId, outcome, betTxId, winTxId }) {
    return tx(db, async () => {
        const round = await get(db, `SELECT * FROM rgs_rounds WHERE round_id=? AND operator_id=?;`, [roundId, operatorId]);
        if (!round) throw new Error("ROUND_NOT_FOUND");

        // idempotent commit: if already committed, return stored outcome
        if (round.status === "COMMITTED" || round.status === "COMPLETED") {
            return {
                roundId: round.round_id,
                status: round.status,
                outcome: round.outcome_json ? JSON.parse(round.outcome_json) : null,
            };
        }
        if (round.status === "ROLLED_BACK") throw new Error("ROUND_ALREADY_ROLLED_BACK");

        await run(
            db,
            `UPDATE rgs_rounds
       SET status='COMMITTED', outcome_json=?, bet_tx_id=?, win_tx_id=?, committed_at=datetime('now')
       WHERE round_id=?;`,
            [JSON.stringify(outcome), betTxId || null, winTxId || null, roundId]
        );

        // SYNC TO HISTORY (For Backoffice Reporting)
        // We log the committed round to the history table for analytics
        const finalPrize = outcome.finalPrizeCents ? (outcome.finalPrizeCents / 100) : 0;
        const wager = round.wager_cents ? (round.wager_cents / 100) : 0;

        await run(
            db,
            `INSERT INTO rgs_history (
                game_id, round_id, player_id, operator_id, bet, win, currency, timestamp, details
            ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)`,
            [
                round.game_id,
                roundId,
                round.player_id,
                round.operator_id,
                wager,
                finalPrize,
                round.currency,
                JSON.stringify({ outcome, presentationSeed: outcome.presentationSeed })
            ]
        );

        return { roundId, status: "COMMITTED", outcome };
    });
}

export async function completeRound(db, { operatorId, roundId, durationMs }) {
    return tx(db, async () => {
        const round = await get(db, `SELECT * FROM rgs_rounds WHERE round_id=? AND operator_id=?;`, [roundId, operatorId]);
        if (!round) throw new Error("ROUND_NOT_FOUND");
        if (round.status === "ROLLED_BACK") throw new Error("ROUND_ALREADY_ROLLED_BACK");

        if (round.status === "COMPLETED") {
            return { roundId, status: "COMPLETED" };
        }
        if (round.status !== "COMMITTED") {
            throw new Error("ROUND_NOT_COMMITTED");
        }

        await run(
            db,
            `UPDATE rgs_rounds SET status='COMPLETED', completed_at=datetime('now') WHERE round_id=?;`,
            [roundId]
        );

        // store extra completion info as an event rather than mutating rounds schema further
        return { roundId, status: "COMPLETED", durationMs };
    });
}

export async function rollbackRound(db, { operatorId, roundId }) {
    return tx(db, async () => {
        const round = await get(db, `SELECT * FROM rgs_rounds WHERE round_id=? AND operator_id=?;`, [roundId, operatorId]);
        if (!round) throw new Error("ROUND_NOT_FOUND");

        if (round.status === "ROLLED_BACK") {
            return { roundId, status: "ROLLED_BACK", betTxId: round.bet_tx_id, winTxId: round.win_tx_id };
        }

        // Allow rollback from INITIATED or COMMITTED
        // If COMPLETED you may still allow rollback based on operator rules; keep it allowed for now
        await run(
            db,
            `UPDATE rgs_rounds SET status='ROLLED_BACK', rolled_back_at=datetime('now') WHERE round_id=?;`,
            [roundId]
        );

        return { roundId, status: "ROLLED_BACK", betTxId: round.bet_tx_id, winTxId: round.win_tx_id };
    });
}
