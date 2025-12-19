import { useAuth } from '../context/AuthContext';
import { Settings, Briefcase, TrendingUp, Users as UsersIcon } from 'lucide-react';
import './Sidebar.css';

const iconMap = {
    'Briefcase': Briefcase,
    'TrendingUp': TrendingUp,
    'Users': UsersIcon,
};

const Sidebar = ({ modules, selectedModule, onModuleSelect, showAdminPanel, onAdminPanelToggle, unreadCounts }) => {
    const { isAdmin } = useAuth();

    const getIcon = (iconName) => {
        const Icon = iconMap[iconName] || Briefcase;
        return <Icon size={20} />;
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div className="logo-icon-small">N</div>
                    <span className="logo-text">Nio</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section">
                    <span className="nav-section-title">Modules</span>
                    <div className="nav-items">
                        {modules.length === 0 ? (
                            <div className="nav-empty">
                                <p>No modules available</p>
                            </div>
                        ) : (
                            modules.map((module) => (
                                <button
                                    key={module.id}
                                    onClick={() => onModuleSelect(module)}
                                    className={`nav-item ${selectedModule?.id === module.id ? 'active' : ''}`}
                                >
                                    {getIcon(module.icon)}
                                    <span>{module.name}</span>
                                    {unreadCounts?.[module.slug] > 0 && (
                                        <span className="unread-badge">
                                            {unreadCounts[module.slug]}
                                        </span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {isAdmin && (
                    <div className="nav-section">
                        <span className="nav-section-title">Administration</span>
                        <div className="nav-items">
                            <button
                                onClick={onAdminPanelToggle}
                                className={`nav-item ${showAdminPanel ? 'active' : ''}`}
                            >
                                <Settings size={20} />
                                <span>Admin Panel</span>
                            </button>
                        </div>
                    </div>
                )}
            </nav>

            <div className="sidebar-footer">
                <p>© 2024 Nio Dashboard</p>
            </div>
        </aside>
    );
};

export default Sidebar;
