# Zoe — AI Help Desk Assistant

Zoe is a polite, professional **AI Help Desk** that helps users **report**, **track**, and **resolve** issues without creating duplicate tickets. It collects the right details, checks for existing tickets, and guides users to resolution.

- **Frontend:** React + Vite + Tailwind + shadcn/ui  
- **Backend:** Spring Boot (Java) — `POST /api/v1/helpdesk` using a `ConversationId` header  
- **Knowledge:** RAG-ready (seed with fake internal policies/FAQs for demos)  
- **Demo Persistence:** Browser `localStorage` (swap to DB when ready)

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
  - [Frontend (Vite)](#frontend-vite)
  - [Backend (Spring Boot)](#backend-spring-boot)
- [API Contract](#api-contract)
- [Frontend → Backend (Axios)](#frontend--backend-axios)
- [How the UX Works](#how-the-ux-works)
- [Seeding Fake RAG Knowledge (Optional)](#seeding-fake-rag-knowledge-optional)
- [Optional: Persist Conversations in DB](#optional-persist-conversations-in-db)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [License](#license)

---

## Features

- **Conversation-first UX** — sidebar with avatars, last message preview, and short IDs.
- **Auto thread per email** — from Home → `/chat?email=...`.
- **Ticket etiquette baked-in** — avoid duplicates, polite & empathetic flows.
- **Simple backend contract** — one `POST` endpoint; add history/SSE later.
- **RAG-friendly** — point to seeded internal docs (fake or real).

---

## Architecture

```
[ React (Vite) ] -- Axios --> [ Spring Boot REST ] --(optional)--> [ Vector DB / RDBMS ]
     UI/UX                      /api/v1/helpdesk                   grounding + persistence
```

- **Frontend** stores demo conversations in `localStorage` for instant UX.
- **Backend** replies to messages; can ground answers via RAG and later persist to DB.

---

## Project Structure

```text
repo-root/
├─ helpdesk-frontend/
│  ├─ src/
│  │  ├─ components/
│  │  │  └─ ui/                  # shadcn/ui components
│  │  ├─ lib/
│  │  │  └─ brand.js             # "Zoe — AI Help Desk Assistant"
│  │  ├─ pages/
│  │  │  ├─ ChatHome.jsx         # collects email and starts chat
│  │  │  └─ Chat.jsx             # conversation UI (sidebar + messages)
│  │  ├─ service/
│  │  │  └─ chat.service.js      # axios wrapper (POST /api/v1/helpdesk)
│  │  ├─ main.jsx
│  │  └─ index.css               # tailwind entry
│  ├─ vite.config.js             # alias @ -> ./src + tailwind plugin
│  ├─ jsconfig.json              # editor path hints for @/*
│  └─ index.html
│
├─ helpdesk-backend/
│  ├─ src/main/java/com/example/helpdesk/
│  │  ├─ HelpdeskApplication.java
│  │  ├─ api/HelpdeskController.java
│  │  ├─ service/HelpdeskService.java
│  │  └─ rag/RagClient.java      # (optional) your RAG adapter
│  └─ src/main/resources/application.yml
│
└─ seed/                         # (optional) fake policies/FAQs for RAG
   ├─ it-policy.md
   ├─ wifi-troubleshooting.md
   ├─ vpn-faq.md
   └─ ticket-workflow.md
```

---

## Quick Start

### Frontend (Vite)

```bash
cd helpdesk-frontend
npm i
npm i -D tailwindcss @tailwindcss/vite
```

**vite.config.js**

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwind()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  server: { port: 5173 },
});
```

**jsconfig.json**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

**src/index.css**

```css
@import "tailwindcss";

@layer base {
  body { @apply bg-background text-foreground; }
}
```

**Environment**

```bash
# helpdesk-frontend/.env.local
VITE_API_URL=http://localhost:8081
```

**Run**

```bash
npm run dev   # http://localhost:5173
```

---

### Backend (Spring Boot)

Create a minimal Spring Boot app that exposes a single endpoint.

**HelpdeskController.java**

```java
package com.example.helpdesk.api;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.helpdesk.service.HelpdeskService;

@RestController
@RequestMapping("/api/v1")
public class HelpdeskController {

  private final HelpdeskService service;

  public HelpdeskController(HelpdeskService service) {
    this.service = service;
  }

  @PostMapping(value = "/helpdesk", consumes = MediaType.TEXT_PLAIN_VALUE)
  public ResponseEntity<String> handle(
      @RequestHeader("ConversationId") String conversationId,
      @RequestHeader(value = "X-User-Email", required = false) String email,
      @RequestBody String userMessage
  ) {
    String reply = service.reply(conversationId, email, userMessage);
    return ResponseEntity.ok(reply);
  }
}
```

**HelpdeskService.java**

```java
package com.example.helpdesk.service;

import org.springframework.stereotype.Service;

@Service
public class HelpdeskService {

  public String reply(String conversationId, String email, String userMessage) {
    // TODO: Plug in LLM/RAG. For demo, return a polite canned response.
    return """
      Thanks for the details! I've logged your request.
      • Conversation: %s
      • Email: %s
      Next, tell me a bit more: category (software/hardware/account), urgency, and any error messages.
      """.formatted(conversationId, email != null ? email : "not provided");
  }
}
```

**Dev CORS (allow Vite origin) — application.yml**

```yaml
server:
  port: 8081

spring:
  web:
    cors:
      allowed-origins: "http://localhost:5173"
      allowed-methods: "GET,POST,PUT,DELETE,OPTIONS"
      allowed-headers: "*"
```

Run backend on `:8081`.

---

## API Contract

**Endpoint**

```bash
POST /api/v1/helpdesk
```

**Headers**

- `ConversationId: <uuid>` (required)
- `X-User-Email: <email>` (optional but useful)

**Body**

`text/plain` → the user's message

**Response**

`200 OK` with either:
- a simple string reply, or
- JSON `{ id, author, text, at }` (if you choose to return structured messages)

**Example cURL**

```bash
curl -X POST http://localhost:8081/api/v1/helpdesk \
  -H "Content-Type: text/plain" \
  -H "ConversationId: 1d6c1d66-1f58-4e20-8a58-9a6c1bdfe111" \
  -H "X-User-Email: user@company.com" \
  --data "My email isn't syncing on my phone again."
```

---

## Frontend → Backend (Axios)

**helpdesk-frontend/src/service/chat.service.js**

```js
import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : "http://localhost:8081/api/v1";

const http = axios.create({ baseURL, timeout: 15000 });

export async function sendMessagesToServer(message, conversationId, email) {
  const res = await http.post(
    "/helpdesk",
    message, // text/plain; switch to JSON if backend expects it
    {
      headers: {
        "Content-Type": "text/plain",
        ConversationId: conversationId,
        ...(email ? { "X-User-Email": email } : {}),
      },
    }
  );
  return res.data;
}
```

---

## How the UX Works

1. **ChatHome** collects the user's email and navigates to:
   ```bash
   /chat?email=<email>
   ```

2. **Chat** auto-creates (or reuses) a conversation for that email and persists to `localStorage`:
   - `conversations` (list)
   - `messagesById` (map of arrays)
   - `conversationId` (active)
   - `userEmail`, `userName`

3. **Sending a message:**
   - Adds an optimistic user bubble
   - Calls `POST /api/v1/helpdesk` with `ConversationId`
   - Appends the bot reply to the same thread

Demo data is client-only (`localStorage`). Use DevTools → Application → Local Storage to inspect.

---

## Seeding Fake RAG Knowledge (Optional)

Add Markdown/JSON files under `seed/` to simulate internal knowledge:

- `it-policy.md` — device policy, MFA, SSO
- `wifi-troubleshooting.md` — steps, known issues
- `vpn-faq.md` — login, certs, split-tunnel
- `ticket-workflow.md` — Open → In Progress → Resolved → Closed

**Backend idea (pseudo):**

```java
// RagClient.load(seedPath) -> embed -> upsert to vector store
// service.reply() -> retrieve top-k -> build prompt -> call LLM -> return grounded answer
```

You can start with an in-memory or lightweight store (e.g., SQLite + embeddings table) for demo purposes.

---

## Optional: Persist Conversations in DB

When you're ready to move off `localStorage`, add simple JPA entities.

**Entities**

```java
@Entity
public class Conversation {
  @Id @GeneratedValue(strategy = GenerationType.UUID)
  private String id;
  private String email;
  private String title;
  private Instant createdAt = Instant.now();
}

@Entity
public class Message {
  @Id @GeneratedValue(strategy = GenerationType.UUID)
  private String id;
  private String conversationId;
  private String author;     // "user" | "bot" | "system"
  @Column(columnDefinition = "TEXT")
  private String text;
  private Instant at = Instant.now();
}
```

**Repositories**

```java
public interface ConversationRepo extends JpaRepository<Conversation, String> {
  Optional<Conversation> findFirstByEmail(String email);
}
public interface MessageRepo extends JpaRepository<Message, String> {
  List<Message> findByConversationIdOrderByAtAsc(String conversationId);
}
```

**Add REST (examples)**

```bash
GET  /api/v1/conversations?email=...
GET  /api/v1/conversations/{id}/messages
POST /api/v1/conversations/{id}/messages   # { text, author }
```

Then have the frontend hydrate from the API instead of `localStorage`.

---

## Troubleshooting

- **Alias `@/...` fails:** verify `vite.config.js` alias + `jsconfig.json` paths; restart Vite.
- **Tailwind warnings:** prefer `@tailwindcss/vite` (no PostCSS needed).
- **CORS 4xx:** allow `http://localhost:5173` in Spring CORS (see `application.yml`).
- **Duplicate conversations in dev:** React StrictMode mounts twice. Guard your chat bootstrap with a one-time `didInit` ref.
- **Ports:** FE 5173, BE 8081.

---

## Roadmap

- ✅ Local demo persistence (`localStorage`)
- ⏭️ RESTful conversations/messages (JPA + DB)
- ⏭️ Streaming replies (SSE/WebSocket)
- ⏭️ Auth (JWT) + roles (Agent/Admin)
- ⏭️ File uploads (screenshots/logs)
- ⏭️ Full ticket CRUD + email notifications

---

## License

MIT — free to use for learning, demos, and portfolios.
