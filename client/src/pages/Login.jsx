import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, Loader2, Eye, EyeOff } from 'lucide-react';
import { validatePassword, generateStrongPassword } from '../utils/passwordUtils';
import './Login.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showResetForm, setShowResetForm] = useState(false);
    const [recoveryCode, setRecoveryCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [resetSuccess, setResetSuccess] = useState('');
    const { login, resetAdminPassword } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(username, password);

        if (!result.success) {
            setError(result.error);
            setLoading(false);
        }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await resetAdminPassword(recoveryCode, newPassword);

        if (result.success) {
            setResetSuccess('Password reset successfully! You can now login.');
            setRecoveryCode('');
            setNewPassword('');
            setShowResetForm(false);
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    return (
        <div className="login-container">
            <div className="login-background">
                <div className="gradient-orb orb-1"></div>
                <div className="gradient-orb orb-2"></div>
                <div className="gradient-orb orb-3"></div>
            </div>

            <div className="login-card glass-card">
                <div className="login-header">
                    <div className="logo-container">
                        <div className="logo-icon">
                            <LogIn size={32} />
                        </div>
                    </div>
                    <h1>Nio Dashboard</h1>
                    <p>Welcome back! Please login to continue.</p>
                </div>

                <form onSubmit={showResetForm ? handleReset : handleSubmit} className="login-form">
                    {(error || resetSuccess) && (
                        <div className={error ? "error-message" : "success-message"}>
                            {error || resetSuccess}
                        </div>
                    )}

                    {!showResetForm ? (
                        <>
                            <div className="form-group">
                                <label htmlFor="username">Username</label>
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter your username"
                                    required
                                    autoComplete="username"
                                />
                            </div>

                            <div className="form-group">
                                <div className="label-with-link">
                                    <label htmlFor="password">Password</label>
                                    {username.toLowerCase() === 'admin' && (
                                        <button
                                            type="button"
                                            className="forgot-password-link"
                                            onClick={() => {
                                                setShowResetForm(true);
                                                setError('');
                                                setResetSuccess('');
                                            }}
                                        >
                                            Forgot Password?
                                        </button>
                                    )}
                                </div>
                                <div className="password-input-wrapper">
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        required
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex="-1"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" className="login-button" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="spinner" size={20} />
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        <LogIn size={20} />
                                        Sign In
                                    </>
                                )}
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="form-group">
                                <label htmlFor="recoveryCode">Recovery Code</label>
                                <input
                                    id="recoveryCode"
                                    type="password"
                                    value={recoveryCode}
                                    onChange={(e) => setRecoveryCode(e.target.value)}
                                    placeholder="Enter recovery code"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="newPassword">New Password</label>
                                <input
                                    id="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    required
                                />
                            </div>

                            <div className="reset-actions">
                                <button type="submit" className="login-button" disabled={loading}>
                                    {loading ? 'Resetting...' : 'Reset Password'}
                                </button>
                                <button
                                    type="button"
                                    className="back-to-login"
                                    onClick={() => setShowResetForm(false)}
                                >
                                    Back to Login
                                </button>
                            </div>
                        </>
                    )}
                </form>

                <div className="login-footer">
                    <p>Secure access to your analytics dashboard</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
