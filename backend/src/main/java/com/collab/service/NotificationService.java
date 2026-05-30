package com.collab.service;

import com.collab.dto.NotificationResponse;
import com.collab.dto.UnreadCountResponse;
import com.collab.entity.Notification;
import com.collab.entity.NotificationType;
import com.collab.entity.User;
import com.collab.entity.Workspace;
import com.collab.exception.ResourceNotFoundException;
import com.collab.repository.NotificationRepository;
import com.collab.repository.UserRepository;
import com.collab.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public NotificationResponse createAndDeliver(UUID recipientId, NotificationType type, String title, String message, UUID workspaceId, String entityType, UUID entityId) {
        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Workspace workspace = null;
        if (workspaceId != null) {
            workspace = workspaceRepository.findById(workspaceId).orElse(null);
        }

        Notification notification = new Notification();
        notification.setUser(recipient);
        notification.setWorkspace(workspace);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setEntityType(entityType);
        notification.setEntityId(entityId);

        Notification saved = notificationRepository.save(notification);

        NotificationResponse response = mapToResponse(saved);

        messagingTemplate.convertAndSendToUser(recipient.getEmail(), "/queue/notifications", response);

        return response;
    }

    @Transactional
    public void createBulk(List<UUID> recipientIds, NotificationType type, String title, String message, UUID workspaceId, String entityType, UUID entityId) {
        for (UUID recipientId : recipientIds) {
            createAndDeliver(recipientId, type, title, message, workspaceId, entityType, entityId);
        }
    }

    public Page<NotificationResponse> getUserNotifications(String currentUserEmail, int page, int size) {
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), PageRequest.of(page, size))
                .map(this::mapToResponse);
    }

    public UnreadCountResponse getUnreadCount(String currentUserEmail) {
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        long count = notificationRepository.countByUserIdAndIsReadFalse(user.getId());
        return new UnreadCountResponse(count);
    }

    public void markAsRead(UUID notificationId, String currentUserEmail) {
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        int updatedCount = notificationRepository.markOneRead(notificationId, user.getId());
        if (updatedCount == 0) {
            throw new ResourceNotFoundException("Notification not found or already read");
        }
    }

    public void markAllAsRead(String currentUserEmail) {
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        notificationRepository.markAllReadByUserId(user.getId());
    }

    private NotificationResponse mapToResponse(Notification notification) {
        NotificationResponse res = new NotificationResponse();
        res.setId(notification.getId().toString());
        res.setType(notification.getType());
        res.setTitle(notification.getTitle());
        res.setMessage(notification.getMessage());
        res.setWorkspaceId(notification.getWorkspace() != null ? notification.getWorkspace().getId().toString() : null);
        res.setEntityId(notification.getEntityId() != null ? notification.getEntityId().toString() : null);
        res.setEntityType(notification.getEntityType());
        res.setRead(notification.isRead());
        res.setCreatedAt(notification.getCreatedAt());
        return res;
    }
}
