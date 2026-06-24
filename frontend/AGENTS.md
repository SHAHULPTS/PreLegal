<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know
# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

This describes the target product. For what is actually built today, see
**Implementation status** at the end of this file.

## Development process

When instructed to build a feature:
1. Use your Atlassian tools to read the feature instructions from Jira
2. Develop the feature - do not skip any step from the feature-dev 7 step process
3. Thoroughly test the feature with unit tests and integration tests and fix any issues
4. Submit a PR using your github tools

## AI design

When writing code to make calls to LLMs, use your Cerebras skill to use LiteLLM via OpenRouter to the `openrouter/openai/gpt-oss-120b free` model with Cerebras as the inference provider. You should use Structured Outputs so that you can interpret the results and populate fields in the legal document.

There is an OPENROUTER_API_KEY in the .env file in the project root.

## Technical design

The project is orchestrated with Docker Compose. The backend is in backend/ and
is a uv project using FastAPI. The frontend is in frontend/.  
The database uses SQLite and is created from scratch each time the stack is
brought up, allowing for a users table with sign up and sign in.  
Decision (PL-4): the frontend and backend run as **two separate services** — the
frontend is its own container (Next.js `output: "standalone"` build) rather than
being served statically by FastAPI.  
There should be scripts in scripts/ for:  
```bash
# Mac
scripts/start-mac.sh    # Start
scripts/stop-mac.sh     # Stop

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```
Backend available at http://localhost:8000

## Color Scheme
- Accent Yellow: `#ecad0a`
- Blue Primary: `#209dd7`
- Purple Secondary: `#753991` (submit buttons)
- Dark Navy: `#032147` (headings)
- Gray Text: `#888888`


This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Implementation status

_Last updated: 2026-06-24 (PL-4)._

**Built so far:**
- **Frontend (`frontend/`)** — Next.js 16 Mutual NDA generator (PL-3): form →
  live preview → client-side PDF via `@react-pdf/renderer`. Containerized with a
  multi-stage `output: "standalone"` build; runs on `:3000`.
- **Backend (`backend/`)** — uv + FastAPI on `:8000` (PL-4 foundation). Temporary
  SQLite recreated from scratch on every startup. `users` table with
  `POST /api/auth/signup`, `/signin`, `/logout` and `GET /api/auth/me`
  (PBKDF2-hashed passwords, `itsdangerous`-signed session cookie), plus
  `GET /api/health`. pytest suite covers health + auth.
- **Orchestration** — `docker-compose.yml` runs backend + frontend as two
  services; `scripts/start-*` / `stop-*` wrap `docker compose up --build` / `down`.
- **Data** — `catalog.json` and `templates/` exist (PL-2) but are not yet wired
  into the app.

**Not built yet (future tickets):** AI chat, document generation for the full
catalog, persistence of generated documents, and any frontend auth UI (the auth
endpoints exist but no UI consumes them yet).
<!-- END:nextjs-agent-rules -->
