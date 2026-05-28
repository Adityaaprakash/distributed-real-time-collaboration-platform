package com.collab.websocket;

import org.springframework.stereotype.Component;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class PendingEditBuffer {

    public record PendingEdit(String documentId, String content, String title, String editorEmail, long lastModifiedAt) {}

    private final ConcurrentHashMap<String, PendingEdit> pendingEdits = new ConcurrentHashMap<>();

    public void put(String documentId, String content, String title, String editorEmail) {
        pendingEdits.put(documentId, new PendingEdit(documentId, content, title, editorEmail, System.currentTimeMillis()));
    }

    public List<PendingEdit> drainAll() {
        List<PendingEdit> result = new ArrayList<>();
        // Iterate and remove to maintain atomicity and not lose edits
        pendingEdits.entrySet().removeIf(entry -> {
            result.add(entry.getValue());
            return true;
        });
        return result;
    }
}
