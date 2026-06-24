#!/usr/bin/env bash
# Start the PreLegal stack (backend + frontend) via Docker Compose on Linux.
set -euo pipefail

cd "$(dirname "$0")/.."

docker compose up --build -d

echo "PreLegal is starting:"
echo "  Frontend → http://localhost:3000"
echo "  Backend  → http://localhost:8000 (docs at /docs)"
