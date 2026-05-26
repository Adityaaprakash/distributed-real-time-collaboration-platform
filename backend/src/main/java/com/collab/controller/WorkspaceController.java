package com.collab.controller;

import com.collab.dto.CreateWorkspaceRequest;
import com.collab.dto.InviteMemberRequest;
import com.collab.dto.UpdateWorkspaceRequest;
import com.collab.dto.WorkspaceMemberResponse;
import com.collab.dto.WorkspaceResponse;
import com.collab.service.WorkspaceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/workspaces")
@RequiredArgsConstructor
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    private String getCurrentUserEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public WorkspaceResponse createWorkspace(@Valid @RequestBody CreateWorkspaceRequest request) {
        return workspaceService.createWorkspace(request, getCurrentUserEmail());
    }

    @GetMapping
    public List<WorkspaceResponse> getMyWorkspaces() {
        return workspaceService.getMyWorkspaces(getCurrentUserEmail());
    }

    @GetMapping("/{workspaceId}")
    public WorkspaceResponse getWorkspace(@PathVariable UUID workspaceId) {
        return workspaceService.getWorkspace(workspaceId, getCurrentUserEmail());
    }

    @PutMapping("/{workspaceId}")
    public WorkspaceResponse updateWorkspace(@PathVariable UUID workspaceId, @Valid @RequestBody UpdateWorkspaceRequest request) {
        return workspaceService.updateWorkspace(workspaceId, request, getCurrentUserEmail());
    }

    @DeleteMapping("/{workspaceId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteWorkspace(@PathVariable UUID workspaceId) {
        workspaceService.deleteWorkspace(workspaceId, getCurrentUserEmail());
    }

    @PostMapping("/{workspaceId}/members")
    @ResponseStatus(HttpStatus.CREATED)
    public WorkspaceMemberResponse inviteMember(@PathVariable UUID workspaceId, @Valid @RequestBody InviteMemberRequest request) {
        return workspaceService.inviteMember(workspaceId, request, getCurrentUserEmail());
    }

    @GetMapping("/{workspaceId}/members")
    public List<WorkspaceMemberResponse> getMembers(@PathVariable UUID workspaceId) {
        return workspaceService.getMembers(workspaceId, getCurrentUserEmail());
    }

    @DeleteMapping("/{workspaceId}/members/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeMember(@PathVariable UUID workspaceId, @PathVariable UUID userId) {
        workspaceService.removeMember(workspaceId, userId, getCurrentUserEmail());
    }
}
