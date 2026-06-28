# syntax=docker/dockerfile:1
FROM python:3.12-slim

# uv provides fast, reproducible dependency installs.
COPY --from=ghcr.io/astral-sh/uv:0.11 /uv /bin/uv

ENV PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

WORKDIR /app

# NOTE: the build context is the repo root (see docker-compose.yml) so the image
# can include the document templates the backend reads at runtime.

# Install dependencies first (cached unless the lockfile changes).
COPY backend/pyproject.toml backend/uv.lock backend/README.md ./
RUN uv sync --frozen --no-dev --no-install-project

# Then add the application source and install the project itself.
COPY backend/app ./app
RUN uv sync --frozen --no-dev

# Document catalog + templates, read by app.documents at runtime.
COPY catalog.json ./catalog.json
COPY templates ./templates

EXPOSE 8000
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
