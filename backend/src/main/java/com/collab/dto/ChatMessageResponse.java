package com.collab.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageResponse {
    private String id;
    private String workspaceId;
    private String senderId;
    private String senderEmail;
    private String senderFullName;
    private String content;
    private String createdAt;
}
