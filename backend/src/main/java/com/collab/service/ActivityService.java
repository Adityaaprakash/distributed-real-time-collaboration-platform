package com.collab.service;

import com.collab.dto.ActivityResponse;
import com.collab.entity.ActivityType;
import com.collab.entity.User;
import com.collab.entity.Workspace;
import com.collab.entity.WorkspaceActivity;
import com.collab.exception.ResourceNotFoundException;
import com.collab.exception.UnauthorizedException;
import com.collab.repository.UserRepository;
import com.collab.repository.WorkspaceActivityRepository;
import com.collab.repository.WorkspaceMemberRepository;
import com.collab.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final WorkspaceActivityRepository activityRepository;
    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public void recordActivity(UUID workspaceId, String actorEmail, ActivityType type, String description, String entityType, UUID entityId) {
        User actor = userRepository.findByEmail(actorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        WorkspaceActivity activity = new WorkspaceActivity();
        activity.setWorkspace(workspace);
        activity.setActor(actor);
        activity.setActivityType(type);
        activity.setDescription(description);
        activity.setEntityType(entityType);
        activity.setEntityId(entityId);

        WorkspaceActivity saved = activityRepository.save(activity);

        ActivityResponse response = mapToResponse(saved);
        messagingTemplate.convertAndSend("/topic/activity." + workspaceId, response);
    }

    public Page<ActivityResponse> getWorkspaceActivity(UUID workspaceId, String currentUserEmail, int page, int size) {
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        workspaceMemberRepository.findByIdWorkspaceIdAndIdUserId(workspaceId, user.getId())
                .orElseThrow(() -> new UnauthorizedException("User is not a member of this workspace"));

        return activityRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId, PageRequest.of(page, size))
                .map(this::mapToResponse);
    }

    private ActivityResponse mapToResponse(WorkspaceActivity activity) {
        ActivityResponse res = new ActivityResponse();
        res.setId(activity.getId().toString());
        res.setActorFullName(activity.getActor().getFullName());
        res.setActorEmail(activity.getActor().getEmail());
        res.setActivityType(activity.getActivityType());
        res.setDescription(activity.getDescription());
        res.setEntityId(activity.getEntityId() != null ? activity.getEntityId().toString() : null);
        res.setEntityType(activity.getEntityType());
        res.setCreatedAt(activity.getCreatedAt());
        return res;
    }
}
