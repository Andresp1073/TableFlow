#!/usr/bin/env pwsh
# TableFlow Project Setup Script

Write-Host "=== TableFlow Project Setup ===" -ForegroundColor Cyan

# Check Node.js
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "ERROR: Node.js is required. Install Node.js >= 20." -ForegroundColor Red
    exit 1
}
Write-Host "Node.js: $nodeVersion" -ForegroundColor Green

# Check pnpm
$pnpmVersion = pnpm --version 2>$null
if (-not $pnpmVersion) {
    Write-Host "Installing pnpm..."
    npm install -g pnpm
}
Write-Host "pnpm: $(pnpm --version)" -ForegroundColor Green

# Install dependencies
Write-Host "`nInstalling dependencies..." -ForegroundColor Yellow
pnpm install

# Setup environment files
if (-not (Test-Path "apps/backend/.env")) {
    Copy-Item "apps/backend/.env.example" "apps/backend/.env"
    Write-Host "Created apps/backend/.env from .env.example" -ForegroundColor Green
}

# Generate Prisma client
Write-Host "`nGenerating Prisma client..." -ForegroundColor Yellow
pnpm --filter @tableflow/backend db:generate

Write-Host "`n=== Setup Complete ===" -ForegroundColor Cyan
Write-Host "Run 'docker compose -f docker/docker-compose.yml up -d mysql' to start the database"
Write-Host "Then run 'pnpm dev' to start the development servers"
