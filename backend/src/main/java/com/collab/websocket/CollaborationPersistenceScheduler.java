package com.collab.websocket;

import com.collab.service.DocumentPersistenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class CollaborationPersistenceScheduler {

    private final PendingEditBuffer pendingEditBuffer;
    private final DocumentPersistenceService documentPersistenceService;

    @Scheduled(fixedDelay = 5000)
    public void persistPendingEdits() {
        List<PendingEditBuffer.PendingEdit> edits = pendingEditBuffer.drainAll();
        for (PendingEditBuffer.PendingEdit edit : edits) {
            documentPersistenceService.persistEdit(edit);
        }
    }
}
