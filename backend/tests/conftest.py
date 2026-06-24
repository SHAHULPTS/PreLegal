"""Shared pytest fixtures.

The app recreates its schema from scratch on every startup (``init_db`` runs in
the lifespan handler), so wrapping each test in ``with TestClient(app)`` yields a
fresh, isolated database without any cross-test leakage.
"""

from __future__ import annotations

import os
import tempfile
from collections.abc import Iterator

import pytest

# Point the app at a throwaway database file before it is imported, so the
# module-level engine binds to it.
_DB_FD, _DB_PATH = tempfile.mkstemp(suffix=".db")
os.close(_DB_FD)
os.environ["DATABASE_PATH"] = _DB_PATH

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


@pytest.fixture()
def client() -> Iterator[TestClient]:
    # Entering the context runs the lifespan handler, which recreates the
    # schema, giving each test a clean database.
    with TestClient(app) as test_client:
        yield test_client


def pytest_unconfigure(config: pytest.Config) -> None:  # noqa: ARG001
    if os.path.exists(_DB_PATH):
        os.remove(_DB_PATH)
