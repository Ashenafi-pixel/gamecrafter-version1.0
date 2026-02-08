import sqlite3 from "sqlite3";
import path from "path";

const sqliteVerbose = sqlite3.verbose();

export function openDb(dbPath) {
    const db = new sqliteVerbose.Database(dbPath);
    // Enable WAL mode for concurrency
    db.serialize(() => {
        db.run("PRAGMA journal_mode = WAL;");
        db.run("PRAGMA busy_timeout = 5000;"); // 5s timeout
        db.run("PRAGMA synchronous = NORMAL;");
    });
    return db;
}

export function run(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) return reject(err);
            resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
}

export function get(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) return reject(err);
            resolve(row);
        });
    });
}

export function all(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

export async function exec(db, sql) {
    return new Promise((resolve, reject) => {
        db.exec(sql, (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
}

// Simple transaction wrapper
export async function tx(db, fn) {
    await run(db, "BEGIN IMMEDIATE;");
    try {
        const result = await fn();
        await run(db, "COMMIT;");
        return result;
    } catch (e) {
        await run(db, "ROLLBACK;");
        throw e;
    }
}
