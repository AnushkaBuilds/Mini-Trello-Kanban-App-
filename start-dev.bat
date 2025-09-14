@echo off
echo Starting Trello App Development Environment...
echo.

echo Killing any existing processes on ports 3000 and 3001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do taskkill /F /PID %%a 2>nul

echo.
echo Starting Backend Server (Port 3001)...
start "Backend" cmd /k "cd /d \"%~dp0backend\" && npm run build && npm start"

echo Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak >nul

echo.
echo Starting Frontend Server (Port 3000)...
start "Frontend" cmd /k "cd /d \"%~dp0frontend\" && npm run dev"

echo.
echo Development servers are starting...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:3001/api/v1/docs
echo.
pause
