# Quick Start Script for OneBox Email Aggregator
# Run this script to check if everything is configured correctly

Write-Host "========================================"
Write-Host "OneBox Email Aggregator - System Check"
Write-Host "========================================"
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Node.js installed: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js not found! Please install Node.js v18+" -ForegroundColor Red
    exit 1
}

# Check npm
Write-Host "Checking npm..." -ForegroundColor Yellow
$npmVersion = npm --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ npm installed: $npmVersion" -ForegroundColor Green
} else {
    Write-Host "✗ npm not found!" -ForegroundColor Red
    exit 1
}

# Check Docker
Write-Host "Checking Docker..." -ForegroundColor Yellow
$dockerVersion = docker --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Docker installed: $dockerVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Docker not found! Please install Docker Desktop" -ForegroundColor Red
    exit 1
}

# Check if .env exists
Write-Host "Checking .env file..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✓ .env file exists" -ForegroundColor Green
    
    # Check if OpenAI key is configured
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "OPENAI_API_KEY=sk-") {
        Write-Host "✓ OpenAI API key configured" -ForegroundColor Green
    } else {
        Write-Host "⚠ OpenAI API key not configured in .env" -ForegroundColor Yellow
    }
    
    # Check if email accounts are configured
    if ($envContent -match "IMAP_USER_1=.+@.+") {
        Write-Host "✓ Email Account 1 configured" -ForegroundColor Green
    } else {
        Write-Host "⚠ Email Account 1 not configured in .env" -ForegroundColor Yellow
    }
    
    if ($envContent -match "IMAP_USER_2=.+@.+") {
        Write-Host "✓ Email Account 2 configured" -ForegroundColor Green
    } else {
        Write-Host "⚠ Email Account 2 not configured in .env" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ .env file not found! Copy .env.example to .env" -ForegroundColor Red
}

# Check if dependencies are installed
Write-Host "Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "✓ Node modules installed" -ForegroundColor Green
} else {
    Write-Host "⚠ Node modules not installed. Run: npm install" -ForegroundColor Yellow
}

# Check if Docker is running
Write-Host "Checking Docker status..." -ForegroundColor Yellow
docker ps > $null 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Docker is running" -ForegroundColor Green
} else {
    Write-Host "✗ Docker is not running! Start Docker Desktop" -ForegroundColor Red
}

# Check if Docker services are running
Write-Host "Checking Docker services..." -ForegroundColor Yellow
$dockerComposePs = docker-compose ps 2>&1
if ($dockerComposePs -match "onebox-elasticsearch.*Up") {
    Write-Host "✓ Elasticsearch is running" -ForegroundColor Green
} else {
    Write-Host "⚠ Elasticsearch not running. Run: docker-compose up -d" -ForegroundColor Yellow
}

if ($dockerComposePs -match "onebox-qdrant.*Up") {
    Write-Host "✓ Qdrant is running" -ForegroundColor Green
} else {
    Write-Host "⚠ Qdrant not running. Run: docker-compose up -d" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1. Configure .env file with your credentials" -ForegroundColor White
Write-Host "2. Run: docker-compose up -d" -ForegroundColor White
Write-Host "3. Run: npm run dev" -ForegroundColor White
Write-Host "4. Open: http://localhost:3000" -ForegroundColor White
Write-Host ""
