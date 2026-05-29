import { authApi as api } from './auth';

export interface ChatMessageResponse {
  id: string;
  workspaceId: string;
  senderId: string;
  senderEmail: string;
  senderFullName: string;
  content: string;
  createdAt: string;
  _optimistic?: boolean;
}

export const chatService = {
  getMessages: async (workspaceId: string): Promise<ChatMessageResponse[]> => {
    const response = await api.get(`/api/workspaces/${workspaceId}/messages`);
    return response.data;
  },
};
