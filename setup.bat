@echo off
echo ========================================
echo NextStep AI - Setup Script (Windows)
echo ========================================
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js v16+ first.
    pause
    exit /b 1
)
echo [OK] Node.js found
node --version

REM Check Python
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed. Please install Python 3.8+ first.
    pause
    exit /b 1
)
echo [OK] Python found
python --version

REM Check MongoDB
where mongod >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] MongoDB not found. Please install MongoDB Community Edition.
    echo Download from: https://www.mongodb.com/try/download/community
)

echo.
echo Installing Backend Dependencies...
cd backend
call npm install
if not exist .env (
    copy .env.example .env
    echo [OK] Created .env file. Please configure it before running.
)
cd ..

echo.
echo Installing ML Service Dependencies...
cd ml
python -m venv venv
call venv\Scripts\activate.bat
pip install -r requirements.txt
python -m spacy download en_core_web_sm
call venv\Scripts\deactivate.bat
cd ..

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. Configure backend\.env file
echo 2. Start MongoDB: net start MongoDB
echo 3. Start Backend: cd backend ^&^& npm run dev
echo 4. Start ML Service: cd ml ^&^& venv\Scripts\activate ^&^& python app.py
echo 5. Start Frontend: cd frontend ^&^& python -m http.server 3000
echo.
echo Access the application at http://localhost:3000
echo.
pause
