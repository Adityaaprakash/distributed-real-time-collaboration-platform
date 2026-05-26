import React from 'react';
import { useNavigate } from 'react-router-dom';
import { WorkspaceResponse } from '../services/workspaceService';
import './WorkspaceCard.css';

interface Props {
  workspace: WorkspaceResponse;
}

const WorkspaceCard: React.FC<Props> = ({ workspace }) => {
  const navigate = useNavigate();

  return (
    <div className="workspace-card" onClick={() => navigate(`/workspaces/${workspace.id}`)}>
      <h3 className="workspace-card-title">{workspace.name}</h3>
      <p className="workspace-card-desc">{workspace.description || 'No description provided.'}</p>
      <div className="workspace-card-footer">
        <span className="owner">Owner: {workspace.ownerName}</span>
        <span className="members">{workspace.memberCount} member(s)</span>
      </div>
    </div>
  );
};

export default WorkspaceCard;
