# Start the PreLegal stack (backend + frontend) via Docker Compose on Windows.
$ErrorActionPreference = "Stop"

Set-Location (Join-Path $PSScriptRoot "..")

docker compose up --build -d

Write-Host "PreLegal is starting:"
Write-Host "  Frontend -> http://localhost:3000"
Write-Host "  Backend  -> http://localhost:8000 (docs at /docs)"
