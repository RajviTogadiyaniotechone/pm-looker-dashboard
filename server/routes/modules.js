const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Get modules accessible to current user
router.get('/', authenticateToken, async (req, res) => {
    try {
        if (req.user.role === 'admin') {
            // Admin sees all modules
            const result = await db.query('SELECT * FROM modules ORDER BY id');
            return res.json(result.rows);
        }

        // Regular users see only assigned modules
        const result = await db.query(
            `SELECT m.* FROM modules m
       INNER JOIN user_module_access uma ON m.id = uma.module_id
       WHERE uma.user_id = $1
       ORDER BY m.id`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Get modules error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all modules (for admin to assign)
router.get('/all', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM modules ORDER BY id');
        res.json(result.rows);
    } catch (error) {
        console.error('Get all modules error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
