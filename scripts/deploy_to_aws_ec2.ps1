# ==============================================================================
# AuraPass Enterprise - Automated AWS EC2 Live Deployment Script
# Target: https://13-60-225-165.sslip.io
# ==============================================================================
$ErrorActionPreference = "Stop"

$SSH_KEY = "$HOME\.ssh\rms-key.pem"
$EC2_HOST = "ubuntu@13.60.225.165"
$DOMAIN = "https://13-60-225-165.sslip.io"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  AuraPass Enterprise Live Deployment -> $DOMAIN" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# ── 1. Build Frontend ──
Write-Host "[1/6] Building Production React Bundle (Vite)..." -ForegroundColor Yellow
Push-Location frontend
npm run build
Pop-Location

# ── 2. Create Distribution Tarballs ──
Write-Host "[2/6] Packaging Frontend & Backend updates into tarballs..." -ForegroundColor Yellow
if (Test-Path frontend_dist.tar.gz) { Remove-Item frontend_dist.tar.gz -Force }
tar -czf frontend_dist.tar.gz -C frontend/dist .

# Create backend staging directory
$STAGING = "backend_staging"
if (Test-Path $STAGING) { Remove-Item -Recurse -Force $STAGING }
New-Item -ItemType Directory -Path "$STAGING/database" -Force | Out-Null
New-Item -ItemType Directory -Path "$STAGING/reports" -Force | Out-Null

Copy-Item backend/server.py $STAGING/
Copy-Item backend/middleware.py $STAGING/
Copy-Item backend/inference.py $STAGING/
Copy-Item backend/gpu_trainer.py $STAGING/
Copy-Item backend/billing.py $STAGING/
Copy-Item backend/ensemble.py $STAGING/
Copy-Item backend/face_detection.py $STAGING/
Copy-Item backend/face_alignment.py $STAGING/
Copy-Item backend/add_person_utils.py $STAGING/
Copy-Item backend/org_storage.py $STAGING/
Copy-Item backend/requirements.txt $STAGING/
Copy-Item backend/database/models.py $STAGING/database/
Copy-Item backend/database/db.py $STAGING/database/
Copy-Item -Recurse backend/reports/* $STAGING/reports/

if (Test-Path backend_update.tar.gz) { Remove-Item backend_update.tar.gz -Force }
tar -czf backend_update.tar.gz -C $STAGING .
Remove-Item -Recurse -Force $STAGING

# ── 3. Upload Artifacts to EC2 ──
Write-Host "[3/6] Uploading artifacts to EC2 via SCP..." -ForegroundColor Yellow
scp -i $SSH_KEY -o StrictHostKeyChecking=no frontend_dist.tar.gz "$($EC2_HOST):/tmp/"
scp -i $SSH_KEY -o StrictHostKeyChecking=no frontend/nginx.conf "$($EC2_HOST):/tmp/default.conf"
scp -i $SSH_KEY -o StrictHostKeyChecking=no backend_update.tar.gz "$($EC2_HOST):/tmp/"
scp -i $SSH_KEY -o StrictHostKeyChecking=no scripts/sync_ec2_platform_owner.py "$($EC2_HOST):/tmp/"
scp -i $SSH_KEY -o StrictHostKeyChecking=no scripts/verify_ec2_live.py "$($EC2_HOST):/tmp/"

# ── 4. Apply Updates Inside Docker Containers on EC2 ──
Write-Host "[4/6] Applying updates in Docker containers on EC2..." -ForegroundColor Yellow

$remoteScript = @'
set -e
echo "  -> Updating frontend in rms_frontend..."
docker cp /tmp/frontend_dist.tar.gz rms_frontend:/tmp/
docker exec rms_frontend tar -xzf /tmp/frontend_dist.tar.gz -C /usr/share/nginx/html/
docker cp /tmp/default.conf rms_frontend:/etc/nginx/conf.d/default.conf
docker exec rms_frontend nginx -t
docker exec rms_frontend nginx -s reload

echo "  -> Updating backend in rms_api and rms_ml_worker..."
docker cp /tmp/backend_update.tar.gz rms_api:/tmp/
docker cp /tmp/backend_update.tar.gz rms_ml_worker:/tmp/
docker exec rms_api tar -xzf /tmp/backend_update.tar.gz -C /app/
docker exec rms_ml_worker tar -xzf /tmp/backend_update.tar.gz -C /app/

echo "  -> Ensuring Python dependencies are installed..."
docker exec rms_api pip install --no-cache-dir openpyxl reportlab psutil || true

echo "  -> Syncing Super-Admin credentials and sample support tickets..."
docker cp /tmp/sync_ec2_platform_owner.py rms_api:/tmp/
docker exec rms_api python /tmp/sync_ec2_platform_owner.py

echo "  -> Restarting rms_api and rms_ml_worker containers..."
docker restart rms_api rms_ml_worker

echo "  -> Waiting 14 seconds for services to warm up..."
sleep 14
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
'@

ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_HOST $remoteScript

# ── 5. Cleanup local tarballs ──
Write-Host "[5/6] Cleaning up local staging archives..." -ForegroundColor Yellow
if (Test-Path frontend_dist.tar.gz) { Remove-Item frontend_dist.tar.gz -Force }
if (Test-Path backend_update.tar.gz) { Remove-Item backend_update.tar.gz -Force }

# ── 6. Live Endpoint Verification ──
Write-Host "[6/6] Verifying live endpoints on $DOMAIN..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_HOST "python3 /tmp/verify_ec2_live.py"

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  Live Deployment Successfully Completed!" -ForegroundColor Green
Write-Host "  URL: $DOMAIN" -ForegroundColor Green
Write-Host "  Admin: $DOMAIN/admin (vatsalvadgama04@gmail.com)" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
