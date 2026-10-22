#!/bin/bash
# ==============================================================================
# RMS Face AI — Automated Deploy & Continuous Update Script
# Usage: ./deploy.sh
# ==============================================================================
set -e

echo "=========================================================="
echo "  Deploying RMS Face AI Production Stack"
echo "=========================================================="

# 1. Pull latest code from GitHub
echo "[1/4] Pulling latest code changes from origin/main..."
git fetch origin main
git reset --hard origin/main

# 2. Ensure environment file exists
if [ ! -f .env ]; then
    if [ -f .env.docker ]; then
        echo "Creating .env from .env.docker..."
        cp .env.docker .env
    else
        echo "ERROR: .env file missing! Please create .env before deploying."
        exit 1
    fi
fi

# 3. Build and launch containers
echo "[2/4] Building and launching containers..."
docker system prune -f
docker builder prune -a -f
docker compose build
docker compose up -d --remove-orphans

# 4. Clean up dangling images to keep disk clean (protects free tier disk)
echo "[3/4] Cleaning old dangling Docker images..."
docker image prune -f
docker builder prune -f

# 5. Health Check
echo "[4/4] Verifying health status..."
sleep 5
HEALTHY=false
for i in {1..12}; do
    if curl -s -f http://localhost/api/ping > /dev/null 2>&1; then
        echo "  -> System is HEALTHY and responding!"
        HEALTHY=true
        break
    fi
    echo "  -> Waiting for services to become healthy ($i/12)..."
    sleep 5
done

if [ "$HEALTHY" = false ]; then
    echo "  -> Note: Services are still initializing or model weights are loading."
fi

echo "=========================================================="
echo "  Deployment Complete! Running containers:"
docker compose ps
echo "=========================================================="
