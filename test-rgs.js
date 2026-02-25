
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3500/api/rgs';

async function testRGS() {
    console.log('=== Starting RGS Verification ===');

    // 1. Define a mock game configuration
    const mockConfig = {
        gameId: 'test_scratch_001',
        displayName: 'RGS Test Game',
        scratch: {
            layout: { rows: 3, columns: 3 },
            mechanic: { type: 'match_3' },
            prizes: [
                { id: 'p1', payout: 100, weight: 10 },
                { id: 'p2', payout: 10, weight: 40 },
                { id: 'p3', payout: 0, weight: 50 }
            ]
        }
    };

    try {
        // 2. Test Publishing
        console.log('\n[1] Testing /publish endpoint...');
        const publishResponse = await fetch(`${BASE_URL}/publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                gameId: mockConfig.gameId,
                ticketId: 'TEST-TKT-001',
                config: mockConfig
            })
        });

        if (!publishResponse.ok) {
            throw new Error(`Publish failed: ${publishResponse.status} ${publishResponse.statusText}`);
        }

        const publishResult = await publishResponse.json();
        console.log('✅ Publish Successful:', publishResult);


        // 3. Test Playing
        console.log('\n[2] Testing /play endpoint (5 rounds)...');

        for (let i = 0; i < 5; i++) {
            const playResponse = await fetch(`${BASE_URL}/play`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gameId: mockConfig.gameId,
                    currency: 'USD',
                    bet: 2.0
                })
            });

            if (!playResponse.ok) {
                throw new Error(`Play failed: ${playResponse.status} ${playResponse.statusText}`);
            }

            const playResult = await playResponse.json();
            console.log(`Round ${i + 1}: Result:`, playResult.round?.isWin ? 'WIN' : 'LOSE', '| Prize:', playResult.round?.win);
            // console.log('Details:', JSON.stringify(playResult, null, 2));
        }

        console.log('\n=== Verification Complete: SUCCESS ===');

    } catch (error) {
        console.error('\nVerification Failed:', error.message);
        if (error.cause) console.error(error.cause);
    }
}

testRGS();
