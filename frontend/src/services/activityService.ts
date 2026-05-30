import { authApi } from './auth';
import { ActivityPage } from '../types/activity';

export const activityService = {
  getWorkspaceActivity: async (workspaceId: string, page = 0, size = 30): Promise<ActivityPage> => {
    const response = await authApi.get(`/api/workspaces/${workspaceId}/activity?page=${page}&size=${size}`);
    return response.data;
  }
};
