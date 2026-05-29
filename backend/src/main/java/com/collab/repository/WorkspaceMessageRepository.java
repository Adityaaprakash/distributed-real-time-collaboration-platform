package com.collab.repository;

import com.collab.entity.WorkspaceMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WorkspaceMessageRepository extends JpaRepository<WorkspaceMessage, UUID> {
    List<WorkspaceMessage> findTop100ByWorkspaceIdOrderByCreatedAtDesc(UUID workspaceId);
}
