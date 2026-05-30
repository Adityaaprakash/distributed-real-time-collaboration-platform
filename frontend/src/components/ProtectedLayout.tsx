import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, Link } from 'react-router-dom';
import { getToken, getMe } from '../services/auth';
import { useNotifications } from '../hooks/useNotifications';
import NotificationBell from './NotificationBell';
import './Header.css';
import '../responsive.css';

const ProtectedLayout: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const token = getToken();

  useEffect(() => {
    if (token) {
      getMe().then((data) => {
        setUser(data);
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [token]);

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(user?.email || null);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="app-container">
      <header className="global-header">
        <div className="header-left">
          <Link to="/dashboard" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="logo-icon" style={{ background: '#3b82f6', color: 'white', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>C</span>
            <span className="app-name-text">Collab App</span>
          </Link>
        </div>
        <div className="header-right">
          <NotificationBell 
            notifications={notifications}
            unreadCount={unreadCount}
            markAsRead={markAsRead}
            markAllAsRead={markAllAsRead}
          />
          <span className="user-name">{user?.fullName}</span>
        </div>
      </header>
      
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default ProtectedLayout;
