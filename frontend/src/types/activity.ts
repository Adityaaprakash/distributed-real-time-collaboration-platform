export type ActivityType =
  | 'DOCUMENT_CREATED' | 'DOCUMENT_UPDATED' | 'DOCUMENT_RESTORED'
  | 'MEMBER_JOINED' | 'MEMBER_REMOVED';

export interface ActivityResponse {
  id: string;
  actorFullName: string;
  actorEmail: string;
  activityType: ActivityType;
  description: string;
  entityId: string | null;
  entityType: string | null;
  createdAt: string;
}

export interface ActivityPage {
  content: ActivityResponse[];
  totalElements: number;
  totalPages: number;
  last: boolean;
}
