
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '../../rgs.db');

let dbPromise = null;

export const getDb = async () => {
    if (dbPromise) return dbPromise;

    dbPromise = open({
        filename: DB_PATH,
        driver: sqlite3.Database
    });

    const db = await dbPromise;
    // Enable WAL mode for concurrency
    await db.exec("PRAGMA journal_mode = WAL;");
    await db.exec("PRAGMA busy_timeout = 5000;");
    await db.exec("PRAGMA synchronous = NORMAL;");

    await initSchema(db);
    return db;
};

const initSchema = async (db) => {
    // 1. DRAFTS (Workshop)
    await db.exec(`
        CREATE TABLE IF NOT EXISTS rgs_drafts (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            game_name TEXT,
            description TEXT,
            current_step INTEGER,
            data JSON,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 2. STUDIOS (New)
    await db.exec(`
        CREATE TABLE IF NOT EXISTS rgs_studios (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            logo_url TEXT,
            config JSON,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 3. GAMES (Catalog)
    await db.exec(`
        CREATE TABLE IF NOT EXISTS rgs_games (
            id TEXT PRIMARY KEY,
            studio_id TEXT, -- Link to Studio
            display_name TEXT,
            version TEXT,
            status TEXT DEFAULT 'READY', 
            config JSON,
            published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            total_spins INTEGER DEFAULT 0,
            total_wager REAL DEFAULT 0,
            total_payout REAL DEFAULT 0
        )
    `);

    // 3. HISTORY (Game Rounds)
    await db.exec(`
        CREATE TABLE IF NOT EXISTS rgs_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            game_id TEXT NOT NULL,
            round_id TEXT NOT NULL,
            player_id TEXT,
            operator_id TEXT,
            bet REAL,
            win REAL,
            currency TEXT DEFAULT 'USD',
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            started_at DATETIME,
            completed_at DATETIME,
            duration_ms INTEGER,
            details JSON
        )
    `);

    // 4. AUDIT (Admin Logs)
    await db.exec(`
        CREATE TABLE IF NOT EXISTS rgs_audit (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action TEXT NOT NULL,
            user_id TEXT DEFAULT 'system',
            details JSON,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Performance Indexes
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_history_game ON rgs_history(game_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_history_player ON rgs_history(player_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_history_time ON rgs_history(timestamp)`);

    // MIGRATIONS
    try {
        await db.exec(`ALTER TABLE rgs_games ADD COLUMN studio_id TEXT`);
        console.log('[RGS-DB] Migrated: Added studio_id to rgs_games');
    } catch (e) {
        // Column likely exists
    }

    console.log('[RGS-DB] Database initialized at', DB_PATH);
};

// Helper: Run a query
export const dbQuery = async (sql, params = []) => {
    const db = await getDb();
    return db.all(sql, params);
};

// Helper: Run a command (Insert/Update)
export const dbRun = async (sql, params = []) => {
    const db = await getDb();
    return db.run(sql, params);
};

// Helper: Get single row
export const dbGet = async (sql, params = []) => {
    const db = await getDb();
    return db.get(sql, params);
};
