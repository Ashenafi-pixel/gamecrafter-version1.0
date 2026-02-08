import fetch from 'node-fetch';
import { openDb, get, all } from '../src/db/sqlite.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'rgs.db');

const BASE_URL = 'http://localhost:3500/api/agg';
const HEADERS = {
    'Content-Type': 'application/json',
    'x-operator-id': 'demo_operator',
    'x-timestamp': Date.now().toString(),
    'x-nonce': `verify_${Date.now()}`,
    'x-signature': 'SKIPPED_IN_DEV' // Assuming HMAC_REQUIRED=false in dev
};

async function logStep(title) {
    console.log(`\n=== ${title} ===\n`);
}

async function runTests() {
    const db = openDb(dbPath);
    const playerId = `verify_player_${Date.now()}`;
    const gameId = 'montana-scratch_20260119';
    let roundId;
    let clientTxnId = `txn_${Date.now()}`;

    // 1. Session
    await logStep('1. POST /session');
    const sessionRes = await fetch(`${BASE_URL}/session`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({ playerId, currency: 'USD' })
    });
    console.log('Response:', await sessionRes.json());

    // 2. Play
    await logStep('2. POST /play');
    const playRes = await fetch(`${BASE_URL}/play`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({
            gameId,
            wager: 2.0,
            currency: 'USD',
            playerId,
            clientTxnId
        })
    });
    const playData = await playRes.json();
    console.log('Response:', JSON.stringify(playData, null, 2));
    roundId = playData.roundId;

    if (!roundId) {
        console.error("Play failed, cannot proceed.");
        return;
    }

    // 3. Complete
    await logStep('3. POST /complete');
    const completeRes = await fetch(`${BASE_URL}/complete`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({
            roundId,
            playerId,
            gameId,
            durationMs: 1234
        })
    });
    console.log('Response:', await completeRes.json());

    // 4. DB Proof (Round Lifecycle)
    await logStep('4. DB Proof (Round Lifecycle)');
    console.log('RGS_ROUNDS:', await all(db, `SELECT * FROM rgs_rounds WHERE round_id = ?`, [roundId]));
    console.log('WALLET_TXS:', await all(db, `SELECT type, amount_cents, client_txn_id FROM wallet_transactions WHERE round_id = ? ORDER BY created_at`, [roundId]));
    console.log('RGS_EVENTS:', await all(db, `SELECT event_type, payload_json FROM rgs_events WHERE round_id = ? ORDER BY created_at`, [roundId]));
    console.log('WALLET_ACC:', await all(db, `SELECT balance_cents FROM wallet_accounts WHERE player_id = ?`, [playerId]));

    // 5. Idempotency Check
    await logStep('5. Idempotency Proof (Replay /play)');
    try {
        const replayRes = await fetch(`${BASE_URL}/play`, {
            method: 'POST',
            headers: { ...HEADERS, 'x-nonce': `verify_${Date.now()}_2` }, // New nonce, same txnId
            body: JSON.stringify({
                gameId,
                wager: 2.0,
                currency: 'USD',
                playerId,
                clientTxnId // SAME txnId
            })
        });
        console.log('Replay Response:', await replayRes.json());

        console.log('DB Check (Count per txn):');
        console.log(await all(db, `SELECT type, client_txn_id, count(*) as count FROM wallet_transactions WHERE client_txn_id = ? GROUP BY type, client_txn_id`, [clientTxnId]));
        console.log("Check for WIN txn idempotency as well:");
        console.log(await all(db, `SELECT type, client_txn_id, count(*) as count FROM wallet_transactions WHERE client_txn_id = ? GROUP BY type, client_txn_id`, [`${clientTxnId}:WIN`]));

    } catch (e) { console.error(e); }

    // 6. Rollback
    await logStep('6. Rollback Proof');
    // Start a NEW round for rollback
    const rbTxnId = `rb_${Date.now()}`;
    const rbPlayRes = await fetch(`${BASE_URL}/play`, {
        method: 'POST',
        headers: { ...HEADERS, 'x-nonce': `verify_${Date.now()}_3` },
        body: JSON.stringify({
            gameId,
            wager: 5.0,
            currency: 'USD',
            playerId,
            clientTxnId: rbTxnId
        })
    });
    const rbPlayData = await rbPlayRes.json();
    const rbRoundId = rbPlayData.roundId;
    console.log('New Round for Rollback:', rbRoundId);

    console.log('Balance Before Rollback:', (await get(db, `SELECT balance_cents FROM wallet_accounts WHERE player_id=?`, [playerId])).balance_cents);

    const rollbackRes = await fetch(`${BASE_URL}/rollback`, {
        method: 'POST',
        headers: { ...HEADERS, 'x-nonce': `verify_${Date.now()}_4` },
        body: JSON.stringify({
            roundId: rbRoundId,
            playerId,
            clientTxnId: rbTxnId, // Rollback usually reuses same txnId or links to it? The API expects clientTxnId for the ROLLBACK request itself (idempotency of rollback)
            // Wait, route.js says: `const { roundId, playerId, currency = "USD", clientTxnId, gameId } = req.body;`
            // And uses `clientTxnId: ${clientTxnId}:RB_BET`
            // So we should pass a NEW txnId for the rollback operation, or the original?
            // "clientTxnId (unique per spin)" -> usually rollback is a new operation.
            // Let's pass a new one.
        })
    });
    console.log('Rollback Response:', await rollbackRes.json());

    console.log('Balance After Rollback:', (await get(db, `SELECT balance_cents FROM wallet_accounts WHERE player_id=?`, [playerId])).balance_cents);
    console.log('Rollback DB Txs:', await all(db, `SELECT type, amount_cents FROM wallet_transactions WHERE round_id = ? ORDER BY created_at`, [rbRoundId]));
    console.log('Rollback Round Status:', await get(db, `SELECT status, rolled_back_at FROM rgs_rounds WHERE round_id = ?`, [rbRoundId]));
}

runTests().catch(console.error);
