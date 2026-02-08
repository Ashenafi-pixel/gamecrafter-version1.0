import fetch from 'node-fetch';
import { openDb, all, get } from '../src/db/sqlite.js';
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
    'x-nonce': `verify_orphans_${Date.now()}`,
    'x-signature': 'SKIPPED_IN_DEV'
};

async function runTests() {
    const db = openDb(dbPath);
    const playerId = `player_orph_${Date.now()}`;
    const gameId = 'montana-scratch_20260119';
    const clientTxnId = `txn_orph_${Date.now()}`;

    // 1. Session
    await fetch(`${BASE_URL}/session`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({ playerId, currency: 'USD' })
    });

    console.log(`\nReplay Test with ClientTxnId: ${clientTxnId}\n`);

    // 2. Play Call 1
    const res1 = await fetch(`${BASE_URL}/play`, {
        method: 'POST',
        headers: { ...HEADERS, 'x-nonce': 'o1' },
        body: JSON.stringify({ gameId, wager: 2.0, currency: 'USD', playerId, clientTxnId })
    });
    const j1 = await res1.json();
    console.log("Response 1 Round:", j1.roundId);


    // 3. Play Call 2 (Exactly same)
    const res2 = await fetch(`${BASE_URL}/play`, {
        method: 'POST',
        headers: { ...HEADERS, 'x-nonce': 'o2' },
        body: JSON.stringify({ gameId, wager: 2.0, currency: 'USD', playerId, clientTxnId })
    });
    const j2 = await res2.json();
    console.log("Response 2 Round:", j2.roundId);

    // 4. Queries (User Requested)
    console.log("\n[QUERY 1] Count all rounds created for player in last 2 mins");
    const q1 = await all(db, `
        SELECT status, COUNT(*) AS c
        FROM rgs_rounds
        WHERE player_id=?
        AND created_at > datetime('now','-2 minutes')
        GROUP BY status`, [playerId]);
    console.table(q1);

    console.log("\n[QUERY 2] Show orphans (bet_tx_id IS NULL)");
    const q2 = await all(db, `
        SELECT round_id, status, created_at, bet_tx_id, win_tx_id
        FROM rgs_rounds
        WHERE player_id=?
        AND created_at > datetime('now','-2 minutes')
        AND bet_tx_id IS NULL`, [playerId]);
    console.table(q2);

    if (q1.length === 1 && q1[0].c === 1 && q2.length === 0 && j1.roundId === j2.roundId) {
        console.log("\nSUCCESS: 1 Round Total, No Orphans, Identical Round ID returned.");
    } else {
        console.log("\nFAILURE: Unexpected counts or rounds mismatch.");
    }
}

runTests().catch(console.error);
