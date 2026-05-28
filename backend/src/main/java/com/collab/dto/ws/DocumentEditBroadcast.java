package com.collab.dto.ws;

public record DocumentEditBroadcast(
    String documentId,
    String content,
    String title,
    String editorEmail,
    String editorFullName,
    Integer version,
    Long serverTimestamp
) {}
