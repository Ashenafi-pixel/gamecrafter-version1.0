import express from "express";
import { toCents, fromCents, uuid } from "../lib/utils.js";
import { logEvent } from "../lib/events.js";
import { ensureAccount, getBalance, applyLedgerTx } from "./wallet.js";
import { initRound, resolveOutcome, commitRound, completeRound, rollbackRound } from "../rgs/rounds.js";
import { openDb, get } from "../db/sqlite.js";

// Load Game Config from RGS Games Table
async function loadGameConfig(db, gameId) {
    // Import 'get' locally if not available in scope, or rely on it being imported if in scope.
    // However, clean approach is to use the `get` helper if available. 
    // Wait, `get` is imported at top level line 6.

    const row = await get(db, 'SELECT config FROM rgs_games WHERE id = ?', [gameId]);
    if (row && row.config) {
        try {
            const parsed = JSON.parse(row.config);
            // Ensure internal consistency
            if (!parsed.gameId) parsed.gameId = gameId;
            return parsed;
        } catch (e) {
            console.error('[AGG] Failed to parse game config:', e);
        }
    }

    console.warn('[AGG] Game config not found, using fallback for:', gameId);
    return { gameId, scratch: { prizes: [] } }; // Fallback
}

export function aggRoutes({ db }) {
    const r = express.Router();

    // create or restore a player session (for demo)
    r.post("/session", async (req, res) => {
        try {
            const operatorId = req.operatorId || req.body.operatorId || "demo_operator";
            const playerId = req.body.playerId;
            const currency = req.body.currency || "USD";

            if (!playerId) return res.status(400).json({ error: "playerId required" });

            await ensureAccount(db, { operatorId, playerId, currency, initialBalanceCents: 100000 });

            await logEvent(db, {
                operatorId,
                playerId,
                eventType: "SESSION_CREATED",
                payload: { currency },
            });

            const bal = await getBalance(db, { operatorId, playerId, currency });
            return res.json({ success: true, operatorId, playerId, currency, balance: fromCents(bal) });
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: "SESSION_FAILED" });
        }
    });

    /**
     * PLAY = operator-grade flow:
     * 1) ensure account exists
     * 2) init round (RGS)
     * 3) apply BET ledger (idempotent)
     * 4) resolve outcome (RGS)
     * 5) apply WIN ledger (idempotent, only if win > 0)
     * 6) commit round (idempotent)
     * 7) return outcome + balance
     *
     * REQUIRED:
     * - clientTxnId (idempotency)
     */
    r.post("/play", async (req, res) => {
        try {
            const operatorId = req.operatorId || req.body.operatorId || "demo_operator";
            const { gameId, wager, currency = "USD", playerId, clientTxnId } = req.body;

            if (!gameId || !playerId || wager == null || !clientTxnId) {
                return res.status(400).json({ error: "gameId, playerId, wager, clientTxnId required" });
            }

            const wagerCents = toCents(wager);

            await ensureAccount(db, { operatorId, playerId, currency, initialBalanceCents: 100000 });

            // IDEMPOTENCY CHECK (PRE-ROUND)
            // Prevent orphan rounds by checking if this clientTxnId was already processed.
            const existingBet = await get(
                db,
                `SELECT round_id FROM wallet_transactions 
                 WHERE operator_id=? AND player_id=? AND type='BET' AND client_txn_id=?`,
                [operatorId, playerId, clientTxnId]
            );

            if (existingBet) {
                // Return existing result
                const round = await get(db, `SELECT * FROM rgs_rounds WHERE round_id=?`, [existingBet.round_id]);
                if (!round) throw new Error("ROUND_MISSING_FOR_EXISTING_TX");

                const bal = await getBalance(db, { operatorId, playerId, currency });
                return res.json({
                    success: true,
                    roundId: round.round_id,
                    outcome: round.outcome_json ? JSON.parse(round.outcome_json) : null,
                    balance: fromCents(bal),
                });
            }

            // Create round first (ties everything together)
            const { roundId, seedB64 } = await initRound(db, {
                operatorId,
                playerId,
                gameId,
                currency,
                wagerCents,
            });

            await logEvent(db, {
                operatorId,
                playerId,
                roundId,
                gameId,
                eventType: "ROUND_INITIATED",
                payload: { wagerCents, clientTxnId },
            });

            // BET tx (debit) with idempotency
            let betTx;
            try {
                betTx = await applyLedgerTx(db, {
                    operatorId,
                    playerId,
                    currency,
                    type: "BET",
                    amountCents: -wagerCents,
                    clientTxnId,
                    roundId,
                });
            } catch (e) {
                if (e.code === "INSUFFICIENT_FUNDS") {
                    await logEvent(db, {
                        operatorId,
                        playerId,
                        roundId,
                        gameId,
                        eventType: "BET_DECLINED",
                        payload: { reason: "INSUFFICIENT_FUNDS", wagerCents, clientTxnId },
                    });
                    return res.status(402).json({ error: "INSUFFICIENT_FUNDS" });
                }
                throw e;
            }

            await logEvent(db, {
                operatorId,
                playerId,
                roundId,
                gameId,
                eventType: "BET_AUTHORIZED",
                payload: { txId: betTx.tx_id, wagerCents, clientTxnId },
            });

            // Resolve outcome in RGS
            const gameConfig = await loadGameConfig(db, gameId);
            const outcome = await resolveOutcome({ gameConfig, seedB64 });

            const winCents = Math.max(0, Number(outcome.finalPrizeCents || 0));

            // WIN tx with separate idempotency key derived from clientTxnId
            let winTx = null;
            if (winCents > 0) {
                winTx = await applyLedgerTx(db, {
                    operatorId,
                    playerId,
                    currency,
                    type: "WIN",
                    amountCents: winCents,
                    clientTxnId: `${clientTxnId}:WIN`,
                    roundId,
                });

                await logEvent(db, {
                    operatorId,
                    playerId,
                    roundId,
                    gameId,
                    eventType: "WIN_APPLIED",
                    payload: { txId: winTx.tx_id, winCents, baseClientTxnId: clientTxnId },
                });
            }

            // Commit round in RGS
            const committed = await commitRound(db, {
                operatorId,
                roundId,
                outcome: {
                    ...outcome,
                    finalPrize: fromCents(winCents),
                    finalPrizeCents: winCents,
                },
                betTxId: betTx.tx_id,
                winTxId: winTx ? winTx.tx_id : null,
            });

            await logEvent(db, {
                operatorId,
                playerId,
                roundId,
                gameId,
                eventType: "ROUND_COMMITTED",
                payload: { status: committed.status },
            });

            const bal = await getBalance(db, { operatorId, playerId, currency });

            return res.json({
                success: true,
                roundId,
                outcome: committed.outcome,
                balance: fromCents(bal),
            });
        } catch (e) {
            console.error("PLAY_FAILED error:", e);
            return res.status(500).json({ error: "PLAY_FAILED", details: e.message });
        }
    });

    r.post("/complete", async (req, res) => {
        try {
            const operatorId = req.operatorId || req.body.operatorId || "demo_operator";
            const { roundId, durationMs, playerId, gameId } = req.body;
            if (!roundId) return res.status(400).json({ error: "roundId required" });

            const result = await completeRound(db, { operatorId, roundId, durationMs });

            await logEvent(db, {
                operatorId,
                playerId: playerId || null,
                roundId,
                gameId: gameId || null,
                eventType: "ROUND_COMPLETED",
                payload: { durationMs: durationMs || null },
            });

            return res.json({ success: true, ...result });
        } catch (e) {
            console.error(e);
            return res.status(500).json({ error: "COMPLETE_FAILED" });
        }
    });

    /**
     * Rollback:
     * - marks round rolled back in RGS
     * - reverses wallet txs (if they exist) using ledger reversal transactions
     */
    r.post("/rollback", async (req, res) => {
        try {
            const operatorId = req.operatorId || req.body.operatorId || "demo_operator";
            const { roundId, playerId, currency = "USD", clientTxnId, gameId } = req.body;
            if (!roundId || !playerId || !clientTxnId) {
                return res.status(400).json({ error: "roundId, playerId, clientTxnId required" });
            }

            await logEvent(db, {
                operatorId,
                playerId,
                roundId,
                gameId: gameId || null,
                eventType: "ROLLBACK_REQUESTED",
                payload: { clientTxnId },
            });

            const rb = await rollbackRound(db, { operatorId, roundId });

            // Reverse bet: credit wager back if bet tx existed
            // Reverse win: debit win back if win tx existed
            // Use separate idempotent reversal keys
            // NOTE: if your win tx doesn't exist (no win), reversal won't happen.
            // We need to look up original tx amounts.

            // We need to fetch the original txs to get amounts to reverse
            // We can use the exposed `get` from sqlite.js
            // But we are in routes.js, so we might need to import `get` directly or use `db.get` if it's the raw db
            // `db` passed here is the raw sqlite3 database instance

            // Since `openDb` returns a raw sqlite3 db (verbose), we can use our helper `get`
            // But `get` expects the wrapped behavior or the db instance? 
            // Our `get` helper in `sqlite.js` takes `db`.

            // Let's import `get` from `../db/sqlite.js` (already imported above)
            // Wait, is it imported? No.
            // `import { openDb } from "../db/sqlite.js";` -> I should import `get` too.
            // Actually I should verify imports at top.
            const { get } = await import("../db/sqlite.js"); // Dynamic import to be safe or add to top

            const bet = rb.betTxId ? await get(db, "SELECT * FROM wallet_transactions WHERE tx_id=?;", [rb.betTxId]) : null;
            const win = rb.winTxId ? await get(db, "SELECT * FROM wallet_transactions WHERE tx_id=?;", [rb.winTxId]) : null;

            if (bet) {
                await applyLedgerTx(db, {
                    operatorId,
                    playerId,
                    currency,
                    type: "ROLLBACK_BET",
                    amountCents: Math.abs(bet.amount_cents), // bet amount is negative; reverse is positive
                    clientTxnId: `${clientTxnId}:RB_BET`,
                    roundId,
                });
            }

            if (win) {
                await applyLedgerTx(db, {
                    operatorId,
                    playerId,
                    currency,
                    type: "ROLLBACK_WIN",
                    amountCents: -Math.abs(win.amount_cents), // win amount is positive; reverse is negative
                    clientTxnId: `${clientTxnId}:RB_WIN`,
                    roundId,
                });
            }

            await logEvent(db, {
                operatorId,
                playerId,
                roundId,
                gameId: gameId || null,
                eventType: "ROUND_ROLLED_BACK",
                payload: { hadBet: !!bet, hadWin: !!win },
            });

            const bal = await getBalance(db, { operatorId, playerId, currency });
            return res.json({ success: true, roundId, status: rb.status, balance: fromCents(bal) });
        } catch (e) {
            console.error(e);
            return res.status(500).json({ error: "ROLLBACK_FAILED" });
        }
    });

    return r;
}
