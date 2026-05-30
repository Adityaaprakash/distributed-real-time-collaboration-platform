package com.collab.dto;

import com.collab.entity.ActivityType;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ActivityResponse {
    private String id;
    private String actorFullName;
    private String actorEmail;
    private ActivityType activityType;
    private String description;
    private String entityId;
    private String entityType;
    private LocalDateTime createdAt;
}
