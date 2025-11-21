@echo off
REM MasStock Frontend - Start Server Script (Windows)
REM This script starts the development server

echo.
echo ╔════════════════════════════════════════════╗
echo ║   MasStock Frontend - Dev Server          ║
echo ╚════════════════════════════════════════════╝
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install
    echo.
)

REM Check if .env exists
if not exist ".env" (
    echo ⚙️  Creating .env from .env.example...
    copy .env.example .env
    echo ✅ Created .env - Update VITE_API_URL if needed
    echo.
)

REM Show current config
echo 📋 Configuration:
for /f "tokens=*" %%A in ('findstr VITE_API_URL .env') do echo    %%A
echo.

REM Start the dev server
echo 🚀 Starting development server...
echo    URL: http://localhost:5173
echo    Press Ctrl+C to stop
echo.

call npm run dev

pause
