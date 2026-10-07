@echo off
chcp 65001 >nul
echo ====================================================
echo  🚀 Deploying CryptoPro AI to Vercel (Production)
echo ====================================================

echo.
echo [1/3] Building client and server bundles...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ❌ Build failed! Please fix the errors before deploying.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Checking Vercel CLI...
where vercel >nul 2>&1
if %errorlevel% neq 0 (
    echo Vercel CLI not found globally, using npx vercel...
    set VERCEL_CMD=npx vercel
) else (
    set VERCEL_CMD=vercel
)

echo.
echo [3/3] Deploying to Vercel Production...
echo (If you are not logged in, you will be prompted to login first)
echo.
call %VERCEL_CMD% --prod

echo.
echo ====================================================
echo  🎉 Vercel Deployment Completed!
echo ====================================================
pause
