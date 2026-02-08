
import { createStudio, listStudios } from './src/rgs/studios.js';
import { dbQuery, dbRun } from './src/rgs/database.js';

(async () => {
    try {
        console.log("Creating test studio...");
        const result = await createStudio({
            name: "Test Persistence Studio",
            logo: "https://example.com/logo.png",
            config: { theme: 'dark' }
        });
        console.log("Created:", result);

        console.log("Listing studios...");
        const studios = await listStudios();
        console.log("Studios found:", studios);

        const myStudio = studios.find(s => s.id === result.id);
        if (myStudio && myStudio.logo === "https://example.com/logo.png") {
            console.log("SUCCESS: Studio persisted and logo mapped correctly.");
        } else {
            console.error("FAILURE: Studio not found or logo not mapped.", myStudio);
        }

        // Cleanup
        await dbRun("DELETE FROM rgs_studios WHERE id = ?", [result.id]);
        console.log("Cleanup done.");

    } catch (e) {
        console.error("Test failed", e);
    }
})();
