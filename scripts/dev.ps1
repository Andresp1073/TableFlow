#!/usr/bin/env pwsh
# Start development environment

$dockerRunning = docker ps --filter "name=tableflow-mysql" --format "{{.Names}}" 2>$null

if (-not $dockerRunning) {
    Write-Host "Starting MySQL container..." -ForegroundColor Yellow
    docker compose -f docker/docker-compose.yml up -d mysql
    Write-Host "Waiting for MySQL to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}

Write-Host "`nStarting development servers..." -ForegroundColor Cyan
pnpm dev
