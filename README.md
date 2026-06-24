# PreLegal

A platform to draft legal agreements.

This repository hosts the V1 technical foundation: a **FastAPI** backend with a
**temporary SQLite** database (users + auth), the **Next.js** frontend, and
**Docker Compose** orchestration with cross-platform start/stop scripts.

> Product features (AI chat, the full catalog of document types, persistence)
> are added in later tickets. This foundation ships only the existing Mutual NDA
> generator frontend plus the backend/database plumbing.

## Quick start (Docker)

```bash
cp .env.example .env        # then set SESSION_SECRET

# macOS
scripts/start-mac.sh        # build + start
scripts/stop-mac.sh         # stop

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows (PowerShell)
scripts/start-windows.ps1
scripts/stop-windows.ps1
```

Once running:

- Frontend → <http://localhost:3000>
- Backend → <http://localhost:8000> (interactive API docs at `/docs`)

The scripts wrap `docker compose up --build -d` / `docker compose down`. The
SQLite database is **recreated from scratch on every start** — it is temporary
by design.

## Layout

```
backend/    FastAPI service, SQLite, auth endpoints  (uv project)  — see backend/README.md
frontend/   Next.js Mutual NDA generator             — see frontend/README.md
scripts/    start/stop scripts for macOS, Linux, Windows
docker-compose.yml   two-service orchestration (backend + frontend)
```

## Local development without Docker

```bash
# Backend (http://localhost:8000)
cd backend && uv sync && uv run uvicorn app.main:app --reload --port 8000

# Frontend (http://localhost:3000)
cd frontend && npm install && npm run dev
```

## Tests

```bash
cd backend && uv run pytest     # backend
cd frontend && npm test         # frontend
```
