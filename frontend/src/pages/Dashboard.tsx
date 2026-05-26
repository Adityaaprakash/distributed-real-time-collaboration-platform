import React, { useEffect, useState } from 'react';
import { getMe, logout } from '../services/auth';
import { workspaceService, WorkspaceResponse } from '../services/workspaceService';
import WorkspaceCard from '../components/WorkspaceCard';
import { useNavigate } from 'react-router-dom';
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

  if (loading) return <div>Loading...</div>;

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
          <p className="empty-state">No workspaces yet.</p>
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
