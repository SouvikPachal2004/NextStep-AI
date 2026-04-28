@echo off
echo ========================================
echo   NextStep AI - Frontend Server
echo ========================================
echo.

echo Starting frontend server...
echo.
echo Frontend will run on: http://localhost:3000
echo.
echo Pages:
echo   - Home: http://localhost:3000/index.html
echo   - Login: http://localhost:3000/pages/login.html
echo   - Signup: http://localhost:3000/pages/signup.html
echo   - User Dashboard: http://localhost:3000/pages/user-dashboard.html
echo   - Admin Dashboard: http://localhost:3000/pages/admin-dashboard.html
echo.
echo Press Ctrl+C to stop the server
echo.

cd frontend
python -m http.server 3000
