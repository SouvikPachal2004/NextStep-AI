@echo off
echo ========================================
echo   NextStep AI - Backend Server
echo ========================================
echo.

REM Check if .env exists
if not exist "backend\.env" (
    echo Creating .env file from .env.example...
    copy backend\.env.example backend\.env
    echo.
    echo ⚠️  IMPORTANT: Edit backend\.env and set your MongoDB URI and JWT_SECRET
    echo.
    pause
)

REM Check if node_modules exists
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    call npm install multer
    cd ..
    echo.
)

REM Create uploads folder if it doesn't exist
if not exist "backend\uploads\resumes" (
    echo Creating uploads folder...
    mkdir backend\uploads\resumes
    echo.
)

echo Starting backend server...
echo.
echo Backend will run on: http://localhost:5000
echo API endpoints: http://localhost:5000/api
echo.
echo Press Ctrl+C to stop the server
echo.

cd backend
call npm start
