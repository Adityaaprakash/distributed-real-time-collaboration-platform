package com.collab.websocket;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class CollaborationSessionRegistry {

    public record SessionInfo(String documentId, String userEmail, String fullName) {}

    // documentId -> Set of userEmails currently editing
    private final ConcurrentHashMap<String, Set<String>> documentUsers = new ConcurrentHashMap<>();

    // sessionId -> SessionInfo
    private final ConcurrentHashMap<String, SessionInfo> sessionIndex = new ConcurrentHashMap<>();
    
    // userEmail -> fullName
    private final ConcurrentHashMap<String, String> emailToFullName = new ConcurrentHashMap<>();

    public void userJoined(String sessionId, String documentId, String userEmail, String fullName) {
        documentUsers.computeIfAbsent(documentId, k -> ConcurrentHashMap.newKeySet()).add(userEmail);
        sessionIndex.put(sessionId, new SessionInfo(documentId, userEmail, fullName));
        emailToFullName.put(userEmail, fullName);
    }

    public SessionInfo userLeft(String sessionId) {
        SessionInfo info = sessionIndex.remove(sessionId);
        if (info != null) {
            Set<String> users = documentUsers.get(info.documentId());
            if (users != null) {
                users.remove(info.userEmail());
                if (users.isEmpty()) {
                    documentUsers.remove(info.documentId());
                }
            }
        }
        return info;
    }

    public Set<String> getActiveUsers(String documentId) {
        Set<String> users = documentUsers.get(documentId);
        return users != null ? new HashSet<>(users) : Collections.emptySet();
    }

    public String getUserFullName(String userEmail) {
        return emailToFullName.getOrDefault(userEmail, "Unknown");
    }
}
