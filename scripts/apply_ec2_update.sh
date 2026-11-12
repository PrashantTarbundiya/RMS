#!/bin/bash
set -e

echo "=== [1/4] Applying Frontend Updates to rms_frontend ==="
docker cp /tmp/frontend_dist.tar.gz rms_frontend:/tmp/
docker exec rms_frontend sh -c "mkdir -p /usr/share/nginx/html && tar -xzf /tmp/frontend_dist.tar.gz -C /usr/share/nginx/html/"
docker cp /tmp/default.conf rms_frontend:/etc/nginx/conf.d/default.conf
docker exec rms_frontend nginx -t
docker exec rms_frontend nginx -s reload

echo "=== [2/4] Applying Backend Updates to rms_api and rms_ml_worker ==="
docker cp /tmp/backend_update.tar.gz rms_api:/tmp/
docker cp /tmp/backend_update.tar.gz rms_ml_worker:/tmp/
docker exec rms_api tar -xzf /tmp/backend_update.tar.gz -C /app/
docker exec rms_ml_worker tar -xzf /tmp/backend_update.tar.gz -C /app/

echo "=== [3/4] Installing Required Python Packages & Running DB Sync ==="
docker exec rms_api pip install --no-cache-dir openpyxl reportlab psutil || true
docker cp /tmp/sync_ec2_platform_owner.py rms_api:/tmp/
docker exec rms_api python /tmp/sync_ec2_platform_owner.py

echo "=== [4/4] Restarting Backend Containers ==="
docker restart rms_api rms_ml_worker

echo "Waiting 15 seconds for gunicorn and neural models to warm up..."
sleep 15
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

