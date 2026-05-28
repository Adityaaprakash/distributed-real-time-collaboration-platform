package com.collab.dto.ws;

public record CursorBroadcast(
    String documentId,
    String userEmail,
    String fullName,
    Integer cursorLine
) {}
