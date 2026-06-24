"""Application configuration loaded from the environment.

Values come from environment variables (and the project-root ``.env`` when the
process is started with it loaded — e.g. via Docker Compose ``env_file``).
"""

from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Signs the session cookie. A development default is provided so the app
    # runs out of the box; production deployments must set SESSION_SECRET.
    session_secret: str = "dev-insecure-session-secret-change-me"

    # Path to the temporary SQLite database file. It is recreated from scratch
    # on every startup, so it intentionally lives outside the app package.
    database_path: str = "/tmp/prelegal.db"

    # Origins allowed to call the API from a browser (the frontend service).
    cors_origins: list[str] = ["http://localhost:3000"]

    # Name of the session cookie set on sign in.
    session_cookie_name: str = "prelegal_session"

    # Session lifetime in seconds (used to expire the signed cookie).
    session_max_age: int = 60 * 60 * 24 * 7  # 7 days


settings = Settings()
