import { useState, useEffect } from 'react';
import axios from 'axios';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CallModal from './components/CallModal';
import './App.css';

function AppContent() {
  const { user, loading, getAuthHeader, API_URL } = useAuth();
  const socket = useSocket();
  const [unreadCounts, setUnreadCounts] = useState({});

  useEffect(() => {
    if (user && API_URL) {
      fetchUnreadCounts();
    }
  }, [user]);

  useEffect(() => {
    if (socket && user) {
      const handleNotification = (data) => {
        // If sender is current user, ignore (optional, but good practice)
        if (data.senderId === user.id) return;

        // Increment unread count for the specific module
        setUnreadCounts(prev => ({
          ...prev,
          [data.moduleSlug]: (prev[data.moduleSlug] || 0) + 1
        }));
      };

      socket.on('module_notification', handleNotification);

      return () => {
        socket.off('module_notification', handleNotification);
      };
    }
  }, [socket, user]);

  const fetchUnreadCounts = async () => {
    try {
      const response = await axios.get(`${API_URL}/messages/unread`, {
        headers: getAuthHeader()
      });
      setUnreadCounts(response.data);
    } catch (error) {
      console.error('Failed to fetch unread counts', error);
    }
  };

  const markModuleAsRead = async (moduleSlug) => {
    // Optimistically clear count
    setUnreadCounts(prev => ({
      ...prev,
      [moduleSlug]: 0
    }));

    try {
      await axios.post(
        `${API_URL}/messages/read/${moduleSlug}`,
        {},
        { headers: getAuthHeader() }
      );
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner-large"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      {user ? (
        <Dashboard
          unreadCounts={unreadCounts}
          onMarkRead={markModuleAsRead}
        />
      ) : (
        <Login />
      )}
      {user && <CallModal />}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
