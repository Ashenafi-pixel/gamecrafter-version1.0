
import { generateCompleteExport, generateScratchHTML, RGSMathSchema } from '../scratch-export-utils';
import { GameConfig } from '../../types';

// Mock Config from UI (Scenario: Finite Deck, Match 3)
const mockConfig: GameConfig = {
    gameId: 'test_scratch_001',
    displayName: 'Lucky Test',
    scratch: {
        background: { image: 'assets/bg.png' },
        layers: { scene: { value: 'assets/bg.png' } },
        layout: { rows: 3, columns: 3 },
        mechanic: { type: 'match_3' },
        math: {
            mathMode: 'POOL', // Finite Deck
            totalTickets: 100000,
            ticketPrice: 2,
            rtp: 0.95,
            winLogic: 'SINGLE_WIN'
        },
        prizes: [
            { id: 't1', name: 'Grand', payout: 100, weight: 10, probability: 0 },
            { id: 't2', name: 'Mini', payout: 5, weight: 1000, probability: 0 },
            { id: 't3', name: 'Free', payout: 2, weight: 5000, probability: 0 }
        ],
        symbols: {
            customAssets: [{ id: 's1', url: 'assets/s1.png' }],
            style: 'standard'
        }
    },
    marketing: { thumbnailUrl: 'assets/thumb.png' }
} as unknown as GameConfig;

async function verify() {
    console.log("🔍 Starting Comprehensive Export Verification...");

    try {
        // 1. Generate Export Payload
        console.log("-> Generating Export Payload...");
        const result = generateCompleteExport(mockConfig);

        // 2. Verify Metadata
        if (result.meta.type !== 'scratch_card') throw new Error("Meta Type Mismatch");
        console.log("✅ Metadata Verified");

        // 3. Verify Math JSON (Most Critical)
        const math = result.math;
        console.log("-> Verifying Math JSON...");

        // 3.1 Check Mode
        if (math.math_mode !== 'POOL')
            throw new Error(`Math Mode Mismatch! Expected POOL, got ${math.math_mode}`);
        console.log("   ✅ Math Mode: POOL Configured Correctly");

        // 3.2 Check Weights existence (Robustness check)
        const grandPrize = math.prize_table.find(p => p.tier === 't1');
        if (!grandPrize || grandPrize.weight !== 10)
            throw new Error("Prize Weight Mismatch (Grand Prize)");

        if ((grandPrize as any).weight === undefined)
            throw new Error("CRITICAL: Weight property missing from RGS Schema output!");

        console.log("   ✅ Prize Weights Preserved (Grand Prize weight: 10)");

        // 3.3 Check Probability Calculation
        // weight 10 / deck 100000 = 0.0001
        if (Math.abs(grandPrize.probability - 0.0001) > 0.0000001)
            throw new Error(`Probability Calc Error! Expected 0.0001, got ${grandPrize.probability}`);
        console.log("   ✅ Probability Calculation Correct (10/100k = 0.0001)");

        // 3.4 Check LOSE Tier Generation
        const loseTier = math.prize_table.find(p => p.tier === 'LOSE');
        if (!loseTier) throw new Error("LOSE Tier not generated!");
        const expectedLosers = 100000 - (10 + 1000 + 5000);
        if (loseTier.weight !== expectedLosers)
            throw new Error(`Lose Tier Weight Error. Expected ${expectedLosers}, got ${loseTier.weight}`);
        console.log(`   ✅ Lose Tier Auto-Generated (${expectedLosers} tickets)`);

        // 4. Verify Visuals JSON
        console.log("-> Verifying Visuals JSON...");
        const visuals = result.visuals as any;
        if (visuals.scratch?.math) throw new Error("Security Risk: Math data leaked into Visuals JSON!");
        if (visuals.scratch?.prizes) throw new Error("Redundancy: Prizes leaked into Visuals JSON!");
        console.log("   ✅ Visuals Sanitized (No Math/Prizes)");

        // 5. Verify HTML Generation (Enhanced Player)
        console.log("-> Verifying HTML Player...");
        // Pass visuals (cleanConfig) to generator
        const html = generateScratchHTML(visuals);

        if (!html.includes('pixi.min.js')) throw new Error("HTML missing PixiJS CDN link");
        if (!html.includes('Standalone Scratch Mini-Engine')) throw new Error("HTML missing Mini-Engine script code");
        if (!html.includes('const embeddedConfig =')) throw new Error("HTML missing Embedded Config (CORS Fix)");
        if (!html.includes('new Image()')) throw new Error("HTML missing Offline Image Loader (CORS Fix)");
        if (!html.includes('textureCache.set')) throw new Error("HTML missing Texture Cache logic");
        if (!html.includes('#debug-console')) throw new Error("HTML missing Debug Console");

        console.log("   ✅ HTML Player Generated with PixiJS Engine");

        // 6. Verify Asset Manifest
        console.log("-> Verifying Asset Manifest...");
        if (!result.assets || result.assets.length === 0) console.warn("   ℹ️ Asset Manifest Empty (Mock config used relative paths?)");
        else console.log(`   ✅ Asset Manifest Present (${result.assets.length} items)`);

        console.log("\n🎉 ALL CHECKS PASSED: Export Logic is Valid.");

    } catch (e: any) {
        console.error("\nVERIFICATION FAILED:");
        console.error(e.message);
        process.exit(1);
    }
}

verify();
