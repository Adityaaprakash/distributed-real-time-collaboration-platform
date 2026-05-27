export interface DocumentResponse {
  id: string;
  workspaceId: string;
  title: string;
  content: string | null;
  version: number;
  createdByEmail: string;
  createdByFullName: string;
  lastEditedByEmail: string;
  lastEditedByFullName: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersionResponse {
  id: string;
  documentId: string;
  title: string;
  content: string | null;
  version: number;
  editedByEmail: string;
  editedByFullName: string;
  createdAt: string;
}
