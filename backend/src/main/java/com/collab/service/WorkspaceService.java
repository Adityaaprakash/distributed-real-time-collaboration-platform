package com.collab.service;

import com.collab.dto.*;
import com.collab.entity.*;
import com.collab.exception.DuplicateMembershipException;
import com.collab.exception.ResourceNotFoundException;
import com.collab.exception.UnauthorizedException;
import com.collab.repository.UserRepository;
import com.collab.repository.WorkspaceMemberRepository;
import com.collab.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final UserRepository userRepository;

    @Transactional
    public WorkspaceResponse createWorkspace(CreateWorkspaceRequest request, String currentUserEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Workspace workspace = Workspace.builder()
                .name(request.getName())
                .description(request.getDescription())
                .owner(currentUser)
                .build();
        workspace = workspaceRepository.save(workspace);

        WorkspaceMemberKey memberKey = new WorkspaceMemberKey(workspace.getId(), currentUser.getId());
        WorkspaceMember member = WorkspaceMember.builder()
                .id(memberKey)
                .workspace(workspace)
                .user(currentUser)
                .role(WorkspaceRole.OWNER)
                .build();
        workspaceMemberRepository.save(member);

        return mapToResponse(workspace, 1);
    }

    @Transactional(readOnly = true)
    public List<WorkspaceResponse> getMyWorkspaces(String currentUserEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<WorkspaceMember> memberships = workspaceMemberRepository.findByIdUserId(currentUser.getId());
        return memberships.stream()
                .map(m -> {
                    Workspace w = m.getWorkspace();
                    int count = workspaceMemberRepository.countByIdWorkspaceId(w.getId());
                    return mapToResponse(w, count);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WorkspaceResponse getWorkspace(UUID workspaceId, String currentUserEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!workspaceMemberRepository.existsByIdWorkspaceIdAndIdUserId(workspaceId, currentUser.getId())) {
            throw new UnauthorizedException("You are not a member of this workspace");
        }

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        int count = workspaceMemberRepository.countByIdWorkspaceId(workspaceId);
        return mapToResponse(workspace, count);
    }

    @Transactional
    public WorkspaceResponse updateWorkspace(UUID workspaceId, UpdateWorkspaceRequest request, String currentUserEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        WorkspaceRole role = getCurrentUserRole(workspaceId, currentUser.getId());
        if (role != WorkspaceRole.OWNER && role != WorkspaceRole.ADMIN) {
            throw new UnauthorizedException("Only owners and admins can update the workspace");
        }

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        workspace.setName(request.getName());
        workspace.setDescription(request.getDescription());
        workspace = workspaceRepository.save(workspace);

        int count = workspaceMemberRepository.countByIdWorkspaceId(workspaceId);
        return mapToResponse(workspace, count);
    }

    @Transactional
    public void deleteWorkspace(UUID workspaceId, String currentUserEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        WorkspaceRole role = getCurrentUserRole(workspaceId, currentUser.getId());
        if (role != WorkspaceRole.OWNER) {
            throw new UnauthorizedException("Only the owner can delete the workspace");
        }

        workspaceRepository.deleteById(workspaceId);
    }

    @Transactional
    public WorkspaceMemberResponse inviteMember(UUID workspaceId, InviteMemberRequest request, String currentUserEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        WorkspaceRole currentRole = getCurrentUserRole(workspaceId, currentUser.getId());
        if (currentRole != WorkspaceRole.OWNER && currentRole != WorkspaceRole.ADMIN) {
            throw new UnauthorizedException("Only owners and admins can invite members");
        }

        if (request.getRole() == WorkspaceRole.OWNER) {
            throw new IllegalArgumentException("Cannot invite a user as OWNER");
        }

        User invitedUser = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Invited user not found"));

        if (workspaceMemberRepository.existsByIdWorkspaceIdAndIdUserId(workspaceId, invitedUser.getId())) {
            throw new DuplicateMembershipException("User is already a member");
        }

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        WorkspaceMemberKey key = new WorkspaceMemberKey(workspaceId, invitedUser.getId());
        WorkspaceMember newMember = WorkspaceMember.builder()
                .id(key)
                .workspace(workspace)
                .user(invitedUser)
                .role(request.getRole())
                .build();

        workspaceMemberRepository.save(newMember);

        return WorkspaceMemberResponse.builder()
                .userId(invitedUser.getId())
                .email(invitedUser.getEmail())
                .fullName(invitedUser.getFullName())
                .role(newMember.getRole().name())
                .build();
    }

    @Transactional
    public void removeMember(UUID workspaceId, UUID targetUserId, String currentUserEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        WorkspaceRole currentRole = getCurrentUserRole(workspaceId, currentUser.getId());
        if (currentRole != WorkspaceRole.OWNER && currentRole != WorkspaceRole.ADMIN) {
            throw new UnauthorizedException("Only owners and admins can remove members");
        }

        WorkspaceRole targetRole = getCurrentUserRole(workspaceId, targetUserId);
        if (targetRole == WorkspaceRole.OWNER) {
            throw new IllegalArgumentException("Cannot remove the owner of the workspace");
        }

        WorkspaceMemberKey key = new WorkspaceMemberKey(workspaceId, targetUserId);
        workspaceMemberRepository.deleteById(key);
    }

    @Transactional(readOnly = true)
    public List<WorkspaceMemberResponse> getMembers(UUID workspaceId, String currentUserEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!workspaceMemberRepository.existsByIdWorkspaceIdAndIdUserId(workspaceId, currentUser.getId())) {
            throw new UnauthorizedException("You are not a member of this workspace");
        }

        List<WorkspaceMember> members = workspaceMemberRepository.findByIdWorkspaceId(workspaceId);
        return members.stream()
                .map(m -> WorkspaceMemberResponse.builder()
                        .userId(m.getUser().getId())
                        .email(m.getUser().getEmail())
                        .fullName(m.getUser().getFullName())
                        .role(m.getRole().name())
                        .build())
                .collect(Collectors.toList());
    }

    private WorkspaceRole getCurrentUserRole(UUID workspaceId, UUID userId) {
        return workspaceMemberRepository.findByIdWorkspaceIdAndIdUserId(workspaceId, userId)
                .map(WorkspaceMember::getRole)
                .orElseThrow(() -> new UnauthorizedException("User is not a member of the workspace"));
    }

    private WorkspaceResponse mapToResponse(Workspace w, int count) {
        return WorkspaceResponse.builder()
                .id(w.getId())
                .name(w.getName())
                .description(w.getDescription())
                .ownerId(w.getOwner().getId())
                .ownerName(w.getOwner().getFullName())
                .memberCount(count)
                .createdAt(w.getCreatedAt())
                .build();
    }
}
