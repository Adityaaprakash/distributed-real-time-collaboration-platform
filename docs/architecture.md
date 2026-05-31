# Architecture

This document describes the system architecture of the Distributed Real-Time Collaboration Platform through five Mermaid diagrams covering the overall system, authentication, collaborative editing, Redis-backed chat, and notification delivery.

---

## Diagram 1 — System Architecture

```mermaid
graph TB
    subgraph Frontend
        ReactApp[ReactApp]
        AxiosHTTP[AxiosHTTP]
        StompClient[StompClient]
    end

    subgraph Backend
        SpringControllers[SpringControllers]
        WebSocketConfig[WebSocketConfig]
        CollaborationWebSocketController[CollaborationWebSocketController]
        WorkspaceChatController[WorkspaceChatController]
        ServiceLayer[ServiceLayer]
        WorkspaceChatService[WorkspaceChatService]
        NotificationService[NotificationService]
        RedisMessagePublisher[RedisMessagePublisher]
        RedisMessageSubscriber[RedisMessageSubscriber]
        SimpMessagingTemplate[SimpMessagingTemplate]
    end

    subgraph DataLayer["Data Layer"]
        JpaRepositories[JpaRepositories]
        PostgreSQL[(PostgreSQL)]
        RedisChannel[(RedisChannel)]
    end

    ReactApp --> AxiosHTTP
    ReactApp --> StompClient
    AxiosHTTP --> SpringControllers
    StompClient --> WebSocketConfig
    WebSocketConfig --> CollaborationWebSocketController
    WebSocketConfig --> WorkspaceChatController
    SpringControllers --> ServiceLayer
    ServiceLayer --> JpaRepositories
    JpaRepositories --> PostgreSQL
    WorkspaceChatController --> WorkspaceChatService
    WorkspaceChatService --> RedisMessagePublisher
    RedisMessagePublisher --> RedisChannel
    RedisChannel --> RedisMessageSubscriber
    RedisMessageSubscriber --> SimpMessagingTemplate
    SimpMessagingTemplate --> StompClient
    NotificationService --> SimpMessagingTemplate
```

---

## Diagram 2 — Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant JwtAuthFilter
    participant UserRepository
    participant JwtUtils
    participant SecurityContext

    Note over Client,SecurityContext: Registration Flow
    Client ->> JwtAuthFilter: POST /api/auth/register
    JwtAuthFilter ->> UserRepository: save(user with BCrypt hashed password)
    UserRepository -->> JwtAuthFilter: saved User
    JwtAuthFilter -->> Client: 201 Created

    Note over Client,SecurityContext: Login Flow
    Client ->> JwtAuthFilter: POST /api/auth/login
    JwtAuthFilter ->> UserRepository: findByEmail(email)
    UserRepository -->> JwtAuthFilter: User entity
    JwtAuthFilter ->> JwtUtils: generateToken(email)
    JwtUtils -->> JwtAuthFilter: signed JWT
    JwtAuthFilter -->> Client: 200 OK with token

    Note over Client,SecurityContext: Authenticated REST Request
    Client ->> JwtAuthFilter: GET /api/workspaces (Authorization: Bearer token)
    JwtAuthFilter ->> JwtUtils: extractEmail(token)
    JwtUtils -->> JwtAuthFilter: email
    JwtAuthFilter ->> UserRepository: loadUserByUsername(email)
    UserRepository -->> JwtAuthFilter: UserDetails
    JwtAuthFilter ->> SecurityContext: setAuthentication(UsernamePasswordAuthenticationToken)
    JwtAuthFilter -->> Client: 200 OK with data

    Note over Client,SecurityContext: WebSocket Connect Flow
    Client ->> JwtAuthFilter: STOMP CONNECT (Authorization: Bearer token in headers)
    JwtAuthFilter ->> JwtUtils: validateToken(token)
    JwtUtils -->> JwtAuthFilter: valid
    JwtAuthFilter ->> SecurityContext: setUser on MessageHeaderAccessor
    JwtAuthFilter -->> Client: STOMP CONNECTED
```

---

## Diagram 3 — Collaborative Editing Flow

```mermaid
sequenceDiagram
    participant UserA
    participant UserB
    participant CollaborationWebSocketController
    participant PendingEditBuffer
    participant CollaborationPersistenceScheduler
    participant DocumentPersistenceService
    participant PostgreSQL

    Note over UserA,PostgreSQL: Keystroke and Broadcast
    UserA ->> CollaborationWebSocketController: /app/documents/42/edit (EditMessage)
    CollaborationWebSocketController ->> PendingEditBuffer: put(documentId, latestContent)
    CollaborationWebSocketController -->> UserB: /topic/documents/42 (broadcast content)

    Note over UserA,PostgreSQL: Scheduled Drain (every 5 seconds)
    CollaborationPersistenceScheduler ->> PendingEditBuffer: drainAll()
    PendingEditBuffer -->> CollaborationPersistenceScheduler: Map of pending edits
    CollaborationPersistenceScheduler ->> DocumentPersistenceService: persist(documentId, content)
    DocumentPersistenceService ->> DocumentPersistenceService: check 60s snapshot throttle
    alt 60 seconds elapsed since last snapshot
        DocumentPersistenceService ->> PostgreSQL: INSERT INTO document_versions
    end
    DocumentPersistenceService ->> PostgreSQL: UPDATE documents SET content
    PostgreSQL -->> DocumentPersistenceService: saved
```

---

## Diagram 4 — Redis Chat Flow

```mermaid
sequenceDiagram
    participant Sender
    participant WorkspaceChatController
    participant WorkspaceChatService
    participant PostgreSQL
    participant RedisMessagePublisher
    participant Redis
    participant RedisMessageSubscriber
    participant SimpMessagingTemplate
    participant Receivers

    Sender ->> WorkspaceChatController: /app/workspaces/7/chat (ChatMessage)
    WorkspaceChatController ->> WorkspaceChatService: handleMessage(chatMessage)
    WorkspaceChatService ->> PostgreSQL: save(WorkspaceMessage entity)
    PostgreSQL -->> WorkspaceChatService: persisted message with id
    WorkspaceChatService ->> WorkspaceChatService: detectMentions(content)
    WorkspaceChatService ->> RedisMessagePublisher: publish(workspace.chat.7, messagePayload)
    RedisMessagePublisher ->> Redis: PUBLISH workspace.chat.7 payload
    Redis -->> RedisMessageSubscriber: onMessage(workspace.chat.7, payload)
    RedisMessageSubscriber ->> SimpMessagingTemplate: convertAndSend(/topic/workspaces/7/chat, payload)
    SimpMessagingTemplate -->> Receivers: broadcast to all subscribers
```

---

## Diagram 5 — Notification Delivery Flow

```mermaid
sequenceDiagram
    participant DocumentService
    participant NotificationService
    participant NotificationRepository
    participant SimpMessagingTemplate
    participant RecipientBrowser

    DocumentService ->> NotificationService: createAndDeliver(recipientEmail, type, payload)
    NotificationService ->> NotificationRepository: save(Notification entity)
    NotificationRepository -->> NotificationService: persisted Notification with id
    NotificationService ->> SimpMessagingTemplate: convertAndSendToUser(email, /queue/notifications, payload)
    SimpMessagingTemplate -->> RecipientBrowser: routed to /user/queue/notifications
    RecipientBrowser -->> RecipientBrowser: unreadCount increments in UI state
```
