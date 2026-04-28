@echo off
echo ========================================
echo   NextStep AI - Starting All Services
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed!
    echo Please install Python from https://www.python.org/
    pause
    exit /b 1
)

echo [1/3] Starting MongoDB...
echo Please ensure MongoDB is running on localhost:27017
echo.

echo [2/3] Starting Backend Server (Port 5000)...
start "NextStep Backend" cmd /k "cd backend && npm start"
timeout /t 3 >nul

echo [3/3] Starting ML Service (Port 5001)...
start "NextStep ML Service" cmd /k "cd ml && python app.py"
timeout /t 3 >nul

echo.
echo ========================================
echo   All Services Started Successfully!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo ML Service: http://localhost:5001
echo Frontend: Open with Live Server (Port 5500)
echo.
echo MongoDB: mongodb://localhost:27017/nextstep-ai
echo.
echo Press any key to open frontend in browser...
pause >nul

REM Open frontend in default browser
start http://localhost:5500/frontend/index.html

echo.
echo Services are running in separate windows.
echo Close those windows to stop the services.
echo.
pause
