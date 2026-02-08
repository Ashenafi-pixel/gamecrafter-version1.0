
import { dbQuery } from './src/rgs/database.js';

const run = async () => {
    try {
        console.log('Checking rgs_drafts table...');
        const drafts = await dbQuery('SELECT * FROM rgs_drafts');
        console.log(`Found ${drafts.length} drafts.`);
        drafts.forEach(d => {
            console.log(`- ID: ${d.id}, Name: ${d.game_name}, User: ${d.user_id}, Updated: ${d.updated_at}`);
        });
    } catch (e) {
        console.error('DB Error:', e);
    }
};

run();
