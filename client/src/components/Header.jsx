import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Lock, X, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { validatePassword, generateStrongPassword } from '../utils/passwordUtils';
import axios from 'axios';
import './Header.css';

const Header = ({ user }) => {
    const { logout, API_URL, getAuthHeader, isAdmin } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDropdown]);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError('New passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 4) {
            setPasswordError('Password must be at least 4 characters');
            return;
        }

        try {
            await axios.patch(
                `${API_URL}/users/change-password`,
                {
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                },
                { headers: getAuthHeader() }
            );

            setPasswordSuccess('Password changed successfully!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });

            setTimeout(() => {
                setShowPasswordModal(false);
                setShowDropdown(false);
                setPasswordSuccess('');
            }, 2000);
        } catch (error) {
            setPasswordError(error.response?.data?.error || 'Failed to change password');
        }
    };

    const closePasswordModal = () => {
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordError('');
        setPasswordSuccess('');
    };

    return (
        <>
            <header className="header">
                <div className="header-content">
                    <div className="header-left">
                        <h2>Dashboard</h2>
                    </div>

                    <div className="header-right">
                        {isAdmin && (
                            <div className="admin-profile-wrapper" ref={dropdownRef}>
                                <div
                                    className="user-info clickable"
                                    onClick={() => setShowDropdown(!showDropdown)}
                                >
                                    <div className="user-avatar">
                                        <User size={20} />
                                    </div>
                                    <div className="user-details">
                                        <span className="user-name">{user?.username}</span>
                                        <span className="user-role">{user?.role}</span>
                                    </div>
                                </div>

                                {showDropdown && (
                                    <div className="admin-dropdown">
                                        <div className="dropdown-header">
                                            <User size={16} />
                                            <span>{user?.username}</span>
                                        </div>
                                        <button
                                            className="dropdown-item"
                                            onClick={() => {
                                                setShowPasswordModal(true);
                                                setShowDropdown(false);
                                            }}
                                        >
                                            <Lock size={16} />
                                            Change Password
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {!isAdmin && (
                            <div className="user-info">
                                <div className="user-avatar">
                                    <User size={20} />
                                </div>
                                <div className="user-details">
                                    <span className="user-name">{user?.username}</span>
                                    <span className="user-role">{user?.role}</span>
                                </div>
                            </div>
                        )}

                        <button onClick={logout} className="logout-button" title="Logout">
                            <LogOut size={20} />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            {showPasswordModal && (
                <div className="modal-overlay" onClick={closePasswordModal}>
                    <div className="password-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Change Password</h3>
                            <button className="close-button" onClick={closePasswordModal}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleChangePassword}>
                            <div className="form-group">
                                <label>Current Password</label>
                                <div className="password-input-wrapper-header">
                                    <input
                                        type={showCurrentPassword ? "text" : "password"}
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="icon-button-header"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        title={showCurrentPassword ? "Hide Password" : "Show Password"}
                                    >
                                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>New Password</label>
                                <div className="password-input-wrapper-header">
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        required
                                    />
                                    <div className="password-actions-header">
                                        <button
                                            type="button"
                                            className="icon-button-header"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            title={showNewPassword ? "Hide Password" : "Show Password"}
                                        >
                                            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                        <button
                                            type="button"
                                            className="icon-button-header rotate-hover"
                                            onClick={() => {
                                                const pass = generateStrongPassword();
                                                setPasswordData({ ...passwordData, newPassword: pass, confirmPassword: pass });
                                                setShowNewPassword(true);
                                                setShowConfirmPassword(true);
                                            }}
                                            title="Generate Strong Password"
                                        >
                                            <RefreshCw size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <div className="password-input-wrapper-header">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="icon-button-header"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        title={showConfirmPassword ? "Hide Password" : "Show Password"}
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {passwordError && <div className="error-message">{passwordError}</div>}
                            {passwordSuccess && <div className="success-message">{passwordSuccess}</div>}

                            <div className="modal-actions">
                                <button type="button" onClick={closePasswordModal} className="btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Change Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;
