import { authApi } from './auth';

export interface WorkspaceResponse {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  ownerName: string;
  memberCount: number;
  createdAt: string;
}

export interface WorkspaceMemberResponse {
  userId: string;
  email: string;
  fullName: string;
  role: string;
}

const API_URL = '/api/workspaces';

export const workspaceService = {
  createWorkspace: async (data: { name: string; description?: string }): Promise<WorkspaceResponse> => {
    const response = await authApi.post(API_URL, data);
    return response.data;
  },

  getMyWorkspaces: async (): Promise<WorkspaceResponse[]> => {
    const response = await authApi.get(API_URL);
    return response.data;
  },

  getWorkspace: async (id: string): Promise<WorkspaceResponse> => {
    const response = await authApi.get(`${API_URL}/${id}`);
    return response.data;
  },

  updateWorkspace: async (id: string, data: { name: string; description?: string }): Promise<WorkspaceResponse> => {
    const response = await authApi.put(`${API_URL}/${id}`, data);
    return response.data;
  },

  deleteWorkspace: async (id: string): Promise<void> => {
    await authApi.delete(`${API_URL}/${id}`);
  },

  inviteMember: async (workspaceId: string, data: { email: string; role: string }): Promise<WorkspaceMemberResponse> => {
    const response = await authApi.post(`${API_URL}/${workspaceId}/members`, data);
    return response.data;
  },

  getMembers: async (workspaceId: string): Promise<WorkspaceMemberResponse[]> => {
    const response = await authApi.get(`${API_URL}/${workspaceId}/members`);
    return response.data;
  },

  removeMember: async (workspaceId: string, userId: string): Promise<void> => {
    await authApi.delete(`${API_URL}/${workspaceId}/members/${userId}`);
  }
};
