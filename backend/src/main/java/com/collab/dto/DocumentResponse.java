package com.collab.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentResponse {
    private UUID id;
    private UUID workspaceId;
    private String title;
    private String content;
    private Integer version;
    private String createdByEmail;
    private String createdByFullName;
    private String lastEditedByEmail;
    private String lastEditedByFullName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
