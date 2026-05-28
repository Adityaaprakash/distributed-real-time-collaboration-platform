export interface DocumentEditBroadcast {
  documentId: string;
  content: string;
  title: string;
  editorEmail: string;
  editorFullName: string;
  version: number;
  serverTimestamp: number;
}

export interface CursorBroadcast {
  documentId: string;
  userEmail: string;
  fullName: string;
  cursorLine: number;
}

export interface ActiveUserInfo {
  email: string;
  fullName: string;
}

export interface PresenceBroadcast {
  documentId: string;
  activeUsers: ActiveUserInfo[];
}
