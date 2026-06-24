"""SQLite database setup.

The database is *temporary*: ``init_db`` drops and recreates every table on
startup, so each time the container is brought up the schema starts from
scratch (per the V1 foundation requirements).
"""

from __future__ import annotations

from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import settings


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""


engine = create_engine(
    f"sqlite:///{settings.database_path}",
    # SQLite + a threaded ASGI server need this flag.
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def init_db() -> None:
    """Recreate the schema from scratch.

    Importing models here ensures they are registered on ``Base.metadata``
    before the tables are created.
    """
    from . import models  # noqa: F401  (registers tables on Base.metadata)

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def get_db() -> Iterator[Session]:
    """FastAPI dependency yielding a request-scoped database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
