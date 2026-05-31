# API Reference

**Base URL:** `http://localhost:8080`

**Authentication:** All endpoints except `/api/auth/**` and `GET /api/users/avatar/**` require the header:
```
Authorization: Bearer {token}
```

**Error Response Shape:** All errors return `ApiErrorResponse`:
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "status": 401,
  "error": "Unauthorized",
  "message": "JWT token is expired or invalid",
  "path": "/api/workspaces"
}
```

---

## Authentication

### POST /api/auth/register

Register a new user account.

**Auth required:** No

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "secretpassword",
  "fullName": "Jane Doe"
}
```

**Success response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "email": "user@example.com",
  "fullName": "Jane Doe"
}
```

**Error codes:**
- `400` — Missing or invalid fields
- `409` — Email already registered

---

### POST /api/auth/login

Authenticate with email and password.

**Auth required:** No

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "secretpassword"
}
```

**Success response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "email": "user@example.com",
  "fullName": "Jane Doe"
}
```

**Error codes:**
- `400` — Missing fields
- `401` — Invalid credentials

---

### GET /api/auth/me

Return the currently authenticated user's profile.

**Auth required:** Yes

**Request body:** None

**Success response (200):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "fullName": "Jane Doe",
  "avatarUrl": "/api/users/avatar/avatar_1.jpg",
  "role": "USER"
}
```

**Error codes:**
- `401` — Invalid or missing token

---

## Workspaces

### POST /api/workspaces

Create a new workspace. The authenticated user becomes OWNER.

**Auth required:** Yes

**Request body:**
```json
{
  "name": "Engineering Team",
  "description": "Main engineering workspace"
}
```

**Success response (201):**
```json
{
  "id": 10,
  "name": "Engineering Team",
  "description": "Main engineering workspace",
  "ownerId": 1,
  "createdAt": "2024-01-15T10:00:00Z"
}
```

**Error codes:**
- `400` — Missing name field
- `401` — Unauthorized

---

### GET /api/workspaces

List all workspaces the authenticated user is a member of.

**Auth required:** Yes

**Request body:** None

**Success response (200):**
```json
[
  {
    "id": 10,
    "name": "Engineering Team",
    "description": "Main engineering workspace",
    "memberRole": "OWNER",
    "memberCount": 5
  }
]
```

**Error codes:**
- `401` — Unauthorized

---

### GET /api/workspaces/{id}

Fetch a single workspace by ID.

**Auth required:** Yes
**Roles required:** Must be a member of the workspace

**Request body:** None

**Success response (200):**
```json
{
  "id": 10,
  "name": "Engineering Team",
  "description": "Main engineering workspace",
  "memberRole": "OWNER",
  "memberCount": 5,
  "createdAt": "2024-01-15T10:00:00Z"
}
```

**Error codes:**
- `401` — Unauthorized
- `403` — Not a workspace member
- `404` — Workspace not found

---

### PUT /api/workspaces/{id}

Update workspace name or description.

**Auth required:** Yes
**Roles required:** OWNER or ADMIN

**Request body:**
```json
{
  "name": "Engineering Team v2",
  "description": "Updated description"
}
```

**Success response (200):**
```json
{
  "id": 10,
  "name": "Engineering Team v2",
  "description": "Updated description"
}
```

**Error codes:**
- `401` — Unauthorized
- `403` — Insufficient role
- `404` — Workspace not found

---

### DELETE /api/workspaces/{id}

Delete a workspace and all its data.

**Auth required:** Yes
**Roles required:** OWNER only

**Request body:** None

**Success response (204):** No content

**Error codes:**
- `401` — Unauthorized
- `403` — Not the owner
- `404` — Workspace not found

---

### POST /api/workspaces/{id}/members

Add a member to the workspace by email.

**Auth required:** Yes
**Roles required:** OWNER or ADMIN

**Request body:**
```json
{
  "email": "newmember@example.com",
  "role": "MEMBER"
}
```

**Success response (201):**
```json
{
  "userId": 7,
  "workspaceId": 10,
  "role": "MEMBER",
  "joinedAt": "2024-01-15T11:00:00Z"
}
```

**Error codes:**
- `400` — User not found by email or already a member
- `401` — Unauthorized
- `403` — Insufficient role

---

### GET /api/workspaces/{id}/members

List all members of a workspace.

**Auth required:** Yes
**Roles required:** Must be a workspace member

**Request body:** None

**Success response (200):**
```json
[
  {
    "userId": 1,
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "role": "OWNER",
    "avatarUrl": "/api/users/avatar/avatar_1.jpg"
  }
]
```

**Error codes:**
- `401` — Unauthorized
- `403` — Not a member
- `404` — Workspace not found

---

### DELETE /api/workspaces/{id}/members/{userId}

Remove a member from the workspace.

**Auth required:** Yes
**Roles required:** OWNER or ADMIN (cannot remove OWNER)

**Request body:** None

**Success response (204):** No content

**Error codes:**
- `400` — Cannot remove the workspace OWNER
- `401` — Unauthorized
- `403` — Insufficient role
- `404` — Member not found

---

## Documents

### POST /api/workspaces/{id}/documents

Create a new document in the workspace.

**Auth required:** Yes
**Roles required:** Must be a workspace member

**Request body:**
```json
{
  "title": "Project Spec",
  "content": "## Overview\n\nInitial draft."
}
```

**Success response (201):**
```json
{
  "id": 55,
  "title": "Project Spec",
  "content": "## Overview\n\nInitial draft.",
  "workspaceId": 10,
  "authorId": 1,
  "createdAt": "2024-01-15T12:00:00Z",
  "updatedAt": "2024-01-15T12:00:00Z"
}
```

**Error codes:**
- `401` — Unauthorized
- `403` — Not a workspace member

---

### GET /api/workspaces/{id}/documents

List all documents in a workspace.

**Auth required:** Yes
**Roles required:** Must be a workspace member

**Request body:** None

**Success response (200):**
```json
[
  {
    "id": 55,
    "title": "Project Spec",
    "authorId": 1,
    "updatedAt": "2024-01-15T12:00:00Z"
  }
]
```

**Error codes:**
- `401` — Unauthorized
- `403` — Not a workspace member

---

### GET /api/workspaces/{id}/documents/{docId}

Fetch full document content by ID.

**Auth required:** Yes
**Roles required:** Must be a workspace member

**Request body:** None

**Success response (200):**
```json
{
  "id": 55,
  "title": "Project Spec",
  "content": "## Overview\n\nInitial draft.",
  "workspaceId": 10,
  "authorId": 1,
  "createdAt": "2024-01-15T12:00:00Z",
  "updatedAt": "2024-01-15T12:00:00Z"
}
```

**Error codes:**
- `401` — Unauthorized
- `403` — Not a workspace member
- `404` — Document not found

---

### PUT /api/workspaces/{id}/documents/{docId}

Update a document's title or content via REST (for autosave fallback).

**Auth required:** Yes
**Roles required:** Must be a workspace member

**Request body:**
```json
{
  "title": "Project Spec v2",
  "content": "## Overview\n\nRevised."
}
```

**Success response (200):**
```json
{
  "id": 55,
  "title": "Project Spec v2",
  "content": "## Overview\n\nRevised.",
  "updatedAt": "2024-01-15T14:00:00Z"
}
```

**Error codes:**
- `401` — Unauthorized
- `403` — Not a workspace member
- `404` — Document not found

---

### DELETE /api/workspaces/{id}/documents/{docId}

Delete a document and all its versions.

**Auth required:** Yes
**Roles required:** OWNER or ADMIN, or document author

**Request body:** None

**Success response (204):** No content

**Error codes:**
- `401` — Unauthorized
- `403` — Insufficient permission
- `404` — Document not found

---

### GET /api/workspaces/{id}/documents/{docId}/versions

List all version snapshots for a document.

**Auth required:** Yes
**Roles required:** Must be a workspace member

**Request body:** None

**Success response (200):**
```json
[
  {
    "id": 3,
    "documentId": 55,
    "content": "## Overview\n\nOlder draft.",
    "savedBy": 1,
    "createdAt": "2024-01-15T13:00:00Z"
  }
]
```

**Error codes:**
- `401` — Unauthorized
- `403` — Not a workspace member
- `404` — Document not found

---

### POST /api/workspaces/{id}/documents/{docId}/versions/{vId}/restore

Restore a document to a prior version. A pre-restore snapshot is saved automatically.

**Auth required:** Yes
**Roles required:** Must be a workspace member

**Request body:** None

**Success response (200):**
```json
{
  "id": 55,
  "title": "Project Spec",
  "content": "## Overview\n\nOlder draft.",
  "updatedAt": "2024-01-15T15:00:00Z"
}
```

**Error codes:**
- `401` — Unauthorized
- `403` — Not a workspace member
- `404` — Version or document not found

---

## Chat

### GET /api/workspaces/{id}/messages

Fetch recent chat message history for a workspace (paginated).

**Auth required:** Yes
**Roles required:** Must be a workspace member

**Request body:** None

**Success response (200):**
```json
[
  {
    "id": 201,
    "content": "Hello team!",
    "senderEmail": "jane@example.com",
    "senderName": "Jane Doe",
    "attachmentId": null,
    "createdAt": "2024-01-15T10:05:00Z"
  }
]
```

**Error codes:**
- `401` — Unauthorized
- `403` — Not a workspace member

---

### POST /api/workspaces/{id}/messages

Send a chat message via REST (used for file attachment messages).

**Auth required:** Yes
**Roles required:** Must be a workspace member

**Request body:**
```json
{
  "content": "Check out this file!",
  "attachmentId": 42
}
```

**Success response (201):**
```json
{
  "id": 202,
  "content": "Check out this file!",
  "senderEmail": "jane@example.com",
  "attachmentId": 42,
  "createdAt": "2024-01-15T10:10:00Z"
}
```

**Error codes:**
- `401` — Unauthorized
- `403` — Not a workspace member

---

## Files

### POST /api/files/upload

Upload a file attachment (multipart/form-data).

**Auth required:** Yes

**Request body:** `multipart/form-data` with field `file`

**Success response (201):**
```json
{
  "id": 42,
  "filename": "diagram.png",
  "contentType": "image/png",
  "size": 204800,
  "uploadedBy": 1,
  "uploadedAt": "2024-01-15T10:08:00Z"
}
```

**Error codes:**
- `400` — Empty file or unsupported type
- `401` — Unauthorized

---

### GET /api/files/{id}/download

Download or stream a file attachment.

**Auth required:** Yes

**Request body:** None

**Success response (200):** Binary file stream with appropriate `Content-Type` header.

**Error codes:**
- `401` — Unauthorized
- `404` — File not found

---

### DELETE /api/files/{id}

Delete a file attachment.

**Auth required:** Yes
**Roles required:** File uploader or workspace OWNER/ADMIN

**Request body:** None

**Success response (204):** No content

**Error codes:**
- `401` — Unauthorized
- `403` — Not the uploader or insufficient role
- `404` — File not found

---

## Search

### POST /api/search

Full-text search across documents and workspace messages using PostgreSQL tsvector.

**Auth required:** Yes

**Request body:**
```json
{
  "query": "kubernetes deployment",
  "workspaceId": 10
}
```

**Success response (200):**
```json
{
  "documents": [
    {
      "id": 55,
      "title": "Project Spec",
      "snippet": "...configuring <b>kubernetes deployment</b> pipelines..."
    }
  ],
  "messages": [
    {
      "id": 201,
      "snippet": "...discussed <b>kubernetes deployment</b> strategy..."
    }
  ]
}
```

**Error codes:**
- `400` — Missing query
- `401` — Unauthorized

---

## Notifications

### GET /api/notifications

List all notifications for the authenticated user (paginated, newest first).

**Auth required:** Yes

**Request body:** None

**Success response (200):**
```json
[
  {
    "id": 88,
    "type": "DOCUMENT_UPDATED",
    "message": "Jane Doe updated Project Spec",
    "read": false,
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

**Error codes:**
- `401` — Unauthorized

---

### GET /api/notifications/unread-count

Return the count of unread notifications for the authenticated user.

**Auth required:** Yes

**Request body:** None

**Success response (200):**
```json
{
  "count": 3
}
```

**Error codes:**
- `401` — Unauthorized

---

### POST /api/notifications/{id}/read

Mark a single notification as read.

**Auth required:** Yes

**Request body:** None

**Success response (200):**
```json
{
  "id": 88,
  "read": true
}
```

**Error codes:**
- `401` — Unauthorized
- `404` — Notification not found or not owned by user

---

### POST /api/notifications/read-all

Mark all of the authenticated user's notifications as read.

**Auth required:** Yes

**Request body:** None

**Success response (200):**
```json
{
  "markedRead": 3
}
```

**Error codes:**
- `401` — Unauthorized

---

## Activity

### GET /api/workspaces/{id}/activity

List workspace activity events (newest first, paginated).

**Auth required:** Yes
**Roles required:** Must be a workspace member

**Request body:** None

**Success response (200):**
```json
[
  {
    "id": 12,
    "actorName": "Jane Doe",
    "eventType": "DOCUMENT_CREATED",
    "description": "Jane Doe created document Project Spec",
    "workspaceId": 10,
    "createdAt": "2024-01-15T12:00:00Z"
  }
]
```

**Error codes:**
- `401` — Unauthorized
- `403` — Not a workspace member

---

## User Profiles

### GET /api/users/me

Return the full profile of the authenticated user.

**Auth required:** Yes

**Request body:** None

**Success response (200):**
```json
{
  "id": 1,
  "email": "jane@example.com",
  "fullName": "Jane Doe",
  "avatarUrl": "/api/users/avatar/avatar_1.jpg",
  "role": "USER"
}
```

**Error codes:**
- `401` — Unauthorized

---

### PUT /api/users/me

Update the authenticated user's display name or email.

**Auth required:** Yes

**Request body:**
```json
{
  "fullName": "Jane Smith"
}
```

**Success response (200):**
```json
{
  "id": 1,
  "email": "jane@example.com",
  "fullName": "Jane Smith"
}
```

**Error codes:**
- `400` — Invalid fields
- `401` — Unauthorized

---

### POST /api/users/me/change-password

Change the authenticated user's password.

**Auth required:** Yes

**Request body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

**Success response (200):**
```json
{
  "message": "Password changed successfully"
}
```

**Error codes:**
- `400` — New password too short
- `401` — Current password incorrect

---

### POST /api/users/me/avatar

Upload a new profile avatar (multipart/form-data).

**Auth required:** Yes

**Request body:** `multipart/form-data` with field `avatar`

**Success response (200):**
```json
{
  "avatarUrl": "/api/users/avatar/avatar_1_new.jpg"
}
```

**Error codes:**
- `400` — Missing or invalid image file
- `401` — Unauthorized

---

### GET /api/users/avatar/{filename}

Serve a user avatar image file.

**Auth required:** No

**Request body:** None

**Success response (200):** Binary image stream with `Content-Type: image/*`.

**Error codes:**
- `404` — Avatar file not found

---

### GET /api/users/{id}

Fetch a public profile for any user by ID.

**Auth required:** Yes

**Request body:** None

**Success response (200):**
```json
{
  "id": 7,
  "fullName": "Bob Builder",
  "avatarUrl": "/api/users/avatar/avatar_7.jpg"
}
```

**Error codes:**
- `401` — Unauthorized
- `404` — User not found

---

## Admin

### GET /api/admin/stats

Retrieve platform-wide statistics.

**Auth required:** Yes
**Roles required:** ADMIN

**Request body:** None

**Success response (200):**
```json
{
  "totalUsers": 42,
  "totalWorkspaces": 15,
  "totalDocuments": 230,
  "totalMessages": 8400
}
```

**Error codes:**
- `401` — Unauthorized
- `403` — Not an admin

---

### GET /api/admin/users

List all users in the system (paginated).

**Auth required:** Yes
**Roles required:** ADMIN

**Request body:** None

**Success response (200):**
```json
[
  {
    "id": 1,
    "email": "jane@example.com",
    "fullName": "Jane Doe",
    "role": "ADMIN",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

**Error codes:**
- `401` — Unauthorized
- `403` — Not an admin

---

### POST /api/admin/users/{id}/toggle-admin

Toggle the ADMIN role for a user.

**Auth required:** Yes
**Roles required:** ADMIN

**Request body:** None

**Success response (200):**
```json
{
  "id": 7,
  "role": "ADMIN"
}
```

**Error codes:**
- `401` — Unauthorized
- `403` — Not an admin
- `404` — User not found

---

### DELETE /api/admin/users/{id}

Delete a user account permanently.

**Auth required:** Yes
**Roles required:** ADMIN

**Request body:** None

**Success response (204):** No content

**Error codes:**
- `401` — Unauthorized
- `403` — Not an admin
- `404` — User not found

---

## WebSocket API

**Connection:** SockJS endpoint at `ws://localhost:8080/ws`

**STOMP connect headers:**
```
Authorization: Bearer {token}
```

### Message Destinations (Client → Server)

| Destination | Description | Payload shape |
|---|---|---|
| `/app/documents/{id}/edit` | Send a document edit | `{ "content": "...", "cursorPosition": 42 }` |
| `/app/documents/{id}/join` | Announce presence in a document | `{ "action": "JOIN" }` |
| `/app/documents/{id}/cursor` | Broadcast cursor position | `{ "position": 42, "selection": { "start": 42, "end": 55 } }` |
| `/app/workspaces/{id}/chat` | Send a chat message | `{ "content": "Hello!", "attachmentId": null }` |

### Subscription Topics (Server → Client)

| Topic | Description | Broadcast payload shape |
|---|---|---|
| `/topic/documents/{id}` | Live document content edits | `{ "content": "...", "editorEmail": "jane@example.com" }` |
| `/topic/documents/{id}/presence` | Editor presence join/leave | `{ "action": "JOIN", "userEmail": "jane@example.com", "activeEditors": [...] }` |
| `/topic/documents/{id}/cursor` | Collaborator cursor positions | `{ "userEmail": "...", "position": 42 }` |
| `/topic/workspaces/{id}/chat` | Workspace chat messages | `{ "id": 201, "content": "Hello!", "senderEmail": "...", "createdAt": "..." }` |
| `/topic/activity.{workspaceId}` | Workspace activity feed events | `{ "eventType": "DOCUMENT_CREATED", "actorName": "...", "description": "..." }` |
| `/user/queue/notifications` | Per-user notification delivery | `{ "id": 88, "type": "MENTION", "message": "...", "createdAt": "..." }` |
