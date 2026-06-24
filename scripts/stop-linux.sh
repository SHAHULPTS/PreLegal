#!/usr/bin/env bash
# Stop the PreLegal stack on Linux. The temporary database is discarded.
set -euo pipefail

cd "$(dirname "$0")/.."

docker compose down

echo "PreLegal stopped."
