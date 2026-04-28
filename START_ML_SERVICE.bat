@echo off
echo ========================================
echo   NextStep AI - Starting ML Service
echo ========================================
echo.

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed!
    echo Please install Python from https://www.python.org/
    pause
    exit /b 1
)

cd ml

REM Check if virtual environment exists
if not exist "venv" (
    echo [WARNING] Virtual environment not found!
    echo Creating virtual environment...
    python -m venv venv
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to create virtual environment!
        pause
        exit /b 1
    )
    
    echo Installing dependencies...
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
    python -m spacy download en_core_web_sm
) else (
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
)

echo.
echo Starting ML Service on port 5001...
echo.
python app.py

pause
