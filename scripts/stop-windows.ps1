# Stop the PreLegal stack on Windows. The temporary database is discarded.
$ErrorActionPreference = "Stop"

Set-Location (Join-Path $PSScriptRoot "..")

docker compose down

Write-Host "PreLegal stopped."
