import { dbRun, dbQuery } from './database.js';

// Save a draft to the database
export const saveDraft = async (draftId, data) => {
    const { userName, gameName, description, currentStep, config } = data;

    // Check if ID exists, or use upsert logic
    // SQLite doesn't have simple UPSERT until recent versions, so we'll use INSERT OR REPLACE

    const query = `
        INSERT OR REPLACE INTO rgs_drafts (
            id, user_id, game_name, description, current_step, data, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `;

    // We store the full payload in 'data' column
    const jsonData = JSON.stringify(data);

    try {
        await dbRun(query, [
            draftId,
            userName || 'anonymous',
            gameName || 'Untitled',
            description || '',
            currentStep || 0,
            jsonData
        ]);
        console.log(`[Workshop] Saved draft ${draftId} to DB`);
        return true;
    } catch (err) {
        console.error('[Workshop] DB Save Error:', err);
        throw err;
    }
};

// List all active drafts
export const listDrafts = async () => {
    try {
        const rows = await dbQuery(`
            SELECT * FROM rgs_drafts 
            ORDER BY updated_at DESC
        `);

        // Map back to the expected format
        return rows.map(row => {
            const data = JSON.parse(row.data);
            return {
                ...data,
                draftId: row.id,
                lastUpdated: row.updated_at
            };
        });
    } catch (err) {
        console.error('[Workshop] DB List Error:', err);
        return [];
    }
};
// Delete a draft
// Delete a draft and its associated files
export const deleteDraft = async (draftId) => {
    try {
        // 1. Delete from DB
        await dbRun('DELETE FROM rgs_drafts WHERE id = ?', [draftId]);
        console.log(`[Workshop] Deleted draft ${draftId} from DB`);

        // 2. Delete Folder (if exists)
        // We know games are stored in ../../games/[draftId] relative to this file
        const { promises: fs } = await import('fs');
        const path = await import('path');
        const { fileURLToPath } = await import('url');

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        const gameDir = path.resolve(__dirname, '../../games', draftId);

        // Check if exists before trying to delete
        try {
            await fs.rm(gameDir, { recursive: true, force: true });
            console.log(`[Workshop] Deleted folder: ${gameDir}`);
        } catch (fsErr) {
            console.warn(`[Workshop] Failed to delete folder ${gameDir}:`, fsErr.message);
            // Non-fatal, maybe folder didn't exist
        }

        return true;
    } catch (err) {
        console.error('[Workshop] DB Delete Error:', err);
        throw err;
    }
};
