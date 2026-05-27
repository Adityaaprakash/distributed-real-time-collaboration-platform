import api from './api';
import { DocumentResponse, DocumentVersionResponse } from '../types/document';

class DocumentService {
  async createDocument(workspaceId: string, data: { title: string; content?: string }): Promise<DocumentResponse> {
    const response = await api.post(`/workspaces/${workspaceId}/documents`, data);
    return response.data;
  }

  async getWorkspaceDocuments(workspaceId: string): Promise<DocumentResponse[]> {
    const response = await api.get(`/workspaces/${workspaceId}/documents`);
    return response.data;
  }

  async getDocument(workspaceId: string, documentId: string): Promise<DocumentResponse> {
    const response = await api.get(`/workspaces/${workspaceId}/documents/${documentId}`);
    return response.data;
  }

  async updateDocument(workspaceId: string, documentId: string, data: { title: string; content?: string }): Promise<DocumentResponse> {
    const response = await api.put(`/workspaces/${workspaceId}/documents/${documentId}`, data);
    return response.data;
  }

  async deleteDocument(workspaceId: string, documentId: string): Promise<void> {
    await api.delete(`/workspaces/${workspaceId}/documents/${documentId}`);
  }

  async getVersions(workspaceId: string, documentId: string): Promise<DocumentVersionResponse[]> {
    const response = await api.get(`/workspaces/${workspaceId}/documents/${documentId}/versions`);
    return response.data;
  }

  async restoreVersion(workspaceId: string, documentId: string, versionId: string): Promise<DocumentResponse> {
    const response = await api.post(`/workspaces/${workspaceId}/documents/${documentId}/versions/${versionId}/restore`);
    return response.data;
  }
}

export default new DocumentService();
