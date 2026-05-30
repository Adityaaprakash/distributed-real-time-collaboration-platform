import React, { useEffect, useState } from 'react';
import { getMe, logout } from '../services/auth';
import { workspaceService, WorkspaceResponse } from '../services/workspaceService';
import WorkspaceCard from '../components/WorkspaceCard';
import { useNavigate } from 'react-router-dom';
import { SkeletonLoader } from '../components/SkeletonLoader';
import './Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await getMe();
        setUser(userData);
        const wsData = await workspaceService.getMyWorkspaces();
        setWorkspaces(wsData);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
      </div>
      <div className="workspaces-section">
        <div className="workspaces-header">
          <h2>Your Workspaces</h2>
        </div>
        <div className="workspaces-grid">
          <SkeletonLoader width="100%" height="150px" borderRadius="8px" />
          <SkeletonLoader width="100%" height="150px" borderRadius="8px" />
          <SkeletonLoader width="100%" height="150px" borderRadius="8px" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        {user && (
          <div className="user-info">
            Welcome, <strong>{user.fullName}</strong>
            <button onClick={logout} className="btn-logout">Logout</button>
          </div>
        )}
      </div>
      
      {error && <div className="error-message">{error}</div>}

      <div className="workspaces-section">
        <div className="workspaces-header">
          <h2>Your Workspaces</h2>
          <button className="btn-primary" onClick={() => navigate('/workspaces/create')}>
            Create Workspace
          </button>
        </div>
        
        {workspaces.length === 0 ? (
          <div className="empty-state" style={{ textAlign: 'center', marginTop: '40px' }}>
            <svg viewBox="0 0 200 150" width="200" height="150" xmlns="http://www.w3.org/2000/svg" style={{ margin: '0 auto' }}>
              <rect x="40" y="100" width="120" height="10" fill="#e2e8f0" rx="2"/>
              <rect x="50" y="60" width="100" height="40" fill="#cbd5e1" rx="4"/>
              <circle cx="75" cy="40" r="15" fill="#94a3b8"/>
              <path d="M55,60 Q75,20 95,60" fill="#94a3b8"/>
              <circle cx="125" cy="40" r="15" fill="#94a3b8"/>
              <path d="M105,60 Q125,20 145,60" fill="#94a3b8"/>
            </svg>
            <h2>No workspaces yet</h2>
            <p>Create your first workspace to start collaborating</p>
            <button className="btn-primary" style={{ marginTop: '15px' }} onClick={() => navigate('/workspaces/create')}>
              Create Workspace
            </button>
          </div>
        ) : (
          <div className="workspaces-grid">
            {workspaces.map(ws => (
              <WorkspaceCard key={ws.id} workspace={ws} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
