# PreLegal Backend

FastAPI service for the PreLegal V1 foundation. It owns the **temporary SQLite
database** (recreated from scratch on every startup) and the **users table** with
sign up / sign in endpoints.

> This milestone (PL-4) is the technical foundation only — it deliberately does
> not add product features (AI chat, document generation, etc.).

## Requirements

- Python 3.12+
- [uv](https://docs.astral.sh/uv/)

## Develop

```bash
uv sync                                      # install dependencies
uv run uvicorn app.main:app --reload --port 8000
```

The API is then available at <http://localhost:8000> (interactive docs at
`/docs`).

## Test

```bash
uv run pytest
```

## Endpoints

| Method | Path               | Description                              |
| ------ | ------------------ | ---------------------------------------- |
| GET    | `/api/health`      | Liveness check.                          |
| POST   | `/api/auth/signup` | Create an account; sets a session cookie.|
| POST   | `/api/auth/signin` | Sign in; sets a session cookie.          |
| POST   | `/api/auth/logout` | Clear the session cookie.                |
| GET    | `/api/auth/me`     | Return the current authenticated user.   |

## Configuration

Settings are read from the environment (see the project-root `.env.example`):

| Variable        | Default                        | Purpose                              |
| --------------- | ------------------------------ | ------------------------------------ |
| `SESSION_SECRET`| dev placeholder                | Signs the session cookie.            |
| `DATABASE_PATH` | `/tmp/prelegal.db`             | Temporary SQLite file location.      |
| `CORS_ORIGINS`  | `["http://localhost:3000"]`    | Browser origins allowed to call API. |

## Layout

```
app/
  main.py        FastAPI app, CORS, lifespan (recreates the DB on startup)
  config.py      Environment-driven settings
  database.py    SQLAlchemy engine/session; init_db() drops + recreates tables
  models.py      User ORM model
  schemas.py     Pydantic request/response models
  security.py    PBKDF2 password hashing + signed session cookies
  routers/       health.py, auth.py
tests/           pytest suite (health + auth)
```
