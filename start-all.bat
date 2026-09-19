@echo off
echo ===================================================
echo   Starting CryptoPro AI - Full Platform Launch
echo ===================================================
echo.

start "CryptoPro AI - Backend Server" cmd /k "cd /d %~dp0server && npm run dev"
timeout /t 3 /nobreak >nul

start "CryptoPro AI - Frontend Client" cmd /k "cd /d %~dp0client && npm run dev -- --port 3000"
timeout /t 2 /nobreak >nul

echo.
echo ===================================================
echo   System launched successfully!
echo   Frontend : http://localhost:3000/
echo   Backend  : http://localhost:5000/
echo ===================================================
echo.
pause
