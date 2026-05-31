# Feature Walkthrough

This document describes each screen of the platform with technical implementation notes. Actual screenshots can be added at `docs/screenshots/`.

---

## Login / Register

Users land on a split-screen auth page where they can create a new account or sign in with an existing one; form validation runs client-side before submission, and server errors (e.g., duplicate email) are surfaced inline beneath the relevant field. On successful login, the JWT is stored in `localStorage` and the user is redirected to their dashboard without a full page reload.

**Technical implementation:**
- `JwtAuthFilter` validates the `Authorization: Bearer` header on every protected REST request and sets the `SecurityContext` via `UsernamePasswordAuthenticationToken`.
- `JwtUtils.generateToken()` signs the JWT with an HS256 secret and embeds the user's email as the subject, which serves as the principal identifier throughout the system.
- `GlobalExceptionHandler` catches `BadCredentialsException` and `UsernameNotFoundException` and maps them to a structured `ApiErrorResponse` (400/401) so the React error boundary can display a user-friendly message.

---

## Dashboard

The dashboard greets the authenticated user by name and displays a grid of all workspaces they belong to, with role badges (OWNER / ADMIN / MEMBER) and a live member count. A floating action button opens a modal to create a new workspace; the list updates optimistically without a full reload.

**Technical implementation:**
- `WorkspaceController.getWorkspaces()` queries `WorkspaceRepository` via a JPQL join on `workspace_members` filtered by the authenticated user's ID, returned as a list of `WorkspaceDto`.
- The composite `@EmbeddedId` (`WorkspaceMemberKey`) on the `WorkspaceMember` entity enforces the compound primary key `(workspaceId, userId)` at the JPA layer, preventing duplicate membership rows.
- `ActivityService.updateLastActive()` is annotated `@Async` so that recording the user's dashboard visit does not block the HTTP response thread.

---

## Workspace Detail — Members and Settings

Inside a workspace, a tabbed layout presents the document list, member roster, and settings panel. The members tab shows each user's avatar, email, role, and — for OWNER/ADMIN — a dropdown to promote/demote or remove the member. The settings panel allows renaming the workspace or, for the OWNER, deleting it.

**Technical implementation:**
- `WorkspaceMemberController` enforces OWNER/ADMIN guards via a custom `@PreAuthorize` expression that evaluates the caller's role from the `workspace_members` table rather than a global Spring Security role, preventing privilege escalation across workspaces.
- `WorkspaceController.removeMember()` throws a `BusinessException` mapped to HTTP 400 if the target member is the OWNER, surfaced as a toast notification in the UI.
- Member list rendering uses React's `key={member.userId}` on the composite ID to ensure stable reconciliation when roles change without a full list re-fetch.

---

## Document Editor — Solo

Opening a document shows a full-screen rich text editor with a collapsible version history sidebar. The editor autosaves via a 2-second debounce — changes are sent over WebSocket when a collaborative session is active, or via `PUT /api/workspaces/{id}/documents/{docId}` as a REST fallback. Clicking a version entry in the sidebar previews its content; clicking "Restore" calls the restore endpoint and reloads the editor with the historical content.

**Technical implementation:**
- `DocumentPersistenceService.saveVersionSnapshot()` inserts a row into `document_versions` only if 60 seconds have elapsed since the last snapshot for that document, controlled by a `ConcurrentHashMap<Long, Instant>` of last-snapshot timestamps — this prevents runaway version table growth during active editing sessions.
- The restore endpoint calls `DocumentPersistenceService.restoreVersion()`, which first saves a pre-restore snapshot of the current content so the restore itself is reversible.
- `DocumentVersionRepository` returns versions ordered by `createdAt DESC` so the sidebar always shows the most recent snapshot at the top.

---

## Document Editor — Collaborative (Two Users)

When a second user opens the same document, both editors see each other's avatar appear in a presence bar above the editor. Cursor positions are broadcast in real time as coloured caret overlays labeled with the collaborator's name. All keystrokes from either user propagate to the other within the same WebSocket connection.

**Technical implementation:**
- The `useCollaboration` hook sets an `isUserTyping` ref to `true` whenever the local user dispatches an edit, suppressing incoming WebSocket content updates for 300ms to prevent the user's own cursor from jumping — this ref-based guard avoids a closure-stale-state bug that would occur if a state variable were used instead.
- `PendingEditBuffer` (a `ConcurrentHashMap<Long, String>`) accumulates the latest content per document ID; `CollaborationPersistenceScheduler` drains it every 5 seconds via `@Scheduled(fixedDelay = 5000)` and checks the per-document snapshot timestamp before optionally writing a `document_versions` row (60-second throttle preserves version granularity without overwhelming the database).
- `CollaborationSessionRegistry` tracks active editor emails per document ID in a `ConcurrentHashMap`; `WebSocketDisconnectListener` listens for `SessionDisconnectEvent` and removes the disconnecting user's session from the registry, triggering a presence update broadcast to all remaining subscribers.

---

## Chat Panel with File Attachments

Each workspace has a persistent chat panel that displays message history ordered chronologically and streams new messages in real time via WebSocket subscription. Users can send text messages directly, or attach a file using the upload button — images render as inline previews; other file types show a download link. Mentioning a teammate with `@email` highlights the pill and triggers a notification to that user.

**Technical implementation:**
- `WorkspaceChatController` persists the incoming `WorkspaceMessage` entity to PostgreSQL via `WorkspaceMessageRepository`, then publishes the serialized DTO to the `workspace.chat.{id}` Redis topic via `RedisMessagePublisher`, decoupling broadcast latency from write latency.
- `MentionDetectionService` scans message content for `@email` patterns after persistence and calls `NotificationService.createAndDeliver()` for each detected mention, which persists a `Notification` row and calls `convertAndSendToUser()` to route a push notification to the mentioned user's active WebSocket session.
- The React chat component performs optimistic updates keyed by a client-generated UUID — when the server broadcast arrives, the local optimistic message is replaced by the authoritative server response using the message ID for deduplication, preventing flicker.

---

## Notification Bell and Panel

A bell icon in the top navigation bar displays an unread count badge that increments in real time when a new notification arrives over the user's dedicated `/user/queue/notifications` subscription. Clicking the bell opens a slide-in panel listing all recent notifications with type icons, timestamps, and a "mark all read" button.

**Technical implementation:**
- `NotificationService.createAndDeliver()` persists the `Notification` entity first (ensuring delivery survives a WebSocket disconnect) then calls `SimpMessagingTemplate.convertAndSendToUser(recipientEmail, "/queue/notifications", notificationDto)`, which Spring prefixes to `/user/queue/notifications` using the email-based principal set by `WebSocketAuthChannelInterceptor`.
- `GET /api/notifications/unread-count` is called on page load and after each mark-read action to hydrate the badge count from the database, ensuring the badge is accurate after a page refresh or across devices.
- The notification panel uses a `useNotifications` hook that merges real-time WebSocket arrivals into the existing notification list state without re-fetching the entire list, keeping the UI responsive.

---

## Activity Feed

A workspace activity feed tracks key events — document created, document updated, member joined, message sent — displayed as a chronological timeline inside the workspace. New events appear at the top in real time via the `/topic/activity.{workspaceId}` subscription without requiring a page refresh.

**Technical implementation:**
- `ActivityService.recordActivity()` inserts a `WorkspaceActivity` entity with an `eventType` enum, an actor reference, and a human-readable `description` string; the method is called from `DocumentService`, `WorkspaceService`, and `WorkspaceChatService` after successful mutations.
- `ActivityService.updateLastActive()` is annotated `@Async` to offload the `workspace_members.lastActiveAt` timestamp update to a thread pool thread, preventing it from adding latency to the main request thread during high-frequency edits.
- The frontend `useActivity` hook subscribes to `/topic/activity.{workspaceId}` on mount and prepends incoming `ActivityEvent` payloads to a bounded list (last 50 events) to prevent unbounded memory growth in long-lived browser sessions.

---

## Admin Dashboard

An admin-only screen accessible from the user menu (visible only to users with the ADMIN role) shows platform-wide statistics: total users, total workspaces, total documents, and total messages. A paginated user table allows searching by email, toggling admin status, or deleting accounts.

**Technical implementation:**
- `AdminController` is guarded by `@PreAuthorize("hasRole('ADMIN')")` at the class level, and `GlobalExceptionHandler` maps `AccessDeniedException` to HTTP 403 with the standard `ApiErrorResponse` shape so the frontend can redirect non-admin users back to the dashboard.
- `GET /api/admin/stats` aggregates counts via four `@Query`-annotated repository methods using `COUNT(*)` projections rather than loading entities into memory, keeping the stats query lightweight regardless of dataset size.
- `POST /api/admin/users/{id}/toggle-admin` flips the user's `role` field between `USER` and `ADMIN` in a single transactional update, and the response DTO includes the new role so the UI can update the table row optimistically without a full list re-fetch.
