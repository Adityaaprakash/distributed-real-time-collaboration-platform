# Resume Description

## Two-Line Entry

```
Distributed Real-Time Collaboration Platform  |  Java 21 · Spring Boot 3.2 · React 18 · TypeScript · PostgreSQL · Redis · WebSocket · Docker
Full-stack collaborative workspace with real-time document editing, team chat, and live notifications supporting concurrent multi-user sessions.
```

---

## Resume Bullet Points

- **Engineered real-time collaborative document editing** using STOMP over SockJS with a server-authoritative last-write-wins model; throttled PostgreSQL writes via `PendingEditBuffer` (`ConcurrentHashMap`) flushed every 5 seconds by a `@Scheduled` task, reducing database load by eliminating per-keystroke persistence.

- **Implemented scalable workspace chat** using Redis Pub/Sub on a `workspace.chat.*` pattern topic, decoupling WebSocket broadcast from message persistence via `RedisMessagePublisher` and `RedisMessageSubscriber`, enabling horizontal backend scaling without application code changes.

- **Secured WebSocket connections** by validating JWT tokens in the STOMP CONNECT frame via `WebSocketAuthChannelInterceptor` implementing Spring's `ChannelInterceptor`, since standard HTTP security filters do not intercept WebSocket upgrade requests.

- **Built full-text search** across documents and chat messages using PostgreSQL `tsvector` generated columns and GIN indexes with `ts_headline()` for match snippets, avoiding the operational overhead of running a dedicated Elasticsearch cluster.

- **Designed per-user real-time notification delivery** using Spring's `convertAndSendToUser()` with email as principal, routing to `/user/queue/notifications` without broadcasting to all connected clients; notifications persist to PostgreSQL and survive page refresh.

---

## Interview Q&A Pairs

---

**Q: How does your collaborative editing handle two users typing at the same time?**

**A:** The server uses a last-write-wins model — when two edits arrive near-simultaneously, the `CollaborationWebSocketController` places each into the `PendingEditBuffer` keyed by document ID, so the second write overwrites the first in memory, and the broadcast to all subscribers reflects the latest state. This means a true simultaneous character-level conflict will silently discard one user's keystroke, which is an accepted tradeoff given the implementation's zero-dependency simplicity and the rarity of exact-position simultaneous edits in practice.

**Follow-up talking point:** The upgrade path is Yjs CRDT integration — Yjs uses a hybrid logical clock to merge concurrent operations without a server authority, requiring only that the `useCollaboration` hook swap from raw text payloads to Yjs `Y.Text` update patches.

---

**Q: Why did you use Redis Pub/Sub for chat instead of just broadcasting directly through the WebSocket broker?**

**A:** Spring's `SimpMessagingTemplate` uses an in-memory STOMP broker, which can only deliver messages to WebSocket clients connected to the same JVM — a second backend instance has no knowledge of subscriptions on the first. Publishing chat messages to a Redis `workspace.chat.*` pattern topic via `RedisMessagePublisher` means any backend instance can receive the message through `RedisMessageSubscriber` and relay it locally, so horizontal scaling does not break chat delivery as long as load balancer sticky sessions haven't been configured yet.

**Follow-up talking point:** This is a partial solution — the in-memory broker still limits true multi-instance WebSocket routing. The full fix is replacing the in-memory broker with a RabbitMQ STOMP relay, which Spring wires via `enableStompBrokerRelay()` with no controller changes.

---

**Q: How does JWT authentication work with WebSocket connections?**

**A:** When a browser establishes a WebSocket connection, the HTTP upgrade handshake bypasses the standard Servlet filter chain, which means `JwtAuthFilter` does not execute on subsequent STOMP frames. Instead, `WebSocketAuthChannelInterceptor` implements Spring's `ChannelInterceptor` and intercepts the STOMP CONNECT command, extracting the `Authorization` header, calling `JwtUtils.validateToken()`, and setting the authenticated principal on the `MessageHeaderAccessor` — making the user identity available to all subsequent `@MessageMapping` methods via `Principal` injection.

**Follow-up talking point:** This per-connection validation means a compromised token cannot be revoked mid-session without closing the WebSocket connection. Adding token expiry checks on a heartbeat interval would partially mitigate this until a Redis blacklist is implemented.

---

**Q: Walk me through what happens when a document is updated — from keystroke to database.**

**A:** The user's keystroke triggers the `useCollaboration` React hook's debounced publish to `/app/documents/{id}/edit`; `CollaborationWebSocketController` receives the STOMP frame, places the content into `PendingEditBuffer` (a `ConcurrentHashMap<Long, String>`), and immediately broadcasts the change to all `/topic/documents/{id}` subscribers so other users see the update in real time. Every 5 seconds, `CollaborationPersistenceScheduler`'s `@Scheduled` method drains the buffer, calls `DocumentPersistenceService.persist()`, which checks whether 60 seconds have elapsed since the last snapshot — if so, it inserts a row into `document_versions` before updating the `documents` table with the latest content.

**Follow-up talking point:** The 60-second snapshot throttle means version history granularity is bounded — you won't get a version entry per keystroke, but you also won't miss recoverable states since the most recent content is always persisted to the documents table every 5 seconds.

---

**Q: What would need to change to scale this to support 10,000 concurrent users?**

**A:** The two highest-impact changes are replacing the in-memory STOMP broker with a RabbitMQ STOMP relay (to allow multiple backend instances to each handle a shard of WebSocket connections without losing inter-instance message routing) and migrating file storage from the local filesystem to an S3-compatible object store like MinIO so that any instance can serve any file. At the database layer, PostgreSQL connection pooling via PgBouncer would reduce contention under high concurrent load, and the `@Async` annotation on `updateLastActive()` in `ActivityService` already prevents presence updates from blocking request threads.

**Follow-up talking point:** The `tsvector` full-text search performs well at tens of thousands of documents with a GIN index, but at millions of documents with high query concurrency, offloading search to Elasticsearch or OpenSearch and keeping PostgreSQL for transactional writes would be the next optimization.
