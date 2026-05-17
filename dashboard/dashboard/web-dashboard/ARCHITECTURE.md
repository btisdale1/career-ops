# Career-Ops Modern Rebuild - Architecture & Design

## 1. Recommended Stack
- **Frontend:** React + Vite (faster than CRA), TypeScript (strict typing), TanStack Query (server state), Framer Motion (animations), Lucide React (icons).
- **Styling:** Tailwind CSS (utility-first).
- **Backend:** Express.js (or Hono for modern simplicity) with full async/await support and error middleware.

## 2. Scalable Project Structure
```text
client/
  src/
    components/      # UI primitives (Card, Button, Modal, Badge)
    features/        # Domain-specific modules (Pipeline, Commands, Settings)
    hooks/           # Custom React hooks (usePipeline, useScan)
    services/        # API integration (TanStack queries)
    types/           # Shared interface definitions
server/
  src/
    controllers/     # Request handlers
    services/        # Business logic & CLI wrapping (streaming output)
    routes/          # API route definitions
```

## 3. Best Practices for CLI-to-Web Integration
- **Socket.io/SSE:** Use Server-Sent Events (SSE) for streaming CLI scan logs back to the dashboard.
- **Polling vs Push:** Use TanStack Query for polling state (like application counts) and SSE for real-time console/command execution logs.
- **Typed APIs:** Shared TypeScript types between frontend and backend.

## 4. Phased Roadmap
1. **Infrastructure:** Setup Vite and Hono/Express skeleton.
2. **Core Components:** Build reusable UI components (Card, Modal, Status Badge).
3. **API Layer:** Implement TanStack queries for all data sources.
4. **Dashboard Features:** Rebuild existing features (Pipeline Table, Command Center) using modular components.
5. **Polishing:** Add Framer Motion transitions and light/dark mode.
