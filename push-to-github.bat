@echo off
chcp 65001 >nul
echo ========================================================
echo  CryptoPro AI — Push Code to GitHub Helper
echo ========================================================
echo.
echo กรุณาสร้าง Repository เปล่าบน GitHub (https://github.com/new)
echo แล้วคัดลอก URL มาวางด้านล่าง (เช่น https://github.com/YOUR_USER/cryptopro-ai.git)
echo.
set /p REPO_URL="วาง GitHub Repository URL ที่นี่: "

if "%REPO_URL%"=="" (
    echo [ERROR] ไม่ได้ระบุ URL
    pause
    exit /b 1
)

git remote remove origin 2>nul
git remote add origin %REPO_URL%
git branch -M main
echo.
echo กำลังอัปโหลดโค้ดขึ้น GitHub...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo  ✅ Push โค้ดขึ้น GitHub สำเร็จเรียบร้อย!
    echo  ขั้นตอนถัดไป: ไปที่ Render.com เพื่อเชื่อมต่อและ Deploy 24 ชม.
    echo ========================================================
) else (
    echo.
    echo ❌ เกิดข้อผิดพลาดในการ Push กรุณาตรวจสอบ URL หรือสิทธิ์การเข้าถึง GitHub
)

pause
