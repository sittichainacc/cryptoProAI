#!/bin/bash
# ========================================================
# CryptoPro AI — Google Cloud Run Deployment Script
# ========================================================
set -e

SERVICE_NAME="cryptopro-ai"
REGION="asia-southeast1" # Singapore / Southeast Asia (Low latency for Thailand)
MEMORY="512Mi"
CPU="1"

echo "========================================================"
echo " Deploying CryptoPro AI to Google Cloud Run"
echo " Region: $REGION"
echo "========================================================"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed or not in PATH."
    echo "👉 Please use Google Cloud Shell (https://shell.cloud.google.com) or install Google Cloud SDK."
    exit 1
fi

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo "⚠️ No active GCP Project set."
    read -p "Enter your Google Cloud Project ID: " PROJECT_ID
    gcloud config set project "$PROJECT_ID"
fi

echo "🚀 Building and Deploying $SERVICE_NAME on project: $PROJECT_ID ..."

gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory "$MEMORY" \
  --cpu "$CPU"

echo ""
echo "✅ Deployment Finished Successfully!"
echo "🌐 Your Public URL is shown above."
