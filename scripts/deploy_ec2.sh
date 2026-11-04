set -e
echo "=== Step 1: Copying and unpacking real employee photos into rms_api ==="
docker cp /tmp/dataset_real_employees.tar.gz rms_api:/tmp/
docker exec rms_api bash -c "mkdir -p /app/dataset_cleaned && tar -xzf /tmp/dataset_real_employees.tar.gz -C /app/dataset_cleaned/"
docker exec rms_api bash -c "ls -ld /app/dataset_cleaned/*"

echo "=== Step 2: Deploying clean encodings.pickle ==="
docker cp /tmp/encodings.pickle rms_api:/app/encodings.pickle
docker exec rms_api bash -c "mkdir -p /app/data && cp /app/encodings.pickle /app/data/encodings.pickle"
docker cp /tmp/encodings.pickle rms_ml_worker:/app/encodings.pickle
docker exec rms_ml_worker bash -c "mkdir -p /app/data && cp /app/encodings.pickle /app/data/encodings.pickle"

echo "=== Step 3: Updating server.py and inference.py ==="
docker cp /tmp/server.py rms_api:/app/server.py
docker cp /tmp/inference.py rms_api:/app/inference.py
docker cp /tmp/inference.py rms_ml_worker:/app/inference.py

echo "=== Step 4: Running database cleanup script in rms_api ==="
docker cp /tmp/cleanup_ec2_db.py rms_api:/app/cleanup_ec2_db.py
docker exec rms_api python /app/cleanup_ec2_db.py

echo "=== Step 5: Updating frontend build in rms_frontend ==="
docker cp /tmp/frontend_dist.tar.gz rms_frontend:/tmp/
docker exec rms_frontend bash -c "rm -rf /usr/share/nginx/html/* && tar -xzf /tmp/frontend_dist.tar.gz -C /usr/share/nginx/html/"
docker exec rms_frontend nginx -t
docker exec rms_frontend nginx -s reload

echo "=== Step 6: Restarting rms_api and rms_ml_worker ==="
docker restart rms_api rms_ml_worker

echo "=== Step 7: Waiting for rms_api to initialize ==="
sleep 10
docker ps --format 'table {{.Names}}\t{{.Status}}'

