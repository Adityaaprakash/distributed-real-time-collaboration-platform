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
public class DocumentVersionResponse {
    private UUID id;
    private UUID documentId;
    private String title;
    private String content;
    private Integer version;
    private String editedByEmail;
    private String editedByFullName;
    private LocalDateTime createdAt;
}
