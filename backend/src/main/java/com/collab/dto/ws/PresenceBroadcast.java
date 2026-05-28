package com.collab.dto.ws;

import java.util.List;

public record PresenceBroadcast(
    String documentId,
    List<ActiveUserInfo> activeUsers
) {}
