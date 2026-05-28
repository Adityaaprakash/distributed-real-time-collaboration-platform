package com.collab.dto.ws;

public record DocumentEditMessage(
    String documentId,
    String content,
    String title,
    Long clientTimestamp
) {}
