package com.collab.dto.ws;

public record PresenceMessage(
    String documentId,
    String status
) {}
