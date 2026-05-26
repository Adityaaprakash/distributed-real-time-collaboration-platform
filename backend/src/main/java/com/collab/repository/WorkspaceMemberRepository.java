package com.collab.repository;

import com.collab.entity.WorkspaceMember;
import com.collab.entity.WorkspaceMemberKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkspaceMemberRepository extends JpaRepository<WorkspaceMember, WorkspaceMemberKey> {
    List<WorkspaceMember> findByIdWorkspaceId(UUID workspaceId);
    List<WorkspaceMember> findByIdUserId(UUID userId);
    Optional<WorkspaceMember> findByIdWorkspaceIdAndIdUserId(UUID workspaceId, UUID userId);
    boolean existsByIdWorkspaceIdAndIdUserId(UUID workspaceId, UUID userId);
    int countByIdWorkspaceId(UUID workspaceId);
}
