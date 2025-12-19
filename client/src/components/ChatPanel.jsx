import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Send, MessageSquare, Trash2, RefreshCw, X, ChevronDown, ChevronUp } from 'lucide-react';
import './ChatPanel.css';

const ChatPanel = ({ module, onMarkRead, unreadCount }) => {
    const { user, API_URL, getAuthHeader, isAdmin } = useAuth();
    const socket = useSocket();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const messagesEndRef = useRef(null);

    // Initial fetch when module changes or panel opens
    useEffect(() => {
        if (isOpen && module) {
            fetchMessages();
            // Mark as read when opening chat
            if (onMarkRead) onMarkRead(module.slug);

            // Join real-time room
            if (socket) {
                socket.emit('join_module_chat', module.slug);

                const handleNewMessage = (msg) => {
                    // Avoid duplicates
                    setMessages(prev => {
                        if (prev.some(m => m.id === msg.id)) return prev;
                        return [...prev, msg];
                    });
                    scrollToBottom();

                    // Mark as read immediately if chat is open
                    if (isOpen && onMarkRead) onMarkRead(module.slug);
                };

                socket.on('new_module_message', handleNewMessage);

                return () => {
                    socket.off('new_module_message', handleNewMessage);
                };
            }
        }
    }, [isOpen, module, socket]);

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchMessages = async () => {
        try {
            const response = await axios.get(
                `${API_URL}/messages/module/${module.slug}`,
                { headers: getAuthHeader() }
            );
            setMessages(response.data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchMessages();
        setTimeout(() => setIsRefreshing(false), 500);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setSending(true);
        try {
            const response = await axios.post(
                `${API_URL}/messages/module/${module.slug}`,
                { message: newMessage },
                { headers: getAuthHeader() }
            );

            // Add basic optimistic update roughly (will be fixed by next fetch)
            // But better to simply append the returned message
            setMessages(prev => [...prev, response.data]);
            setNewMessage('');
            scrollToBottom();
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async (messageId) => {
        if (!isAdmin) return;
        if (!window.confirm('Are you sure you want to delete this message?')) return;

        try {
            await axios.delete(
                `${API_URL}/messages/${messageId}`,
                { headers: getAuthHeader() }
            );

            // Remove from local state
            setMessages(prev => prev.filter(m => m.id !== messageId));
        } catch (error) {
            console.error('Error deleting message:', error);
            alert('Failed to delete message');
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return '';

        // Manually shift to IST (UTC + 5:30)
        // We add the offset to the UTC time, then format as "UTC" to see the shifted time
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(date.getTime() + istOffset);

        return istDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'UTC' // Treat the shifted time as UTC to display the calculated values
        });
    };

    // If module is not defined yet, don't render
    if (!module) return null;

    return (
        <div className="chat-panel-container">
            <button
                className={`chat-toggle-btn glass-card ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="toggle-content-left">
                    <MessageSquare size={20} />
                    <span>{module.slug === 'pm' ? 'PM Team Chat' : `${module.name} Team Chat`}</span>
                    {!isOpen && unreadCount > 0 && (
                        <span className="chat-badge">{unreadCount}</span>
                    )}
                </div>
                {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>

            {isOpen && (
                <div className="chat-window glass-card">
                    <div className="chat-header">
                        <h3>
                            <MessageSquare size={18} />
                            {module.slug === 'pm' ? 'PM Discussion' : `${module.name} Discussion`}
                        </h3>
                        <button
                            className={`refresh-chat-btn ${isRefreshing ? 'refreshing' : ''}`}
                            onClick={handleRefresh}
                            title="Refresh messages"
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>

                    <div className="messages-list">
                        {messages.length === 0 ? (
                            <div className="empty-chat">
                                <MessageSquare size={32} />
                                <p>No messages yet. Start the conversation!</p>
                            </div>
                        ) : (
                            messages.map((msg) => {
                                const isOwn = msg.username === user.username;
                                return (
                                    <div
                                        key={msg.id}
                                        className={`message-bubble ${isOwn ? 'own-message' : ''}`}
                                    >
                                        <div className="message-info">
                                            <span className="message-author">{msg.username}</span>
                                            {msg.role === 'admin' && <span className="role-badge admin">Admin</span>}
                                            <span className="message-time">{formatTime(msg.created_at)}</span>
                                        </div>
                                        <div className="message-content">
                                            {msg.message}
                                            {isAdmin && (
                                                <button
                                                    className="delete-btn"
                                                    onClick={() => handleDelete(msg.id)}
                                                    title="Delete message"
                                                >
                                                    <X size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-input-area">
                        <form onSubmit={handleSubmit} className="chat-form">
                            <input
                                type="text"
                                className="chat-input"
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                disabled={sending}
                                maxLength={500}
                            />
                            <button
                                type="submit"
                                className="send-btn"
                                disabled={sending || !newMessage.trim()}
                            >
                                <Send size={20} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatPanel;
