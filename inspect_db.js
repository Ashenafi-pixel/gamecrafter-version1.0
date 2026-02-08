
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

const DB_PATH = './rgs.db';

(async () => {
    const db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database
    });

    console.log("Reading games from DB...");
    const games = await db.all("SELECT id, display_name, status FROM rgs_games");
    console.log("Found games:", games);

    // Only if we want to clean them:
    // console.log("Cleaning games...");
    // await db.run("DELETE FROM rgs_games");
    // console.log("Cleaned.");
})();
