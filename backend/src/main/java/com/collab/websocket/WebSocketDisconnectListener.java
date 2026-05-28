package com.collab.websocket;

import com.collab.dto.ws.ActiveUserInfo;
import com.collab.dto.ws.PresenceBroadcast;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketDisconnectListener {

    private final CollaborationSessionRegistry sessionRegistry;
    private final SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        String sessionId = event.getSessionId();
        CollaborationSessionRegistry.SessionInfo info = sessionRegistry.userLeft(sessionId);
        if (info != null) {
            Set<String> currentEmails = sessionRegistry.getActiveUsers(info.documentId());
            List<ActiveUserInfo> activeUsers = currentEmails.stream()
                .map(email -> new ActiveUserInfo(email, sessionRegistry.getUserFullName(email)))
                .collect(Collectors.toList());
            
            PresenceBroadcast broadcast = new PresenceBroadcast(info.documentId(), activeUsers);
            messagingTemplate.convertAndSend(
                "/topic/documents/" + info.documentId() + "/presence", broadcast);
        }
    }
}
