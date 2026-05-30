import React, { useState, useRef, useEffect } from 'react';
import { NotificationResponse } from '../types/notification';
import NotificationPanel from './NotificationPanel';
import './Notifications.css';

interface Props {
  notifications: NotificationResponse[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationBell: React.FC<Props> = ({ notifications, unreadCount, markAsRead, markAllAsRead }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div className="notification-bell-container" ref={containerRef}>
      <button className="bell-button" onClick={() => setIsOpen(!isOpen)}>
        🔔
        {unreadCount > 0 && <span className="unread-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {isOpen && (
        <NotificationPanel 
          notifications={notifications} 
          markAsRead={markAsRead} 
          markAllAsRead={markAllAsRead}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationBell;
