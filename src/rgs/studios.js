
import { dbQuery, dbRun, dbGet } from './database.js';
import crypto from 'crypto';

/**
 * List all studios
 */
export const listStudios = async () => {
    try {
        const rows = await dbQuery('SELECT * FROM rgs_studios ORDER BY name ASC');
        return rows.map(r => ({
            ...r,
            logo: r.logo_url, // Map DB column to frontend prop
            config: JSON.parse(r.config || '{}')
        }));
    } catch (error) {
        console.error('Error listing studios', error);
        return [];
    }
};

/**
 * Create a new studio
 */
export const createStudio = async (data) => {
    const { name, logo, logo_url, config } = data;
    // Use logo (frontend) or logo_url (backend)
    const finalLogoUrl = logo || logo_url;

    // Generate ID from name if not provided (e.g., "Neon Gaming" -> "neon_gaming")
    const id = data.id || name.toLowerCase().replace(/[^a-z0-9]/g, '_');

    try {
        await dbRun(
            `INSERT INTO rgs_studios (id, name, logo_url, config) VALUES (?, ?, ?, ?)`,
            [id, name, finalLogoUrl, JSON.stringify(config || {})]
        );

        // Return full object for frontend state
        return {
            id,
            name,
            logo: finalLogoUrl,
            logo_url: finalLogoUrl,
            config: config || {},
            createdAt: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error creating studio', error);
        throw error;
    }
};

/**
 * Get studio by ID
 */
export const getStudio = async (id) => {
    try {
        const row = await dbGet('SELECT * FROM rgs_studios WHERE id = ?', [id]);
        if (!row) return null;
        return {
            ...row,
            logo: row.logo_url,
            config: JSON.parse(row.config || '{}')
        };
    } catch (error) {
        console.error('Error getting studio', error);
        return null;
    }
};

/**
 * Update studio
 */
export const updateStudio = async (id, data) => {
    const { name, logo_url, config } = data;
    try {
        await dbRun(
            `UPDATE rgs_studios SET name = ?, logo_url = ?, config = ? WHERE id = ?`,
            [name, logo_url, JSON.stringify(config || {}), id]
        );
        return { success: true };
    } catch (error) {
        console.error('Error updating studio', error);
        throw error;
    }
};
