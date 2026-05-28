package com.collab.service;

import com.collab.entity.Document;
import com.collab.entity.User;
import com.collab.repository.DocumentRepository;
import com.collab.repository.UserRepository;
import com.collab.websocket.PendingEditBuffer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentPersistenceService {

    private final DocumentRepository documentRepository;
    private final DocumentService documentService;
    private final UserRepository userRepository;

    @Transactional
    public void persistEdit(PendingEditBuffer.PendingEdit edit) {
        Document document = documentRepository.findById(UUID.fromString(edit.documentId())).orElse(null);
        if (document == null) return;

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime lastUpdate = document.getUpdatedAt();
        if (lastUpdate == null) lastUpdate = LocalDateTime.now().minusDays(1);

        if (Duration.between(lastUpdate, now).getSeconds() > 60) {
            documentService.saveVersionSnapshot(document);
        }

        document.setTitle(edit.title());
        document.setContent(edit.content());
        document.setVersion(document.getVersion() + 1);

        userRepository.findByEmail(edit.editorEmail()).ifPresent(document::setLastEditedBy);

        documentRepository.save(document);
    }
}
