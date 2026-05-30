export type NotificationType =
  | 'WORKSPACE_INVITE' | 'DOCUMENT_CREATED' | 'DOCUMENT_UPDATED'
  | 'DOCUMENT_RESTORED' | 'USER_JOINED' | 'USER_REMOVED' | 'CHAT_MENTION';

export interface NotificationResponse {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  workspaceId: string | null;
  entityId: string | null;
  entityType: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface UnreadCountResponse {
  count: number;
}
