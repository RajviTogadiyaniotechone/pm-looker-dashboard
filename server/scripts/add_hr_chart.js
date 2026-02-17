const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addHRChart() {
    try {
        console.log('Connecting to database...');

        // 1. Get HR Module ID
        const moduleRes = await pool.query("SELECT id FROM modules WHERE slug = 'hr'");

        if (moduleRes.rows.length === 0) {
            console.error('Error: HR module not found in database. Please ensure modules are seeded.');
            process.exit(1);
        }

        const hrModuleId = moduleRes.rows[0].id;
        console.log(`Found HR Module ID: ${hrModuleId}`);

        // 2. Insert Chart
        // Converting edit URL to embed URL format:
        // From: https://lookerstudio.google.com/u/0/reporting/178d2f0c-e75a-46a9-a974-facdf1cdbcb2/page/YfKnF/edit
        // To:   https://lookerstudio.google.com/embed/reporting/178d2f0c-e75a-46a9-a974-facdf1cdbcb2/page/YfKnF

        const chartTitle = 'HR Dashboard';
        const embedUrl = 'https://lookerstudio.google.com/embed/reporting/178d2f0c-e75a-46a9-a974-facdf1cdbcb2/page/YfKnF';

        const insertRes = await pool.query(
            `INSERT INTO charts (module_id, title, embed_url, is_visible)
             VALUES ($1, $2, $3, true)
             RETURNING id`,
            [hrModuleId, chartTitle, embedUrl]
        );

        console.log(`Successfully inserted HR Chart with ID: ${insertRes.rows[0].id}`);

    } catch (err) {
        console.error('Error executing script:', err);
    } finally {
        await pool.end();
    }
}

addHRChart();
