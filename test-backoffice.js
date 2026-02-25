
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3500/api/rgs';

async function testBackoffice() {
    console.log('=== Starting RGS Backoffice Verification (GLI-11/14) ===');

    const gameId = `rgs_test_${Date.now()}`;
    const mockConfig = {
        gameId: gameId,
        displayName: 'GLI Compliance Test',
        scratch: {
            layout: { rows: 3, columns: 3 },
            mechanic: { type: 'match_3' },
            prizes: [
                { id: 'tier_win', payout: 10, weight: 100 }, // 100% win for test (easier to track)
                { id: 'tier_lose', payout: 0, weight: 0 }
            ]
        }
    };

    try {
        // 1. Publish (Should generate Deck)
        console.log(`\n[1] Publishing game: ${gameId}...`);
        const pubRes = await fetch(`${BASE_URL}/publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameId, ticketId: 'CERT-0001', config: mockConfig })
        });
        if (!pubRes.ok) throw new Error(await pubRes.text());
        console.log('✅ Published. Deck should be generated.');

        // 1.5 Verify Catalog Discovery (Should find the game before play)
        console.log('\n[1.5] Verifying Catalog Discovery...');
        const catRes = await fetch(`${BASE_URL}/analytics/games`);
        const catGames = await catRes.json();
        const foundGame = catGames.find(g => g.id === gameId);

        if (foundGame) {
            console.log(`✅ Catalog Check Passed: Found ${gameId} with status ${foundGame.status}`);
        } else {
            console.error(`Catalog Check Failed: ${gameId} not found in analytics/games`);
        }

        // 2. Play 5 Rounds
        console.log('\n[2] Playing 5 rounds...');
        for (let i = 0; i < 5; i++) {
            const playRes = await fetch(`${BASE_URL}/play`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gameId, bet: 1.0 })
            });
            if (!playRes.ok) throw new Error(await playRes.text());
            process.stdout.write('.');
        }
        console.log('\n✅ 5 Rounds played.');

        // 3. Verify Game History
        console.log('\n[3] Verifying Game History API...');
        const histRes = await fetch(`${BASE_URL}/history?gameId=${gameId}`);
        const history = await histRes.json();
        console.log(`Received ${history.length} history records.`);

        if (history.length >= 5) {
            console.log('✅ History Check Passed: Records found.');
        } else {
            console.error('History Check Failed: Insufficient records.');
        }

        // 4. Verify Financials
        console.log('\n[4] Verifying Financial Reports...');
        const finRes = await fetch(`${BASE_URL}/financials`);
        const stats = await finRes.json();
        console.log('Financial Stats:', stats);

        if (stats.rounds > 0 && stats.totalBet > 0) {
            console.log('✅ Financial Check Passed.');
        } else {
            console.error('Financial Check Failed.');
        }

        // 5. Verify Audit Logs
        console.log('\n[5] Verifying Audit Logs...');
        const auditRes = await fetch(`${BASE_URL}/audit`);
        const logs = await auditRes.json();
        const publishLog = logs.find(l => l.action === 'GAME_PUBLISH' && l.details?.gameId === gameId);

        if (publishLog) {
            console.log('✅ Audit Check Passed: "GAME_PUBLISH" event found.');
        } else {
            console.error('Audit Check Failed: Publish event missing.');
        }

        // 6. Verify Analytics Endpoints
        console.log('\n[6] Verifying Analytics API...');
        const anaRes = await fetch(`${BASE_URL}/analytics/overview`);
        const anaData = await anaRes.json();
        console.log(`Analytics Overview:`, anaData.chartData ? 'Has Data' : 'Empty');

        // Play a round with a specific player ID to test Player Stats
        await fetch(`${BASE_URL}/play`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameId, bet: 5.0, playerId: 'VIP_USER_1' })
        });

        // Polling wait for log to be processed
        console.log('Waiting for player stats to update...');
        let vipUser = null;
        for (let k = 0; k < 10; k++) {
            const playerRes = await fetch(`${BASE_URL}/analytics/players`);
            const playerStats = await playerRes.json();
            vipUser = playerStats.find(p => p.id === 'VIP_USER_1');
            if (vipUser) break;
            await new Promise(r => setTimeout(r, 500));
        }

        if (vipUser && vipUser.totalBet >= 5.0) {
            console.log(`✅ Player Analytics Check Passed: VIP_USER_1 tracked (Total Bet: ${vipUser.totalBet}).`);
        } else {
            console.error(`Player Analytics Check Failed: VIP_USER_1 not found or bet mismatch (Expected >= 5.0).`);
        }

        // 7. Verify Workshop Drafts
        console.log('\n[7] Verifying Workshop API...');
        await fetch(`${BASE_URL}/draft`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                draftId: 'test_draft_123',
                userName: 'Test Creator',
                gameName: 'Workshop Test Game',
                currentStep: 3
            })
        });

        await new Promise(r => setTimeout(r, 500)); // Wait for write

        const draftRes = await fetch(`${BASE_URL}/drafts`);
        const drafts = await draftRes.json();
        const foundDraft = drafts.find(d => d.id === 'test_draft_123');

        if (foundDraft && foundDraft.currentStep === 3) {
            console.log('✅ Workshop Check Passed: Draft saved and retrieved.');
        } else {
            console.error('Workshop Check Failed: Draft not found.');
        }

        console.log('\n=== Verification Complete ===');

    } catch (error) {
        console.error('\nVerification Failed:', error);
    }
}

testBackoffice();
