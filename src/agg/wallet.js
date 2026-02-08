import { tx, get, run } from "../db/sqlite.js";
import { uuid } from "../lib/utils.js";

export async function ensureAccount(db, { operatorId, playerId, currency, initialBalanceCents = 100000 }) {
    // initialBalanceCents default = 1000.00 for demo
    const existing = await get(
        db,
        `SELECT balance_cents FROM wallet_accounts WHERE operator_id=? AND player_id=? AND currency=?;`,
        [operatorId, playerId, currency]
    );
    if (existing) return existing.balance_cents;

    await run(
        db,
        `INSERT INTO wallet_accounts (operator_id, player_id, currency, balance_cents)
     VALUES (?, ?, ?, ?);`,
        [operatorId, playerId, currency, initialBalanceCents]
    );
    return initialBalanceCents;
}

export async function getBalance(db, { operatorId, playerId, currency }) {
    const row = await get(
        db,
        `SELECT balance_cents FROM wallet_accounts WHERE operator_id=? AND player_id=? AND currency=?;`,
        [operatorId, playerId, currency]
    );
    return row ? row.balance_cents : null;
}

/**
 * Applies a ledger transaction with idempotency on (operator,player,currency,type,clientTxnId).
 * Returns the tx row if already exists.
 */
export async function applyLedgerTx(db, { operatorId, playerId, currency, type, amountCents, clientTxnId, roundId }) {
    return tx(db, async () => {
        const existing = await get(
            db,
            `SELECT * FROM wallet_transactions
       WHERE operator_id=? AND player_id=? AND currency=? AND type=? AND client_txn_id=?;`,
            [operatorId, playerId, currency, type, clientTxnId]
        );
        if (existing) return existing;

        const account = await get(
            db,
            `SELECT balance_cents FROM wallet_accounts
       WHERE operator_id=? AND player_id=? AND currency=?;`,
            [operatorId, playerId, currency]
        );
        if (!account) throw new Error("Wallet account missing");

        const newBal = account.balance_cents + amountCents;
        if (newBal < 0) {
            const e = new Error("INSUFFICIENT_FUNDS");
            e.code = "INSUFFICIENT_FUNDS";
            throw e;
        }

        const txId = uuid();
        await run(
            db,
            `INSERT INTO wallet_transactions (tx_id, operator_id, player_id, currency, type, amount_cents, client_txn_id, round_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
            [txId, operatorId, playerId, currency, type, amountCents, clientTxnId, roundId || null]
        );

        await run(
            db,
            `UPDATE wallet_accounts
       SET balance_cents=?, updated_at=datetime('now')
       WHERE operator_id=? AND player_id=? AND currency=?;`,
            [newBal, operatorId, playerId, currency]
        );

        const created = await get(db, `SELECT * FROM wallet_transactions WHERE tx_id=?;`, [txId]);
        return created;
    });
}
