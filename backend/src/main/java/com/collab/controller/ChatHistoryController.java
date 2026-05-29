package com.collab.controller;

import com.collab.dto.ChatMessageResponse;
import com.collab.service.WorkspaceChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/workspaces/{workspaceId}/messages")
@RequiredArgsConstructor
public class ChatHistoryController {

    private final WorkspaceChatService workspaceChatService;

    @GetMapping
    public ResponseEntity<List<ChatMessageResponse>> getWorkspaceMessages(@PathVariable String workspaceId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserEmail = authentication.getName();
        
        List<ChatMessageResponse> messages = workspaceChatService.getWorkspaceMessages(workspaceId, currentUserEmail);
        return ResponseEntity.ok(messages);
    }
}
