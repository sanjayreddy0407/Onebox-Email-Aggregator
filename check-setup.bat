@echo off
echo ========================================
echo OneBox Email Aggregator - System Check
echo ========================================
echo.

echo Checking Node.js...
node --version >nul 2>&1
if %errorlevel%==0 (
    echo [OK] Node.js installed
    node --version
) else (
    echo [ERROR] Node.js not found!
    exit /b 1
)

echo.
echo Checking npm...
npm --version >nul 2>&1
if %errorlevel%==0 (
    echo [OK] npm installed
    npm --version
) else (
    echo [ERROR] npm not found!
    exit /b 1
)

echo.
echo Checking Docker...
docker --version >nul 2>&1
if %errorlevel%==0 (
    echo [OK] Docker installed
    docker --version
) else (
    echo [ERROR] Docker not found!
    exit /b 1
)

echo.
echo Checking .env file...
if exist .env (
    echo [OK] .env file exists
) else (
    echo [WARNING] .env file not found
    echo Copy .env.example to .env and configure it
)

echo.
echo Checking node_modules...
if exist node_modules (
    echo [OK] Dependencies installed
) else (
    echo [WARNING] Dependencies not installed
    echo Run: npm install
)

echo.
echo Checking Docker services...
docker ps >nul 2>&1
if %errorlevel%==0 (
    echo [OK] Docker is running
    docker-compose ps
) else (
    echo [ERROR] Docker is not running!
    echo Start Docker Desktop
)

echo.
echo ========================================
echo Next Steps:
echo ========================================
echo 1. Configure .env file with your credentials
echo 2. Run: docker-compose up -d
echo 3. Run: npm run dev
echo 4. Open: http://localhost:3000
echo.
pause
