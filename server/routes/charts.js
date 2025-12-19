const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get charts for a module (filtered by visibility for users)
router.get('/module/:moduleSlug', authenticateToken, async (req, res) => {
    try {
        const { moduleSlug } = req.params;

        // Get module
        const moduleResult = await db.query(
            'SELECT id FROM modules WHERE slug = $1',
            [moduleSlug]
        );

        if (moduleResult.rows.length === 0) {
            return res.status(404).json({ error: 'Module not found' });
        }

        const moduleId = moduleResult.rows[0].id;

        // Check access for non-admin users
        if (req.user.role !== 'admin') {
            const accessCheck = await db.query(
                'SELECT 1 FROM user_module_access WHERE user_id = $1 AND module_id = $2',
                [req.user.id, moduleId]
            );

            if (accessCheck.rows.length === 0) {
                return res.status(403).json({ error: 'Access denied to this module' });
            }
        }

        // Get charts (filter by visibility for non-admin)
        const visibilityFilter = req.user.role === 'admin' ? '' : 'AND is_visible = true';
        const result = await db.query(
            `SELECT * FROM charts WHERE module_id = $1 ${visibilityFilter} ORDER BY created_at`,
            [moduleId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Get charts error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Toggle chart visibility (Admin only)
router.patch('/:id/visibility', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { isVisible } = req.body;

        await db.query(
            'UPDATE charts SET is_visible = $1 WHERE id = $2',
            [isVisible, id]
        );

        res.json({ message: 'Chart visibility updated' });
    } catch (error) {
        console.error('Update chart visibility error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create chart (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { moduleId, title, embedUrl } = req.body;

        const result = await db.query(
            'INSERT INTO charts (module_id, title, embed_url) VALUES ($1, $2, $3) RETURNING *',
            [moduleId, title, embedUrl]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create chart error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete chart (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM charts WHERE id = $1', [id]);
        res.json({ message: 'Chart deleted successfully' });
    } catch (error) {
        console.error('Delete chart error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
