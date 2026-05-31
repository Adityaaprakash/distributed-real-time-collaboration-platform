# Deployment Guide

---

## Section 1 — Local Development

### Prerequisites

| Software | Required Version | Check command |
|---|---|---|
| Java | 21+ | `java -version` |
| Node.js | 20+ | `node --version` |
| Docker | 24+ | `docker --version` |
| Maven | 3.9+ | `mvn --version` |

### Step-by-Step Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/distributed-real-time-collaboration-platform.git
   cd distributed-real-time-collaboration-platform
   ```

2. **Start infrastructure services (PostgreSQL and Redis)**
   ```bash
   docker-compose up -d postgres redis
   ```

3. **Verify services are healthy**
   ```bash
   docker-compose ps
   ```

4. **Start the backend** (Flyway migrations V1–V5 run automatically on startup)
   ```bash
   cd backend
   mvn spring-boot:run
   ```
   The backend will be available at `http://localhost:8080`.

5. **In a new terminal, install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

6. **Start the frontend dev server**
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`.

7. **Open your browser and navigate to**
   ```
   http://localhost:5173
   ```

### Troubleshooting

| Problem | Likely Cause | Fix |
|---|---|---|
| `Port 5432 already in use` | Another PostgreSQL instance is running on the host | Stop the host PostgreSQL service: `sudo systemctl stop postgresql` (Linux) or stop it via Services (Windows), then retry `docker-compose up -d postgres` |
| `Flyway migration fails on dirty database` | A previous failed migration left the schema in a dirty state | Run `mvn flyway:repair` in the `backend/` directory to clear the failed migration checksum, then restart the backend |
| `Redis connection refused` | Redis container not started or not healthy | Check container status with `docker-compose ps` and run `docker-compose up -d redis` if it is not running |
| `Frontend 404 on direct URL access` | Vite dev proxy not routing SPA fallback correctly | Ensure the `vite.config.ts` proxy block targets `http://localhost:8080` and the `historyApiFallback` option is enabled; this is pre-configured in the repo |
| `WebSocket connection rejected (CORS error)` | `allowedOrigins` in `WebSocketConfig` does not include `http://localhost:5173` | Verify `WebSocketConfig.java` includes `setAllowedOrigins("http://localhost:5173")` in the `registerStompEndpoints` block |

---

## Section 2 — Docker Production

### Step-by-Step Deployment

1. **Copy the example environment file**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` and fill in all required values** (see environment variable reference below)
   ```bash
   # Use your preferred editor
   nano .env
   ```

3. **Build and start all services**
   ```bash
   docker-compose -f docker-compose.prod.yml up --build
   ```

4. **Verify all containers are healthy**
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ```

5. **Open the application**
   ```
   http://localhost
   ```
   Nginx serves the React SPA and proxies `/api` and `/ws` to the Spring Boot backend.

> **Note:** The first run applies all Flyway migrations (V1 through V5) automatically before the application starts accepting traffic. This is controlled by `spring.flyway.enabled=true` in the production Spring profile.

### Environment Variables Reference

See `.env.example` in the project root for the full list. Key variables:

| Variable | Description | Example |
|---|---|---|
| `DB_HOST` | PostgreSQL host | `postgres` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `collabdb` |
| `DB_USERNAME` | Database user | `collab` |
| `DB_PASSWORD` | Database password | `changeme` |
| `REDIS_HOST` | Redis host | `redis` |
| `REDIS_PORT` | Redis port | `6379` |
| `JWT_SECRET` | HS256 signing secret (min 32 chars) | `your-very-long-secret-key` |
| `FILE_UPLOAD_DIR` | Absolute path for file uploads | `/app/uploads` |

### Useful Operations

**View live logs from the backend:**
```bash
docker-compose -f docker-compose.prod.yml logs -f backend
```

**Restart only the backend container** (after a config change):
```bash
docker-compose -f docker-compose.prod.yml restart backend
```

**Connect to the PostgreSQL database directly:**
```bash
docker exec -it {postgres-container-name} psql -U collab -d collabdb
```
Replace `{postgres-container-name}` with the actual container name from `docker-compose ps`.

**Stop all services and remove containers:**
```bash
docker-compose -f docker-compose.prod.yml down
```

**Stop all services and remove containers AND volumes** (full reset — destroys all data):
```bash
docker-compose -f docker-compose.prod.yml down -v
```

---

## Section 3 — Production Limitations

This section documents known architectural limitations and their upgrade paths. Understanding these tradeoffs demonstrates engineering maturity — the goal is to ship working software while being transparent about what would need to change for a production scale-out.

### 1. In-Memory STOMP Broker Requires Single-JVM WebSocket Clients

**Current state:** Spring's built-in simple STOMP broker (`enableSimpleBroker`) holds all WebSocket subscriptions in JVM memory. If two backend instances are running, a client connected to Instance A cannot receive a message published from Instance B, because `SimpMessagingTemplate` only broadcasts to local subscribers.

**Upgrade path:** Replace the simple broker with a full-featured STOMP message broker relay (e.g., RabbitMQ with the `rabbitmq_stomp` plugin enabled). Spring provides `configureMessageBroker().enableStompBrokerRelay(...)` for zero-code-change wiring — the broker relay forwards all subscriptions and publishes to RabbitMQ, allowing any backend instance to deliver to any connected client without sticky sessions at the load balancer.

---

### 2. Local Filesystem Storage Not Suitable for Multi-Instance Deployment

**Current state:** Uploaded files (avatars and chat attachments) are written to a local directory on the backend host defined by `FILE_UPLOAD_DIR`. In a multi-instance deployment, each instance has its own disk, so a file uploaded via Instance A is not accessible from Instance B when the download request is routed to a different instance.

**Upgrade path:** Replace the `FileStorageService` local implementation with an S3-compatible storage client (AWS SDK v2 or MinIO Java SDK). Because the upload/download logic is encapsulated behind a service interface, the swap requires only a new implementation class and configuration — no controller changes. MinIO can be self-hosted if cloud vendor lock-in is a concern.

---

### 3. No Token Revocation — JWT Is Stateless With No Blacklist

**Current state:** JWTs are validated purely by signature and expiry. There is no mechanism to revoke a token before it expires — logging out on the client deletes the token from `localStorage`, but a leaked token remains valid until its `exp` claim is reached. The current expiry window is configured in `JwtUtils`.

**Upgrade path:** Implement a Redis-based token blacklist. On logout (or forced revocation), the token's `jti` claim (or full token hash) is written to Redis with a TTL equal to the token's remaining validity. `JwtAuthFilter` checks the blacklist on every request before trusting the token. For session continuity, pair this with refresh token rotation: short-lived access tokens (15 minutes) and longer-lived refresh tokens stored in Redis, with each refresh invalidating the previous refresh token.

---

### 4. In-Memory Pub/Sub Pattern Does Not Survive Instance Restart

**Current state:** Redis Pub/Sub is used for workspace chat broadcast via the `workspace.chat.*` pattern topic, which correctly decouples broadcast from persistence across instances. However, the STOMP broker relay is still in-memory (limitation #1 above), so Pub/Sub alone does not achieve true multi-instance delivery — it only moves the bottleneck from broadcast to subscription routing.

**Upgrade path:** Resolving limitation #1 (RabbitMQ STOMP relay) automatically resolves this limitation as a side effect. Redis Pub/Sub can then be retained for non-STOMP use cases (e.g., cache invalidation signals, admin broadcast) while RabbitMQ handles all WebSocket subscription routing.
