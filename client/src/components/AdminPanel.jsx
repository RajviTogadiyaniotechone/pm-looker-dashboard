import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';
import { Users, Plus, Trash2, Shield, CheckSquare, Square, Video, Phone, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { validatePassword, generateStrongPassword } from '../utils/passwordUtils';
import MeetingRoom from './MeetingRoom';
import './AdminPanel.css';

const AdminPanel = ({ onRefresh }) => {
    const { API_URL, getAuthHeader, user: adminUser } = useAuth();
    const socket = useSocket();
    const [users, setUsers] = useState([]);
    const [allModules, setAllModules] = useState([]);
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userModules, setUserModules] = useState([]);
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' });
    const [loading, setLoading] = useState(true);
    const [activeCall, setActiveCall] = useState(null); // { roomId, targetUserName }

    const [selectedCallUsers, setSelectedCallUsers] = useState([]);
    const [passwordError, setPasswordError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        fetchUsers();
        fetchAllModules();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${API_URL}/users`, {
                headers: getAuthHeader()
            });
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllModules = async () => {
        try {
            const response = await axios.get(`${API_URL}/modules/all`, {
                headers: getAuthHeader()
            });
            setAllModules(response.data);
        } catch (error) {
            console.error('Error fetching modules:', error);
        }
    };

    const fetchUserModules = async (userId) => {
        try {
            const response = await axios.get(`${API_URL}/users/${userId}/modules`, {
                headers: getAuthHeader()
            });
            setUserModules(response.data);
        } catch (error) {
            console.error('Error fetching user modules:', error);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();

        const error = validatePassword(newUser.password);
        if (error) {
            setPasswordError(error);
            return;
        }
        setPasswordError(null);

        try {
            await axios.post(`${API_URL}/users`, newUser, {
                headers: getAuthHeader()
            });
            setNewUser({ username: '', password: '', role: 'user' });
            setShowCreateUser(false);
            fetchUsers();
            onRefresh();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to create user');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            await axios.delete(`${API_URL}/users/${userId}`, {
                headers: getAuthHeader()
            });
            fetchUsers();
            if (selectedUser?.id === userId) {
                setSelectedUser(null);
            }
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to delete user');
        }
    };

    const handleSelectUser = (user) => {
        setSelectedUser(user);
        fetchUserModules(user.id);
    };

    const toggleModuleAccess = (moduleId) => {
        setUserModules((prev) =>
            prev.includes(moduleId)
                ? prev.filter((id) => id !== moduleId)
                : [...prev, moduleId]
        );
    };

    const toggleCallSelection = (userId) => {
        setSelectedCallUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const saveModuleAccess = async () => {
        try {
            await axios.post(
                `${API_URL}/users/${selectedUser.id}/modules`,
                { moduleIds: userModules },
                { headers: getAuthHeader() }
            );
            alert('Module access updated successfully');
            onRefresh();
        } catch (error) {
            alert('Failed to update module access');
        }
    };

    const handleCallUser = (targetUser) => {
        if (!socket) {
            alert('Real-time connection not available');
            return;
        }

        const roomId = `call_${Date.now()}`;

        // Initiate call signal
        socket.emit('call_user', {
            callerId: adminUser.id,
            callerName: adminUser.username,
            targetUserId: targetUser.id,
            roomId
        });

        // Admin joins immediately
        setActiveCall({ roomId, targetUserName: targetUser.username });
    };

    const handleGroupCall = () => {
        if (!socket) {
            alert('Real-time connection not available');
            return;
        }
        if (selectedCallUsers.length === 0) return;

        const roomId = `group_call_${Date.now()}`;

        socket.emit('call_group', {
            callerId: adminUser.id,
            callerName: adminUser.username,
            targetUserIds: selectedCallUsers,
            roomId
        });

        setActiveCall({ roomId, targetUserName: 'Group Call' });
        setSelectedCallUsers([]); // Reset selection
    };

    if (activeCall) {
        return (
            <MeetingRoom
                roomId={activeCall.roomId}
                userName={adminUser.username}
                onEndCall={() => setActiveCall(null)}
            />
        );
    }

    return (
        <div className="admin-panel">
            <div className="admin-header">
                <h1>Admin Panel</h1>
                <p>Manage users and their module access</p>
            </div>

            <div className="admin-content">
                <div className="admin-section glass-card">
                    <div className="section-header">
                        <h2>
                            <Users size={24} />
                            User Management
                        </h2>
                        <div className="header-actions" style={{ display: 'flex', gap: '10px' }}>
                            {selectedCallUsers.length > 0 && (
                                <button onClick={handleGroupCall} className="btn-primary" style={{ background: '#6366f1' }}>
                                    <Video size={18} />
                                    Start Group Meeting ({selectedCallUsers.length})
                                </button>
                            )}
                            <button onClick={() => setShowCreateUser(!showCreateUser)} className="btn-primary">
                                <Plus size={18} />
                                Create User
                            </button>
                        </div>
                    </div>

                    {showCreateUser && (
                        <form onSubmit={handleCreateUser} className="create-user-form">
                            <div className="form-row">
                                <input
                                    type="text"
                                    placeholder="Username"
                                    value={newUser.username}
                                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                    required
                                />
                                <div className="password-input-wrapper-admin">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Password"
                                        value={newUser.password}
                                        onChange={(e) => {
                                            setNewUser({ ...newUser, password: e.target.value });
                                            setPasswordError(null);
                                        }}
                                        required
                                    />
                                    <div className="password-actions-admin">
                                        <button
                                            type="button"
                                            className="icon-button-admin"
                                            onClick={() => setShowPassword(!showPassword)}
                                            title={showPassword ? "Hide Password" : "Show Password"}
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                        <button
                                            type="button"
                                            className="icon-button-admin rotate-hover"
                                            onClick={() => {
                                                const pass = generateStrongPassword();
                                                setNewUser({ ...newUser, password: pass });
                                                setShowPassword(true);
                                                setPasswordError(null);
                                            }}
                                            title="Generate Strong Password"
                                        >
                                            <RefreshCw size={16} />
                                        </button>
                                    </div>
                                </div>
                                {passwordError && <div className="validation-error-small">{passwordError}</div>}
                                <select
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                >
                                    <option value="user">User</option>
                                </select>
                                <button type="submit" className="btn-success">Create</button>
                                <button type="button" onClick={() => setShowCreateUser(false)} className="btn-secondary">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="users-list">
                        {loading ? (
                            <p>Loading users...</p>
                        ) : users.filter(u => u.role !== 'admin').length === 0 ? (
                            <p>No users found</p>
                        ) : (
                            users.filter(u => u.role !== 'admin').map((user) => (
                                <div
                                    key={user.id}
                                    className={`user-item ${selectedUser?.id === user.id ? 'selected' : ''}`}
                                    onClick={() => handleSelectUser(user)}
                                >
                                    <div className="user-info">
                                        <div
                                            className="user-select-checkbox"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleCallSelection(user.id);
                                            }}
                                            style={{ marginRight: '10px', cursor: 'pointer', display: 'flex' }}
                                        >
                                            {selectedCallUsers.includes(user.id) ? (
                                                <CheckSquare size={20} color="#6366f1" />
                                            ) : (
                                                <Square size={20} color="#cbd5e0" />
                                            )}
                                        </div>
                                        <div className="user-avatar-small">
                                            <Users size={16} />
                                        </div>
                                        <div>
                                            <strong>{user.username}</strong>
                                            <span className="user-role-badge">{user.role}</span>
                                        </div>
                                    </div>
                                    <div className="user-actions">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCallUser(user);
                                            }}
                                            className="btn-call-small"
                                            title="Start Video Call"
                                        >
                                            <Video size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteUser(user.id);
                                            }}
                                            className="btn-danger-small"
                                            title="Delete User"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {
                    selectedUser && selectedUser.role !== 'admin' && (
                        <div className="admin-section glass-card">
                            <div className="section-header">
                                <h2>Module Access for {selectedUser.username}</h2>
                                <button onClick={saveModuleAccess} className="btn-primary">
                                    Save Changes
                                </button>
                            </div>

                            <div className="modules-list">
                                {allModules.map((module) => (
                                    <div
                                        key={module.id}
                                        className="module-item"
                                        onClick={() => toggleModuleAccess(module.id)}
                                    >
                                        <div className="module-checkbox">
                                            {userModules.includes(module.id) ? (
                                                <CheckSquare size={20} className="checked" />
                                            ) : (
                                                <Square size={20} />
                                            )}
                                        </div>
                                        <span>{module.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                }
            </div >
        </div >
    );
};

export default AdminPanel;
