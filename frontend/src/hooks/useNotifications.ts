import { useState, useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { NotificationResponse } from '../types/notification';
import { notificationService } from '../services/notificationService';
import { getToken } from '../services/auth';

export function useNotifications(currentUserEmail: string | null) {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const stompClientRef = useRef<Client | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!currentUserEmail || !token) return;

    let isActive = true;

    const fetchInitialData = async () => {
      try {
        const [notifsPage, unreadRes] = await Promise.all([
          notificationService.getNotifications(0, 20),
          notificationService.getUnreadCount()
        ]);
        
        if (isActive) {
          setNotifications(notifsPage.content);
          setUnreadCount(unreadRes.count);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchInitialData();

    stompClientRef.current = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        stompClientRef.current?.subscribe('/user/queue/notifications', (message) => {
          if (message.body) {
            const newNotif: NotificationResponse = JSON.parse(message.body);
            setNotifications(prev => [newNotif, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        });
      }
    });

    stompClientRef.current.activate();

    return () => {
      isActive = false;
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [currentUserEmail]);

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark read', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all read', error);
    }
  };

  return { notifications, unreadCount, markAsRead, markAllAsRead };
}
