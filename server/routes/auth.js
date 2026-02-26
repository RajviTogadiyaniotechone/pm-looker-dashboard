const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const result = await db.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Verify token (for frontend to check if still logged in)
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.json({ user: decoded });
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// Reset Admin Password (using recovery code)
router.post('/reset-admin', async (req, res) => {
    try {
        const { recoveryCode, newPassword } = req.body;
        console.log('--- Admin Reset Attempt ---');
        console.log('Username: admin');
        console.log('Provided Code:', recoveryCode);
        console.log('Expected Code (from ENV):', process.env.ADMIN_RECOVERY_CODE);

        if (!recoveryCode || !newPassword) {
            return res.status(400).json({ error: 'Recovery code and new password required' });
        }

        // Verify recovery code (trimmed to avoid whitespace issues)
        if (recoveryCode.trim() !== (process.env.ADMIN_RECOVERY_CODE || '').trim()) {
            console.error('Error: Recovery code mismatch');
            return res.status(401).json({ error: 'Invalid recovery code' });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);

        // Update admin password in DB
        const result = await db.query(
            'UPDATE users SET password_hash = $1 WHERE username = $2',
            [hash, 'admin']
        );

        console.log('DB Update result:', result.rowCount, 'rows affected');
        res.json({ message: 'Admin password reset successfully' });
    } catch (error) {
        console.error('Reset admin error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
