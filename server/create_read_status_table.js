const db = require('./db');

const createTableQuery = `
CREATE TABLE IF NOT EXISTS module_read_status (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
    last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, module_id)
);
`;

const runMigration = async () => {
    try {
        await db.query(createTableQuery);
        console.log('Successfully created module_read_status table');
    } catch (error) {
        console.error('Error creating table:', error);
    } finally {
        process.exit();
    }
};

runMigration();
