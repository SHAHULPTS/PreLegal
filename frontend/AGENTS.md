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

_Last updated: 2026-06-28 (PL-7)._

**Built so far:**
- **Multi-user accounts + saved documents (PL-7)** — signed-in users can **Save**
  the document they're working on (type + captured field values) and re-open or
  delete past work from a "Your documents" history list; re-saving updates the
  same record. Backend: `saved_documents` table + `GET/POST/PUT/DELETE
  /api/saved-documents` scoped to the current user (temporary DB, wiped on
  restart). The UI is restyled with the PreLegal brand palette (navy/purple/
  yellow/blue), and a legal-evaluation **disclaimer** appears both in the app and
  embedded in every generated PDF.
- **Multi-document AI generator (PL-5, PL-6)** — a generic, template-driven
  generator. The user chats with an AI that first works out which document they
  need (and, for an unsupported request, declines and suggests the closest
  supported one), then collects that document's key terms. A live preview + a
  client-side PDF (`@react-pdf/renderer`) are rendered from the markdown template
  (cover page of key terms + standard terms); any field can be fine-tuned by hand.
  - Backend document registry (`backend/app/documents.py`): hand-authored field
    specs + markdown templates, with per-document Structured-Outputs schemas built
    dynamically. Supported today: **Mutual NDA, Data Processing Agreement, Pilot
    Agreement, Cloud Service Agreement** (adding more = one `DocumentSpec`).
  - API: `GET /api/documents`, `GET /api/documents/{id}` (spec + template), and
    the two-phase `POST /api/chat` (LiteLLM → OpenRouter `gpt-oss-120b` via
    Cerebras, Structured Outputs). Chat is auth-gated.
  - Frontend (`frontend/`): generic `Document*` components + `lib/documents.ts`
    (cover-page/signature rendering) and `lib/template.ts` (Common Paper markdown
    parser). Replaces the bespoke NDA-only path.
  - **Auth UI (PL-5)** — `AuthForm` / `AuthGate` consume the auth endpoints and
    gate the generator.
- **Backend foundation (`backend/`)** — uv + FastAPI on `:8000`. Temporary SQLite
  recreated from scratch on every startup. `users` table with
  `POST /api/auth/signup`, `/signin`, `/logout`, `GET /api/auth/me`
  (PBKDF2-hashed passwords, `itsdangerous`-signed session cookie), plus
  `GET /api/health`. pytest suite covers health, auth, documents + chat.
- **Orchestration** — `docker-compose.yml` runs backend + frontend as two
  services; the backend image is built from the repo root so it includes
  `catalog.json` + `templates/` (read by the document registry at runtime).
  `scripts/start-*` / `stop-*` wrap `docker compose up --build` / `down`.

**Not built yet (future tickets):** field specs for the remaining ~8 templates,
persistence of generated documents (PL-7).
<!-- END:nextjs-agent-rules -->
