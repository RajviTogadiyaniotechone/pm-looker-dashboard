// Socket.io Handler

// Map to store connected users: userId -> socketId
const connectedUsers = new Map();

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        // Handle user login/identification
        socket.on('register_user', (userId) => {
            connectedUsers.set(userId, socket.id);
            socket.join(`user_${userId}`); // Join personal room for notifications
            console.log(`Registered user: ${userId} -> ${socket.id}`);
        });

        // Join chat room for a module
        socket.on('join_module_chat', (moduleSlug) => {
            socket.join(`module_${moduleSlug}`);
            console.log(`User ${socket.id} joined module_${moduleSlug}`);
        });

        // Send chat message
        socket.on('send_module_message', (data) => {
            const { moduleSlug, message, userId, userRole } = data; // Expect userId to know who sent it

            // Broadcast to chat room participants (standard chat flow)
            socket.to(`module_${moduleSlug}`).emit('new_module_message', message);

            // Send notification to all other users who have access to this module
            // We emit to everyone; client-side will filter or we rely on 'user_{id}' rooms if we knew all IDs.
            // Simpler approach for now: Emit 'module_notification' to everyone, 
            // and client ignores it if they don't have access or if they are the sender.
            // BUT, to be secure/clean, let's just broadcast to the module room? 
            // Problem: Users NOT in the module room (viewing other pages) won't get it.
            // So we need to notify specific users.

            // For now, let's use a global broadcast for notifications to all connected sockets
            // The client will initiate a refetch of unread counts
            io.emit('module_notification', { moduleSlug, senderId: userId });
        });

        // --- Video Call Events ---

        // Initiate call
        socket.on('call_user', (data) => {
            const { callerId, callerName, targetUserId, roomId } = data;
            const targetSocketId = connectedUsers.get(targetUserId);

            if (targetSocketId) {
                io.to(targetSocketId).emit('incoming_call', {
                    callerId,
                    callerName,
                    roomId
                });
            } else {
                console.log(`User ${targetUserId} not connected`);
                // Optionally emit 'user_unavailable' back to caller
            }
        });

        // Initiate group call
        socket.on('call_group', (data) => {
            const { callerId, callerName, targetUserIds, roomId } = data;

            targetUserIds.forEach(userId => {
                const targetSocketId = connectedUsers.get(userId);
                if (targetSocketId) {
                    io.to(targetSocketId).emit('incoming_call', {
                        callerId,
                        callerName,
                        roomId
                    });
                }
            });
        });

        // Accept call (not strictly needed if we just join Jitsi, but good for tracking)
        socket.on('accept_call', (data) => {
            const { callerId } = data;
            // Notify caller that call was accepted if needed
        });

        // Decline call
        socket.on('decline_call', (data) => {
            const { callerId, targetUserId } = data;
            // Notify caller needs socketId lookup
            // In a real app we'd map callerId back to socket
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            // Remove user from map
            for (const [userId, socketId] of connectedUsers.entries()) {
                if (socketId === socket.id) {
                    connectedUsers.delete(userId);
                    console.log(`User ${userId} disconnected`);
                    break;
                }
            }
        });
    });
};
