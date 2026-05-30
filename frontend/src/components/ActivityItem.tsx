import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ActivityResponse } from '../types/activity';
import { timeAgo } from '../utils/timeUtils';

interface Props {
  activity: ActivityResponse;
  workspaceId: string;
}

const ActivityItem: React.FC<Props> = ({ activity, workspaceId }) => {
  const navigate = useNavigate();
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const getHashColors = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const h = hash % 360;
    return `hsl(${h}, 70%, 60%)`;
  };

  const handleClick = () => {
    if (activity.entityType === 'DOCUMENT' && activity.entityId) {
      navigate(`/workspaces/${workspaceId}/documents/${activity.entityId}`);
    }
  };

  const isClickable = activity.entityType === 'DOCUMENT';

  return (
    <div className={`activity-item ${isClickable ? 'clickable' : ''}`} onClick={isClickable ? handleClick : undefined}>
      <div className="activity-timeline-marker"></div>
      <div className="activity-actor-avatar" style={{ backgroundColor: getHashColors(activity.actorEmail) }}>
        {getInitials(activity.actorFullName)}
      </div>
      <div className="activity-content">
        <div className="activity-description">
          <strong>{activity.actorFullName}</strong> {activity.description.replace(activity.actorFullName, '').trim()}
        </div>
        <div className="activity-time">{timeAgo(activity.createdAt)}</div>
      </div>
    </div>
  );
};

export default ActivityItem;
