import React, { useState, useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { ActivityResponse } from '../types/activity';
import { activityService } from '../services/activityService';
import ActivityItem from './ActivityItem';
import { getToken } from '../services/auth';
import './ActivityFeed.css';

interface Props {
  workspaceId: string;
}

const ActivityFeed: React.FC<Props> = ({ workspaceId }) => {
  const [activities, setActivities] = useState<ActivityResponse[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const stompClientRef = useRef<Client | null>(null);

  useEffect(() => {
    let isActive = true;
    const token = getToken();
    
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const data = await activityService.getWorkspaceActivity(workspaceId, 0, 30);
        if (isActive) {
          setActivities(data.content);
          setHasMore(!data.last);
          setLoading(false);
          setPage(0);
        }
      } catch (error) {
        console.error('Failed to load activities', error);
        if (isActive) setLoading(false);
      }
    };

    fetchActivities();

    if (token) {
      stompClientRef.current = new Client({
        webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
        connectHeaders: { Authorization: `Bearer ${token}` },
        reconnectDelay: 5000,
        onConnect: () => {
          stompClientRef.current?.subscribe(`/topic/activity.${workspaceId}`, (message) => {
            if (message.body) {
              const newActivity: ActivityResponse = JSON.parse(message.body);
              setActivities(prev => {
                // Ensure no duplicates if we load while receiving
                if (prev.some(a => a.id === newActivity.id)) return prev;
                return [newActivity, ...prev];
              });
            }
          });
        }
      });
      stompClientRef.current.activate();
    }

    return () => {
      isActive = false;
      if (stompClientRef.current) stompClientRef.current.deactivate();
    };
  }, [workspaceId]);

  const loadMore = async () => {
    if (!hasMore || loading) return;
    try {
      const nextPage = page + 1;
      const data = await activityService.getWorkspaceActivity(workspaceId, nextPage, 30);
      setActivities(prev => [...prev, ...data.content]);
      setHasMore(!data.last);
      setPage(nextPage);
    } catch (error) {
      console.error('Failed to load more activities', error);
    }
  };

  if (loading && activities.length === 0) return <div className="activity-loading">Loading...</div>;
  if (activities.length === 0) return <div className="empty-activity" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No activity yet — activity will appear here as your team works</div>;

  return (
    <div className="activity-feed">
      {activities.map(activity => (
        <ActivityItem key={activity.id} activity={activity} workspaceId={workspaceId} />
      ))}
      
      {hasMore && (
        <button className="load-more-btn" onClick={loadMore} disabled={loading}>
          {loading ? '...' : 'Load more'}
        </button>
      )}
    </div>
  );
};

export default ActivityFeed;
