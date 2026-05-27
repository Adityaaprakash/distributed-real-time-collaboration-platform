package com.collab.controller;

import com.collab.dto.CreateDocumentRequest;
import com.collab.dto.DocumentResponse;
import com.collab.dto.DocumentVersionResponse;
import com.collab.dto.UpdateDocumentRequest;
import com.collab.service.DocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/workspaces/{workspaceId}/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    private String getCurrentUserEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @PostMapping
    public ResponseEntity<DocumentResponse> createDocument(
            @PathVariable UUID workspaceId,
            @Valid @RequestBody CreateDocumentRequest request) {
        return new ResponseEntity<>(
                documentService.createDocument(workspaceId, request, getCurrentUserEmail()),
                HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<DocumentResponse>> getWorkspaceDocuments(
            @PathVariable UUID workspaceId) {
        return ResponseEntity.ok(documentService.getWorkspaceDocuments(workspaceId, getCurrentUserEmail()));
    }

    @GetMapping("/{documentId}")
    public ResponseEntity<DocumentResponse> getDocument(
            @PathVariable UUID workspaceId,
            @PathVariable UUID documentId) {
        return ResponseEntity.ok(documentService.getDocument(documentId, workspaceId, getCurrentUserEmail()));
    }

    @PutMapping("/{documentId}")
    public ResponseEntity<DocumentResponse> updateDocument(
            @PathVariable UUID workspaceId,
            @PathVariable UUID documentId,
            @Valid @RequestBody UpdateDocumentRequest request) {
        return ResponseEntity.ok(documentService.updateDocument(documentId, workspaceId, request, getCurrentUserEmail()));
    }

    @DeleteMapping("/{documentId}")
    public ResponseEntity<Void> deleteDocument(
            @PathVariable UUID workspaceId,
            @PathVariable UUID documentId) {
        documentService.deleteDocument(documentId, workspaceId, getCurrentUserEmail());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{documentId}/versions")
    public ResponseEntity<List<DocumentVersionResponse>> getDocumentVersions(
            @PathVariable UUID workspaceId,
            @PathVariable UUID documentId) {
        return ResponseEntity.ok(documentService.getDocumentVersions(documentId, workspaceId, getCurrentUserEmail()));
    }

    @PostMapping("/{documentId}/versions/{versionId}/restore")
    public ResponseEntity<DocumentResponse> restoreVersion(
            @PathVariable UUID workspaceId,
            @PathVariable UUID documentId,
            @PathVariable UUID versionId) {
        return ResponseEntity.ok(documentService.restoreVersion(documentId, versionId, workspaceId, getCurrentUserEmail()));
    }
}
