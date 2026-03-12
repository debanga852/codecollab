# CodeCollab

> A real-time collaborative code editor — write, run, and share code together in the browser.

Built with React, Spring Boot, Node.js + Socket.io, and Monaco Editor (the same editor that powers VS Code).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Browser Client                         │
│                                                                 │
│   React 19 + TypeScript + Tailwind CSS                          │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│   │  Monaco      │  │  Chat &      │  │  User Presence       │ │
│   │  Editor      │  │  Sidebar     │  │  (cursors, avatars)  │ │
│   └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘ │
│          │ HTTP REST        │ Socket.io            │ Socket.io   │
└──────────┼──────────────────┼─────────────────────┼─────────────┘
           │                  │                      │
           ▼                  └──────────┬───────────┘
┌──────────────────────┐                 │
│  Spring Boot 3.2     │      ┌──────────▼──────────────┐
│  (Java 17 REST API)  │      │  Node.js + Socket.io     │
│                      │      │  (Real-time sync server) │
│  /api/rooms          │      │                          │
│  /api/users          │      │  code-change             │
│  /api/run            │      │  cursor-update           │
│  /health             │      │  chat-message            │
└───────┬──────────────┘      │  language-change         │
        │                     └──────────────────────────┘
   ┌────┴─────┐   ┌──────────┐
   │PostgreSQL│   │  Redis   │
   │(rooms,   │   │ (cache)  │
   │ users)   │   │          │
   └──────────┘   └──────────┘
        │
   ┌────▼─────────────┐
   │  Piston API      │
   │ (code execution) │
   └──────────────────┘
```

All services are orchestrated via Docker Compose.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS |
| **Code Editor** | Monaco Editor (`@monaco-editor/react`) |
| **Real-time** | Socket.io (Node.js server + React client) |
| **REST API** | Spring Boot 3.2, Java 17 |
| **Database** | PostgreSQL 15 (rooms & users) |
| **Cache** | Redis 7 |
| **Code Execution** | Piston API |
| **Containerization** | Docker, Docker Compose, Nginx |

---

## Features

- **Real-time code editing** — changes sync instantly across all connected users
- **Remote cursors** — see where other collaborators are editing, with color-coded labels
- **In-room chat** — sidebar messaging with persistent history (last 50 messages)
- **Code execution** — run code directly in the browser via the Piston API (JavaScript, Python, and more)
- **Multi-language support** — JavaScript, TypeScript, Python, Java, C++, Rust, Go with Monaco syntax highlighting
- **User presence** — live user list with color-coded avatars
- **Room persistence** — rooms and code saved to PostgreSQL; rejoin any room by ID
- **Save manually** — explicit save button syncs editor content to the database
- **Dark theme** — VS Code-inspired dark UI throughout

---

## Running Locally with Docker

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- Git

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/your-username/codecollab.git
cd codecollab

# 2. Start all services
docker compose up --build

# 3. Open the app
# → http://localhost:3000
```

That's it. Docker Compose will start PostgreSQL, Redis, the Spring Boot API, the Node.js Socket.io server, and the React frontend — all wired together.

### Service Ports

| Service | Port | URL |
|---|---|---|
| React frontend | 3000 | http://localhost:3000 |
| Spring Boot API | 8080 | http://localhost:8080 |
| Node.js Socket.io | 3001 | http://localhost:3001 |
| PostgreSQL | 5432 | — |
| Redis | 6379 | — |

### Stopping

```bash
docker compose down          # stop containers
docker compose down -v       # stop and delete volumes (clears DB)
```

### Running for Development (without Docker)

**Prerequisites:** Java 17+, Maven, Node.js 20+, PostgreSQL 15, Redis 7

```bash
# Start PostgreSQL and Redis locally, then:

# Spring Boot API
cd backend/spring-boot
mvn spring-boot:run

# Node.js Socket.io server
cd backend/cursor-websocket
npm install
npm run dev

# React frontend
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## API Endpoints

Base URL: `http://localhost:8080`

### Health

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Service health check |
| `GET` | `/info` | App info and status |

### Rooms

| Method | Path | Body | Description |
|---|---|---|---|
| `POST` | `/api/rooms` | `{ "name": "string", "language": "javascript" }` | Create a new room |
| `GET` | `/api/rooms` | — | List all rooms |
| `GET` | `/api/rooms/{id}` | — | Get room by ID |
| `PUT` | `/api/rooms/{id}/code` | `{ "code": "string", "language": "string" }` | Update room code and language |

### Users

| Method | Path | Body | Description |
|---|---|---|---|
| `POST` | `/api/users` | `{ "username": "string", "color": "#hex" }` | Create or retrieve a user |
| `GET` | `/api/users/{id}` | — | Get user by ID |

### Code Execution

| Method | Path | Body | Description |
|---|---|---|---|
| `POST` | `/api/run` | `{ "language": "javascript", "files": [{ "content": "console.log('hi')" }] }` | Execute code via Piston API |

**Supported languages for `/api/run`:**

| Language | Version |
|---|---|
| JavaScript | 18.15.0 |
| Python | 3.10.0 |

---

## Socket.io Events

Server runs on `http://localhost:3001`.

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `join-room` | `{ roomId, username, color }` | Join a collaboration room |
| `code-change` | `{ roomId, code }` | Broadcast a code update |
| `cursor-update` | `{ roomId, line, column }` | Send cursor position |
| `chat-message` | `{ roomId, message }` | Send a chat message |
| `language-change` | `{ roomId, language }` | Change the active language |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `room-joined` | `{ code, users, messages, language }` | Initial room state on join |
| `room-users` | `User[]` | Updated list of active users |
| `user-joined` | `{ username }` | A new user connected |
| `user-left` | `{ username }` | A user disconnected |
| `code-updated` | `{ code, username }` | Code changed by another user |
| `cursor-updated` | `{ userId, username, color, line, column }` | Remote cursor position |
| `chat-message` | `{ username, color, message, timestamp }` | New chat message |
| `language-changed` | `{ language, username }` | Language changed by another user |

---

## Project Structure

```
codecollab/
├── docker-compose.yml
├── backend/
│   ├── spring-boot/               # Java REST API
│   │   ├── Dockerfile
│   │   ├── pom.xml
│   │   └── src/main/java/com/codecollab/
│   │       ├── controller/        # RoomController, UserController, RunController
│   │       ├── entity/            # Room, User (JPA entities)
│   │       ├── repository/        # Spring Data JPA repositories
│   │       ├── service/           # Business logic
│   │       └── config/            # CORS, Redis, WebSocket config
│   └── cursor-websocket/          # Node.js Socket.io server
│       ├── Dockerfile
│       └── src/
│           ├── index.ts           # Socket.io event handlers, room state
│           └── types.ts           # Shared TypeScript types
└── frontend/                      # React + TypeScript + Vite
    ├── Dockerfile
    ├── nginx.conf
    └── src/
        ├── pages/
        │   ├── LandingPage.tsx    # Create / join room
        │   └── RoomPage.tsx       # Collaborative editor
        ├── components/            # CodeEditor, Toolbar, UserList, Chat, Output
        ├── services/
        │   ├── api.ts             # REST API client
        │   └── socket.ts          # Socket.io client wrapper
        └── config.ts              # API and socket URLs
```

---

## Environment Variables

### Spring Boot (`backend/spring-boot/src/main/resources/application.properties`)

| Variable | Default | Description |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/codecollab` | PostgreSQL connection URL |
| `DB_USER` | `postgres` | Database user |
| `DB_PASS` | `postgres` | Database password |
| `REDIS_HOST` | `localhost` | Redis hostname |
| `REDIS_PORT` | `6379` | Redis port |
| `cors.allowed-origins` | `http://localhost:3000` | Comma-separated CORS origins |

### Frontend (build-time Vite env vars)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080/api` | Spring Boot API base URL |
| `VITE_SOCKET_URL` | `http://localhost:3001` | Socket.io server URL |

---

## License

MIT
