package com.collab.controller;

import com.collab.dto.ChatMessageRequest;
import com.collab.service.WorkspaceChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import org.springframework.messaging.MessagingException;

@Controller
@RequiredArgsConstructor
public class WorkspaceChatController {

    private final WorkspaceChatService workspaceChatService;

    @MessageMapping("/workspaces/{workspaceId}/chat")
    public void sendMessage(@DestinationVariable String workspaceId, 
                            @Payload ChatMessageRequest request, 
                            Principal principal) {
        if (principal == null || principal.getName() == null) {
            throw new MessagingException("Unauthorized");
        }
        
        if (request.getContent() == null || request.getContent().trim().isEmpty()) {
            throw new MessagingException("Content cannot be blank");
        }

        workspaceChatService.sendMessage(workspaceId, request.getContent(), principal.getName());
    }
}
