package com.collab.service;

import com.collab.dto.CreateDocumentRequest;
import com.collab.dto.DocumentResponse;
import com.collab.dto.DocumentVersionResponse;
import com.collab.dto.UpdateDocumentRequest;
import com.collab.entity.*;
import com.collab.exception.DocumentAccessDeniedException;
import com.collab.exception.DocumentNotFoundException;
import com.collab.exception.ResourceNotFoundException;
import com.collab.exception.UnauthorizedException;
import com.collab.repository.DocumentRepository;
import com.collab.repository.DocumentVersionRepository;
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
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final DocumentVersionRepository documentVersionRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final UserRepository userRepository;

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private WorkspaceMember getWorkspaceMember(UUID workspaceId, UUID userId) {
        return workspaceMemberRepository.findByIdWorkspaceIdAndIdUserId(workspaceId, userId)
                .orElseThrow(() -> new UnauthorizedException("User is not a member of this workspace"));
    }

    @Transactional
    public DocumentResponse createDocument(UUID workspaceId, CreateDocumentRequest request, String currentUserEmail) {
        User user = getUserByEmail(currentUserEmail);
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        getWorkspaceMember(workspaceId, user.getId());

        Document document = Document.builder()
                .workspace(workspace)
                .title(request.getTitle())
                .content(request.getContent())
                .createdBy(user)
                .lastEditedBy(user)
                .version(1)
                .build();

        document = documentRepository.save(document);
        return mapToDocumentResponse(document, true);
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> getWorkspaceDocuments(UUID workspaceId, String currentUserEmail) {
        User user = getUserByEmail(currentUserEmail);
        getWorkspaceMember(workspaceId, user.getId());

        return documentRepository.findByWorkspaceId(workspaceId).stream()
                .map(doc -> mapToDocumentResponse(doc, false))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DocumentResponse getDocument(UUID documentId, UUID workspaceId, String currentUserEmail) {
        User user = getUserByEmail(currentUserEmail);
        getWorkspaceMember(workspaceId, user.getId());

        Document document = documentRepository.findByIdAndWorkspaceId(documentId, workspaceId)
                .orElseThrow(() -> new DocumentNotFoundException("Document not found in this workspace"));

        return mapToDocumentResponse(document, true);
    }

    @Transactional
    public DocumentResponse updateDocument(UUID documentId, UUID workspaceId, UpdateDocumentRequest request, String currentUserEmail) {
        User user = getUserByEmail(currentUserEmail);
        getWorkspaceMember(workspaceId, user.getId());

        Document document = documentRepository.findByIdAndWorkspaceId(documentId, workspaceId)
                .orElseThrow(() -> new DocumentNotFoundException("Document not found in this workspace"));

        saveVersionSnapshot(document);

        document.setTitle(request.getTitle());
        document.setContent(request.getContent());
        document.setVersion(document.getVersion() + 1);
        document.setLastEditedBy(user);

        document = documentRepository.save(document);
        return mapToDocumentResponse(document, true);
    }

    @Transactional
    public void deleteDocument(UUID documentId, UUID workspaceId, String currentUserEmail) {
        User user = getUserByEmail(currentUserEmail);
        WorkspaceMember member = getWorkspaceMember(workspaceId, user.getId());

        Document document = documentRepository.findByIdAndWorkspaceId(documentId, workspaceId)
                .orElseThrow(() -> new DocumentNotFoundException("Document not found in this workspace"));

        boolean isCreator = document.getCreatedBy().getId().equals(user.getId());
        boolean hasPrivilege = member.getRole() == WorkspaceRole.OWNER || member.getRole() == WorkspaceRole.ADMIN;

        if (!isCreator && !hasPrivilege) {
            throw new DocumentAccessDeniedException("You do not have permission to delete this document");
        }

        documentRepository.delete(document);
    }

    @Transactional(readOnly = true)
    public List<DocumentVersionResponse> getDocumentVersions(UUID documentId, UUID workspaceId, String currentUserEmail) {
        User user = getUserByEmail(currentUserEmail);
        getWorkspaceMember(workspaceId, user.getId());

        if (!documentRepository.existsById(documentId)) {
            throw new DocumentNotFoundException("Document not found in this workspace");
        }
        
        // Ensure document belongs to workspace
        documentRepository.findByIdAndWorkspaceId(documentId, workspaceId)
               .orElseThrow(() -> new DocumentNotFoundException("Document not found in this workspace"));


        return documentVersionRepository.findByDocumentIdOrderByVersionDesc(documentId).stream()
                .map(this::mapToDocumentVersionResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public DocumentResponse restoreVersion(UUID documentId, UUID versionId, UUID workspaceId, String currentUserEmail) {
        User user = getUserByEmail(currentUserEmail);
        getWorkspaceMember(workspaceId, user.getId());

        Document document = documentRepository.findByIdAndWorkspaceId(documentId, workspaceId)
                .orElseThrow(() -> new DocumentNotFoundException("Document not found in this workspace"));

        DocumentVersion version = documentVersionRepository.findByIdAndDocumentId(versionId, documentId)
                .orElseThrow(() -> new DocumentNotFoundException("Version not found for this document"));

        saveVersionSnapshot(document);

        document.setTitle(version.getTitle());
        document.setContent(version.getContent());
        document.setVersion(document.getVersion() + 1);
        document.setLastEditedBy(user);

        document = documentRepository.save(document);
        return mapToDocumentResponse(document, true);
    }

    void saveVersionSnapshot(Document document) {
        DocumentVersion version = DocumentVersion.builder()
                .document(document)
                .title(document.getTitle())
                .content(document.getContent())
                .version(document.getVersion())
                .editedBy(document.getLastEditedBy())
                .build();
        documentVersionRepository.save(version);
    }

    private DocumentResponse mapToDocumentResponse(Document doc, boolean includeContent) {
        return DocumentResponse.builder()
                .id(doc.getId())
                .workspaceId(doc.getWorkspace().getId())
                .title(doc.getTitle())
                .content(includeContent ? doc.getContent() : null)
                .version(doc.getVersion())
                .createdByEmail(doc.getCreatedBy().getEmail())
                .createdByFullName(doc.getCreatedBy().getFullName())
                .lastEditedByEmail(doc.getLastEditedBy().getEmail())
                .lastEditedByFullName(doc.getLastEditedBy().getFullName())
                .createdAt(doc.getCreatedAt())
                .updatedAt(doc.getUpdatedAt())
                .build();
    }

    private DocumentVersionResponse mapToDocumentVersionResponse(DocumentVersion version) {
        return DocumentVersionResponse.builder()
                .id(version.getId())
                .documentId(version.getDocument().getId())
                .title(version.getTitle())
                .content(version.getContent())
                .version(version.getVersion())
                .editedByEmail(version.getEditedBy().getEmail())
                .editedByFullName(version.getEditedBy().getFullName())
                .createdAt(version.getCreatedAt())
                .build();
    }
}
