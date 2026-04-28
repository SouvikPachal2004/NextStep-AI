@echo off
echo ========================================
echo   NextStep AI - Installing Dependencies
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

echo [1/2] Installing Backend Dependencies...
cd backend
if not exist "node_modules" (
    echo Installing Node.js packages...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install backend dependencies!
        cd ..
        pause
        exit /b 1
    )
    echo Backend dependencies installed successfully!
) else (
    echo Backend dependencies already installed.
)
cd ..

echo.
echo [2/2] Installing ML Service Dependencies...
cd ml
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to create virtual environment!
        cd ..
        pause
        exit /b 1
    )
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing Python packages...
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install ML dependencies!
    cd ..
    pause
    exit /b 1
)

echo Downloading spaCy language model...
python -m spacy download en_core_web_sm
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Failed to download spaCy model. Will download on first run.
)

echo ML dependencies installed successfully!
cd ..

echo.
echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Ensure MongoDB is running
echo 2. Configure .env files in backend folder
echo 3. Run START_ALL.bat to start all services
echo.
pause
