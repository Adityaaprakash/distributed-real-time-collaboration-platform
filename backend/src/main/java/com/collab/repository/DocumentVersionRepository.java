package com.collab.repository;

import com.collab.entity.DocumentVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentVersionRepository extends JpaRepository<DocumentVersion, UUID> {
    List<DocumentVersion> findByDocumentIdOrderByVersionDesc(UUID documentId);
    Optional<DocumentVersion> findByIdAndDocumentId(UUID id, UUID documentId);
}
