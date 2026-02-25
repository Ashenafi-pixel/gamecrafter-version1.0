
import { generateCompleteExport, generateScratchHTML } from '../scratch-export-utils';
import { GameConfig } from '../../types/game-config';

// Simulate "Embedded" Config (Base64 Assets)
const MOCK_BASE64_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==";

const mockConfig = {
    displayName: "Verification Scratch Game",
    gameId: "verify_scratch",
    marketing: {
        thumbnail: MOCK_BASE64_PNG
    },
    scratch: {
        background: { image: MOCK_BASE64_PNG },
        math: {
            mathMode: 'POOL',
            totalTickets: 100000,
            rtp: 0.95,
            winLogic: 'SINGLE_WIN'
        },
        layers: {
            scene: { value: MOCK_BASE64_PNG },
            surface: { value: MOCK_BASE64_PNG }
        },
        prizes: [
            { id: 't1', name: 'Grand', payout: 100, weight: 10, probability: 0, image: MOCK_BASE64_PNG }
        ],
        symbols: {
            customAssets: [{ id: 's1', url: MOCK_BASE64_PNG }],
            style: 'standard'
        }
    },
    theme: {
        description: "Test Theme",
        logo: MOCK_BASE64_PNG
    }
} as unknown as GameConfig;

async function verify() {
    console.log("🔍 Starting Base64 Export Verification...");

    try {
        // 1. Generate HTML directly (Simulation of what happens in Step7)
        console.log("-> Generating HTML with Embedded Base64 Config...");

        // In the real app, Step7 generates 'embeddedConfig' by replacing paths with data URIs.
        // Here, 'mockConfig' IS the embedded config.
        const html = generateScratchHTML(mockConfig);

        // 2. Verify HTML Content
        if (!html.includes('<!DOCTYPE html>')) throw new Error("Invalid HTML Structure");
        if (!html.includes(MOCK_BASE64_PNG)) throw new Error("Base64 Data NOT found in HTML");

        // 3. Verify Config Embedding
        if (!html.includes('<script id="game-config"')) throw new Error("Config Script Tag not found");

        console.log("✅ HTML Generated Successfully");
        console.log("✅ Base64 Assets Detected in Output");
        console.log(`ℹ️ HTML Size: ${html.length} chars`);

        console.log("\n🎉 BASE64 EXPORT VERIFIED!");

    } catch (e: any) {
        console.error("\nVERIFICATION FAILED:", e.message);
        process.exit(1);
    }
}

verify();
