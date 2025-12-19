const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Middleware to check if user has access to module
const checkModuleAccess = async (req, res, next) => {
    try {
        const { moduleSlug } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Get module ID from slug
        const moduleResult = await db.query('SELECT id FROM modules WHERE slug = $1', [moduleSlug]);

        if (moduleResult.rows.length === 0) {
            return res.status(404).json({ error: 'Module not found' });
        }

        const moduleId = moduleResult.rows[0].id;
        req.moduleId = moduleId; // Attach to request for use in route

        // Admins have access to everything
        if (userRole === 'admin') {
            return next();
        }

        // Check user access
        const accessResult = await db.query(
            'SELECT 1 FROM user_module_access WHERE user_id = $1 AND module_id = $2',
            [userId, moduleId]
        );

        if (accessResult.rows.length === 0) {
            return res.status(403).json({ error: 'Access denied to this module' });
        }

        next();
    } catch (error) {
        console.error('Module access check error:', error);
        res.status(500).json({ error: 'Server error checking access' });
    }
};

// GET /api/messages/module/:moduleSlug
// Get all messages for a specific module
router.get('/module/:moduleSlug', authenticateToken, checkModuleAccess, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT m.id, m.message, m.created_at, u.username, u.role
             FROM module_messages m
             JOIN users u ON m.user_id = u.id
             WHERE m.module_id = $1
             ORDER BY m.created_at ASC`,
            [req.moduleId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Server error fetching messages' });
    }
});

// POST /api/messages/module/:moduleSlug
// Post a new message
router.post('/module/:moduleSlug', authenticateToken, checkModuleAccess, async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || message.trim() === '') {
            return res.status(400).json({ error: 'Message cannot be empty' });
        }

        if (message.length > 500) {
            return res.status(400).json({ error: 'Message too long (max 500 characters)' });
        }

        const result = await db.query(
            `INSERT INTO module_messages (module_id, user_id, message)
             VALUES ($1, $2, $3)
             RETURNING id, message, created_at`,
            [req.moduleId, req.user.id, message.trim()]
        );

        const newMessage = result.rows[0];

        // Add user info to response
        newMessage.username = req.user.username;
        newMessage.role = req.user.role;

        // Broadcast to socket room
        if (req.io) {
            req.io.to(`module_${req.params.moduleSlug}`).emit('new_module_message', newMessage);

            // Send notification to all users
            req.io.emit('module_notification', {
                moduleSlug: req.params.moduleSlug,
                senderId: req.user.id
            });
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Post message error:', error);
        res.status(500).json({ error: 'Server error posting message' });
    }
});

// DELETE /api/messages/:id
// Delete a message (Admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        // Only admins can delete
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can delete messages' });
        }

        const result = await db.query(
            'DELETE FROM module_messages WHERE id = $1 RETURNING id',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Message not found' });
        }

        res.json({ message: 'Message deleted successfully', id: req.params.id });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ error: 'Server error deleting message' });
    }
});

// GET /api/messages/unread
// Get unread message counts for all modules
router.get('/unread', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Query to get unread count per module
        // We count messages created AFTER the user's last_read_at timestamp
        // If no last_read_at exists, we count ALL messages
        const query = `
            SELECT 
                m.slug as module_slug,
                COUNT(msg.id) as unread_count
            FROM modules m
            JOIN user_module_access uma ON m.id = uma.module_id OR $2 = 'admin' -- Admins see all
            LEFT JOIN module_messages msg ON m.id = msg.module_id 
            LEFT JOIN module_read_status mrs ON m.id = mrs.module_id AND mrs.user_id = $1
            WHERE 
                (uma.user_id = $1 OR $2 = 'admin') AND
                (msg.created_at > COALESCE(mrs.last_read_at, '1970-01-01'))
            GROUP BY m.slug
        `;

        const result = await db.query(query, [userId, req.user.role]);

        // Transform into a cleaner object: { "pm": 3, "sales": 0 }
        const unreadCounts = {};
        result.rows.forEach(row => {
            unreadCounts[row.module_slug] = parseInt(row.unread_count);
        });

        res.json(unreadCounts);
    } catch (error) {
        console.error('Get unread counts error:', error);
        res.status(500).json({ error: 'Server error fetching unread counts' });
    }
});

// POST /api/messages/read/:moduleSlug
// Mark a module's messages as read
router.post('/read/:moduleSlug', authenticateToken, async (req, res) => {
    try {
        const { moduleSlug } = req.params;
        const userId = req.user.id;

        // Get module ID
        const moduleResult = await db.query('SELECT id FROM modules WHERE slug = $1', [moduleSlug]);
        if (moduleResult.rows.length === 0) {
            return res.status(404).json({ error: 'Module not found' });
        }
        const moduleId = moduleResult.rows[0].id;

        // Upsert read status
        await db.query(
            `INSERT INTO module_read_status (user_id, module_id, last_read_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (user_id, module_id) 
             DO UPDATE SET last_read_at = NOW()`,
            [userId, moduleId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ error: 'Server error marking messages as read' });
    }
});

module.exports = router;
