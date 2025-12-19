const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173", // Allow frontend
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5000;

// Initialize Socket Handler
require('./socket/socketHandler')(io);

// Middleware
app.use(cors());
app.use(express.json());

// Pass io to routes if needed (optional)
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const moduleRoutes = require('./routes/modules');
const chartRoutes = require('./routes/charts');
const messageRoutes = require('./routes/messages');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/charts', chartRoutes);
app.use('/api/messages', messageRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Nio Dashboard API is running' });
});

// Auto-cleanup cron (delete messages older than 30 days)
const cleanupOldMessages = async () => {
    try {
        const db = require('./db'); // Require db here or ensure it's imported at top
        const result = await db.query("DELETE FROM module_messages WHERE created_at < NOW() - INTERVAL '30 days'");
        if (result.rowCount > 0) {
            console.log(`Cleanup: Deleted ${result.rowCount} old messages.`);
        }
    } catch (error) {
        console.error('Error cleaning up old messages:', error);
    }
};

// Run cleanup on start and every 24 hours
cleanupOldMessages();
setInterval(cleanupOldMessages, 24 * 60 * 60 * 1000);

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
