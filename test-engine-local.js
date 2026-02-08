
import { resolveRound } from './src/rgs/engine.js';

const config = {
    gameId: 'test-local',
    scratch: {
        layout: { rows: 3, columns: 3 },
        prizes: [
            { id: 'WIN', value: 100, payout: 100, isWin: true, weight: 1000 },
            { id: 'LOSE', value: 0, payout: 0, isWin: false, weight: 1000 }
        ],
        mechanic: { type: 'match_3' },
        winLogic: 'SINGLE_WIN'
    }
};

try {
    console.log("Testing Engine Logic Locally...");
    const outcome = resolveRound(config, "seed-123");
    console.log("Outcome Generated:");
    console.log(outcome.revealMap);
    console.log("Is Win:", outcome.isWin);
    console.log("Success!");
} catch (e) {
    console.error("Engine Block Failed:", e);
}
