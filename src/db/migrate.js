import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { exec, run, get } from "./sqlite.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function ensureMigrationsTable(db) {
    await run(
        db,
        `CREATE TABLE IF NOT EXISTS migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );`
    );
}

async function hasMigration(db, id) {
    const row = await get(db, "SELECT id FROM migrations WHERE id = ?;", [id]);
    return !!row;
}

async function applyMigration(db, id, sql) {
    await exec(db, sql);
    await run(db, "INSERT INTO migrations (id) VALUES (?);", [id]);
}

export async function runMigrations(db) {
    await ensureMigrationsTable(db);

    const dir = path.join(__dirname, "..", "..", "sql");
    const files = fs
        .readdirSync(dir)
        .filter((f) => f.endsWith(".sql"))
        .sort();

    for (const f of files) {
        const id = f;
        if (await hasMigration(db, id)) continue;

        const sql = fs.readFileSync(path.join(dir, f), "utf8");
        try {
            await applyMigration(db, id, sql);
            console.log(`[migrate] applied ${id}`);
        } catch (e) {
            console.error(`[migrate] failed to apply ${id}:`, e);
            throw e;
        }
    }
}
