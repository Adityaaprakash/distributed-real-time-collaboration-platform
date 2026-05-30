package com.collab.dto;

import com.collab.entity.NotificationType;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NotificationResponse {
    private String id;
    private NotificationType type;
    private String title;
    private String message;
    private String workspaceId;
    private String entityId;
    private String entityType;
    private boolean isRead;
    private LocalDateTime createdAt;
}
