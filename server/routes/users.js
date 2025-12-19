const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get all users (Admin only) - excludes admin users
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, username, role, created_at FROM users WHERE role != $1 ORDER BY created_at DESC',
            ['admin']
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create user (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { username, password, role } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        // Check if user exists
        const existing = await db.query(
            'SELECT id FROM users WHERE username = $1',
            [username]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.query(
            'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role, created_at',
            [username, hashedPassword, role || 'user']
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete user (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent deleting yourself
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        await db.query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user's module access
router.get('/:id/modules', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            'SELECT module_id FROM user_module_access WHERE user_id = $1',
            [id]
        );
        res.json(result.rows.map(r => r.module_id));
    } catch (error) {
        console.error('Get user modules error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Set user's module access (Admin only)
router.post('/:id/modules', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { moduleIds } = req.body; // Array of module IDs

        // Clear existing access
        await db.query('DELETE FROM user_module_access WHERE user_id = $1', [id]);

        // Add new access
        if (moduleIds && moduleIds.length > 0) {
            const values = moduleIds.map((moduleId, idx) =>
                `($1, $${idx + 2})`
            ).join(', ');

            await db.query(
                `INSERT INTO user_module_access (user_id, module_id) VALUES ${values}`,
                [id, ...moduleIds]
            );
        }

        res.json({ message: 'Module access updated successfully' });
    } catch (error) {
        console.error('Set user modules error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Change password (authenticated users can change their own password)
router.patch('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password required' });
        }

        // Get user's current password hash
        const userResult = await db.query(
            'SELECT password_hash FROM users WHERE id = $1',
            [req.user.id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await db.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2',
            [hashedPassword, req.user.id]
        );

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
