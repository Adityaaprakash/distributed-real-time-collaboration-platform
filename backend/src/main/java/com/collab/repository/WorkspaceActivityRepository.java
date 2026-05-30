package com.collab.repository;

import com.collab.entity.WorkspaceActivity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface WorkspaceActivityRepository extends JpaRepository<WorkspaceActivity, UUID> {

    Page<WorkspaceActivity> findByWorkspaceIdOrderByCreatedAtDesc(UUID workspaceId, Pageable pageable);

}
