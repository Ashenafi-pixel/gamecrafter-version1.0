
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const DB_PATH = './rgs.db';

(async () => {
    const db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database
    });
    
    console.log("Cleaning specific games...");
    // Deleting the games visualized in the lobby
    await db.run("DELETE FROM rgs_games WHERE id IN ('rgs_test_1768465727225', 'bibi-bobo_20260118', 'montana-scratch_20260119')");
    
    console.log("Verifying deletion...");
    const remaining = await db.all("SELECT id, display_name FROM rgs_games");
    console.log("Remaining games:", remaining);
})();
