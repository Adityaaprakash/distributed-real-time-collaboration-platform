package com.collab.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChatMessageRequest {
    private String workspaceId;

    @NotBlank
    @Size(max = 4000)
    private String content;
}
