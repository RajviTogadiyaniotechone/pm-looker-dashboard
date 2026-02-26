const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const db = require('../db');

async function resetPassword() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.log('Usage: node scripts/reset_password.js <username> <new_password>');
        process.exit(1);
    }

    const username = args[0];
    const newPassword = args[1];

    try {
        console.log(`Resetting password for user: ${username}...`);

        // 1. Check if user exists
        const userResult = await db.query('SELECT id FROM users WHERE username = $1', [username]);
        if (userResult.rows.length === 0) {
            console.error(`Error: User "${username}" not found.`);
            process.exit(1);
        }

        // 2. Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);

        // 3. Update the database
        await db.query(
            'UPDATE users SET password_hash = $1 WHERE username = $2',
            [hash, username]
        );

        console.log('-----------------------------------------');
        console.log('Success: Password updated successfully!');
        console.log(`User: ${username}`);
        console.log('-----------------------------------------');

        process.exit(0);
    } catch (error) {
        console.error('An error occurred:', error);
        process.exit(1);
    }
}

resetPassword();
