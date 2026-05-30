import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NotificationResponse } from '../types/notification';
import { timeAgo } from '../utils/timeUtils';

interface Props {
  notifications: NotificationResponse[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  onClose: () => void;
}

const NotificationPanel: React.FC<Props> = ({ notifications, markAsRead, markAllAsRead, onClose }) => {
  const navigate = useNavigate();

  const getIcon = (type: string) => {
    if (type.includes('DOCUMENT')) return '📄';
    if (type.includes('MEMBER') || type.includes('JOINED') || type.includes('REMOVED')) return '👤';
    if (type.includes('CHAT')) return '💬';
    return '🔗';
  };

  const handleNotificationClick = (n: NotificationResponse) => {
    if (!n.isRead) markAsRead(n.id);
    
    if (n.entityType === 'DOCUMENT' && n.workspaceId && n.entityId) {
      navigate(`/workspaces/${n.workspaceId}/documents/${n.entityId}`);
    } else if (n.workspaceId) {
      navigate(`/workspaces/${n.workspaceId}`);
    }
    
    onClose();
  };

  return (
    <div className="notification-panel">
      <div className="notification-header">
        <h3>Notifications</h3>
        <button className="mark-all-btn" onClick={markAllAsRead}>Mark all read</button>
      </div>
      
      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="empty-notifications">No notifications yet</div>
        ) : (
          notifications.map(n => (
            <div 
              key={n.id} 
              className={`notification-item ${!n.isRead ? 'unread' : ''}`}
              onClick={() => handleNotificationClick(n)}
            >
              <div className="notification-icon">{getIcon(n.type)}</div>
              <div className="notification-content">
                <div className="notification-title">{n.title}</div>
                <div className="notification-message">{n.message}</div>
                <div className="notification-time">{timeAgo(n.createdAt)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
