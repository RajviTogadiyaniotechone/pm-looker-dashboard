import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ModuleView from '../components/ModuleView';
import AdminPanel from '../components/AdminPanel';
import './Dashboard.css';

const Dashboard = ({ unreadCounts, onMarkRead }) => {
    const { user, API_URL, getAuthHeader, isAdmin } = useAuth();
    const [modules, setModules] = useState([]);
    const [selectedModule, setSelectedModule] = useState(null);
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchModules();
    }, []);

    const fetchModules = async () => {
        try {
            const response = await axios.get(`${API_URL}/modules`, {
                headers: getAuthHeader()
            });
            setModules(response.data);

            // Auto-select first module if available
            if (response.data.length > 0 && !selectedModule) {
                setSelectedModule(response.data[0]);
            }
        } catch (error) {
            console.error('Error fetching modules:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleModuleSelect = (module) => {
        setSelectedModule(module);
        setShowAdminPanel(false);
    };

    const handleAdminPanelToggle = () => {
        setShowAdminPanel(!showAdminPanel);
        setSelectedModule(null);
    };

    return (
        <div className="dashboard-container">
            <Sidebar
                modules={modules}
                selectedModule={selectedModule}
                onModuleSelect={handleModuleSelect}
                showAdminPanel={showAdminPanel}
                onAdminPanelToggle={handleAdminPanelToggle}
                unreadCounts={unreadCounts}
            />

            <div className="dashboard-main">
                <Header user={user} />

                <div className="dashboard-content">
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner-large"></div>
                            <p>Loading dashboard...</p>
                        </div>
                    ) : showAdminPanel && isAdmin ? (
                        <AdminPanel onRefresh={fetchModules} />
                    ) : selectedModule ? (
                        <ModuleView
                            module={selectedModule}
                            onMarkRead={onMarkRead}
                        />
                    ) : (
                        <div className="empty-state">
                            <h2>Welcome to Nio Dashboard</h2>
                            <p>Select a module from the sidebar to get started</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
