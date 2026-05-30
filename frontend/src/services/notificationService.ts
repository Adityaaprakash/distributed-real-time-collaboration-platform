import { authApi } from './auth';
import { NotificationResponse, UnreadCountResponse } from '../types/notification';

interface NotificationPage {
  content: NotificationResponse[];
  totalElements: number;
}

export const notificationService = {
  getNotifications: async (page = 0, size = 20): Promise<NotificationPage> => {
    const response = await authApi.get(`/api/notifications?page=${page}&size=${size}`);
    return response.data;
  },

  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const response = await authApi.get('/api/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (id: string): Promise<void> => {
    await authApi.post(`/api/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await authApi.post('/api/notifications/read-all');
  }
};
