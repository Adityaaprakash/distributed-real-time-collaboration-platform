package com.collab.controller;

import com.collab.dto.ws.*;
import com.collab.entity.Document;
import com.collab.entity.User;
import com.collab.repository.DocumentRepository;
import com.collab.repository.UserRepository;
import com.collab.repository.WorkspaceMemberRepository;
import com.collab.websocket.CollaborationSessionRegistry;
import com.collab.websocket.PendingEditBuffer;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.messaging.MessagingException;

import java.security.Principal;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import lombok.extern.slf4j.Slf4j;

@Controller
@RequiredArgsConstructor
@Slf4j
public class CollaborationWebSocketController {

    private final CollaborationSessionRegistry sessionRegistry;
    private final PendingEditBuffer pendingEditBuffer;
    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private void verifyMembership(String documentId, String email) {
        Document document = documentRepository.findById(UUID.fromString(documentId))
                .orElseThrow(() -> new MessagingException("Document not found"));
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new MessagingException("User not found"));
        
        workspaceMemberRepository.findByIdWorkspaceIdAndIdUserId(document.getWorkspace().getId(), user.getId())
                .orElseThrow(() -> new MessagingException("Forbidden"));
    }

    @MessageMapping("/documents/{documentId}/join")
    public void joinDoc(@DestinationVariable String documentId, @Payload PresenceMessage payload, Principal principal, SimpMessageHeaderAccessor accessor) {
        String email = principal.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) throw new MessagingException("User not found");
        
        verifyMembership(documentId, email);

        String sessionId = accessor.getSessionId();
        sessionRegistry.userJoined(sessionId, documentId, email, user.getFullName());

        broadcastPresence(documentId);
    }

    @MessageMapping("/documents/{documentId}/leave")
    public void leaveDoc(@DestinationVariable String documentId, @Payload PresenceMessage payload, SimpMessageHeaderAccessor accessor) {
        String sessionId = accessor.getSessionId();
        sessionRegistry.userLeft(sessionId);
        broadcastPresence(documentId);
    }

    @MessageMapping("/documents/{documentId}/edit")
    public void editDoc(@DestinationVariable String documentId, @Payload DocumentEditMessage message, Principal principal) {
        String email = principal.getName();
        User user = userRepository.findByEmail(email).orElseThrow();
        verifyMembership(documentId, email);
        
        log.debug("WS edit received: document={}, user={}", documentId, email);
        pendingEditBuffer.put(documentId, message.content(), message.title(), email);

        Document doc = documentRepository.findById(UUID.fromString(documentId)).orElseThrow();
        
        DocumentEditBroadcast broadcast = new DocumentEditBroadcast(
                documentId,
                message.content(),
                message.title(),
                email,
                user.getFullName(),
                doc.getVersion(),
                System.currentTimeMillis()
        );
        messagingTemplate.convertAndSend("/topic/documents/" + documentId, broadcast);
    }

    @MessageMapping("/documents/{documentId}/cursor")
    public void cursorDoc(@DestinationVariable String documentId, @Payload CursorPositionMessage message, Principal principal) {
        String email = principal.getName();
        String fullName = sessionRegistry.getUserFullName(email);
        verifyMembership(documentId, email);

        CursorBroadcast broadcast = new CursorBroadcast(documentId, email, fullName, message.cursorLine());
        messagingTemplate.convertAndSend("/topic/documents/" + documentId + "/cursor", broadcast);
    }

    private void broadcastPresence(String documentId) {
        Set<String> emails = sessionRegistry.getActiveUsers(documentId);
        List<ActiveUserInfo> activeUsers = emails.stream()
                .map(e -> new ActiveUserInfo(e, sessionRegistry.getUserFullName(e)))
                .collect(Collectors.toList());

        PresenceBroadcast broadcast = new PresenceBroadcast(documentId, activeUsers);
        messagingTemplate.convertAndSend("/topic/documents/" + documentId + "/presence", broadcast);
    }
}
