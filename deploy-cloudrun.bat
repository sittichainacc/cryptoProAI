@echo off
chcp 65001 >nul
echo ========================================================
echo  CryptoPro AI — Google Cloud Run Deployment Helper
echo ========================================================

where gcloud >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] ไม่พบคำสั่ง gcloud บนเครื่องนี้
    echo.
    echo [แนะนำวิธีที่สะดวกที่สุด]:
    echo 1. เปิดเว็บเบราว์เซอร์แล้วเข้า: https://shell.cloud.google.com
    echo 2. อัปโหลดโฟลเดอร์โปรเจกต์นี้ หรือใช้ Git Clone
    echo 3. รันคำสั่งต่อไปนี้ใน Cloud Shell:
    echo.
    echo    chmod +x deploy-cloudrun.sh
    echo    ./deploy-cloudrun.sh
    echo.
    pause
    exit /b 1
)

echo [1/2] กำลังตรวจสอบ Google Cloud Project...
gcloud config get-value project

echo [2/2] กำลังเริ่ม Deploy สู่ Google Cloud Run (ภูมิภาค asia-southeast1)...
gcloud run deploy cryptopro-ai --source . --region asia-southeast1 --platform managed --allow-unauthenticated --port 8080 --memory 512Mi --cpu 1

echo.
echo ========================================================
echo  การ Deploy เสร็จสิ้น! ดู Public URL ได้จากข้อความด้านบน
echo ========================================================
pause
