import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { BarChart3, Eye, EyeOff, RefreshCw } from 'lucide-react';
import ChatPanel from './ChatPanel';
import './ModuleView.css';

const ModuleView = ({ module, onMarkRead, unreadCounts }) => {

    const { API_URL, getAuthHeader, isAdmin } = useAuth();
    const [charts, setCharts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const intervalRef = useRef(null);

    useEffect(() => {
        fetchCharts();
    }, [module]);

    // Auto-refresh every 15 minutes
    useEffect(() => {
        if (charts.length > 0) {
            intervalRef.current = setInterval(() => {
                setRefreshKey(prev => prev + 1);
            }, 900000); // 15 minutes = 900000ms
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [charts.length]);

    const fetchCharts = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${API_URL}/charts/module/${module.slug}`,
                { headers: getAuthHeader() }
            );
            setCharts(response.data);
        } catch (error) {
            console.error('Error fetching charts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        setRefreshKey(prev => prev + 1);

        setTimeout(() => {
            setIsRefreshing(false);
        }, 1000);
    };

    const toggleChartVisibility = async (chartId, currentVisibility) => {
        try {
            await axios.patch(
                `${API_URL}/charts/${chartId}/visibility`,
                { isVisible: !currentVisibility },
                { headers: getAuthHeader() }
            );
            fetchCharts();
        } catch (error) {
            console.error('Error toggling chart visibility:', error);
        }
    };

    if (loading) {
        return (
            <div className="module-view">
                <div className="loading-state">
                    <div className="spinner-large"></div>
                    <p>Loading charts...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="module-view">
            {/* <div className="module-header">
                <div className="module-title-section">
                    <h5>{module.name}</h5>
                    <p>View and analyze your {module.name.toLowerCase()} data</p>
                </div>
            </div> */}

            {charts.length === 0 ? (
                <div className="empty-charts">
                    <BarChart3 size={48} />
                    <h3>No charts available</h3>
                    <p>Charts will appear here once they are added by an administrator</p>
                </div>
            ) : (
                <div className="charts-grid">
                    {charts.map((chart) => (
                        <div key={chart.id} className="chart-card glass-card">
                            <div className="chart-header">
                                {/* <h5>{chart.title}</h5> */}
                                {isAdmin && (
                                    <button
                                        onClick={() => toggleChartVisibility(chart.id, chart.is_visible)}
                                        className={`visibility-toggle ${chart.is_visible ? 'visible' : 'hidden'}`}
                                        title={chart.is_visible ? 'Hide from users' : 'Show to users'}
                                    >
                                        {chart.is_visible ? <Eye size={18} /> : <EyeOff size={18} />}
                                    </button>
                                )}
                                <button
                                    onClick={handleRefresh}
                                    className={`refresh-button ${isRefreshing ? 'refreshing' : ''}`}
                                    title="Refresh charts"
                                >
                                    <RefreshCw size={18} />
                                    <span>Refresh</span>
                                </button>
                            </div>
                            <div className="chart-embed">
                                <iframe
                                    key={`${chart.id}-${refreshKey}`}
                                    src={chart.embed_url}
                                    frameBorder="0"
                                    allowFullScreen
                                    title={chart.title}
                                ></iframe>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ChatPanel
                module={module}
                onMarkRead={onMarkRead}
                unreadCount={unreadCounts?.[module.slug] || 0}
            />
        </div>
    );
};

export default ModuleView;
