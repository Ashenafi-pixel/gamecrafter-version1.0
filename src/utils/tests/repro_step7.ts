
import { generateScratchHTML } from '../scratch-export-utils';

// Mock Config mimicking the structure in Step7
const mockConfig = {
    gameId: 'test_game',
    displayName: 'Test Game',
    scratch: {
        background: { image: 'assets/bg.png' },
        layers: { scene: { value: 'assets/bg.png' } },
        mechanic: { type: 'match_3' }
    },
    marketing: { description: 'test' },
    theme: { color: 'blue' }
};

// 2. Simulate Step7 Logic (FIXED VERSION)
async function runStep7Logic() {
    console.log("--- Simulating Step7 Export Logic (FIXED) ---");

    // Line 218 in Step7_Export.tsx (FIXED VERSION)
    const fullConfig = {
        scratch: mockConfig.scratch || {}, // Fixed: Keep nested structure
        marketing: mockConfig.marketing,
        theme: mockConfig.theme
    };

    console.log("Config Keys:", Object.keys(fullConfig));

    // Simulate processValue (simplified - just returns as is for structure check)
    const cleanConfig = JSON.parse(JSON.stringify(fullConfig));

    // Simulate Embedded Config (simplified)
    const embeddedConfig = cleanConfig; // Assume assets handled

    // Generate HTML
    const html = generateScratchHTML(embeddedConfig);

    console.log("--- Generated HTML Analysis ---");
    // Check if "scratch" property exists in the embedded JSON
    const jsonMatch = html.match(/<script id="game-config" type="application\/json">\s*(.*?)\s*<\/script>/s);
    if (jsonMatch) {
        const embeddedJson = JSON.parse(jsonMatch[1]);
        console.log("Embedded JSON Keys:", Object.keys(embeddedJson));

        if (!embeddedJson.scratch) {
            console.error("CRITICAL: 'scratch' property is MISSING in embedded config!");
            process.exit(1);
        } else {
            console.log("✅ 'scratch' property is present. Verification PASSED.");
        }
    } else {
        console.error("Could not find embedded JSON in HTML");
        process.exit(1);
    }
}

runStep7Logic();
