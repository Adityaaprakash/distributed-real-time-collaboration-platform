package com.collab.dto.ws;

public record CursorPositionMessage(
    String documentId,
    Integer cursorLine
) {}
