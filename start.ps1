# Start OneBox Email Aggregator
# This script starts all required services

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting OneBox Email Aggregator" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start Docker services
Write-Host "Starting Docker services..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Docker services started" -ForegroundColor Green
    Write-Host ""
    Write-Host "Waiting 30 seconds for Elasticsearch to initialize..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Docker Services Status:" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    docker-compose ps
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Starting Application..." -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "The application will start on http://localhost:3000" -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop the application" -ForegroundColor Yellow
    Write-Host ""
    
    npm run dev
} else {
    Write-Host "✗ Failed to start Docker services" -ForegroundColor Red
    Write-Host "Make sure Docker Desktop is running" -ForegroundColor Yellow
    exit 1
}
