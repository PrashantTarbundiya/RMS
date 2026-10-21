#!/bin/bash
set -e

echo "============================================"
echo "  RMS Face AI — Container Startup"
echo "============================================"

# ── Wait for PostgreSQL to be truly ready ──
if [ -n "$DATABASE_URL" ]; then
    echo "[entrypoint] Waiting for PostgreSQL..."
    
    # Verify database connection up to 15 seconds
    python -c "
import os, sys, time
db_url = os.environ.get('DATABASE_URL', '')
if not db_url.startswith('postgres'):
    sys.exit(0)
import psycopg2
for i in range(15):
    try:
        conn = psycopg2.connect(db_url, connect_timeout=3)
        conn.close()
        print('[entrypoint] Database connection verified!')
        sys.exit(0)
    except Exception as e:
        print(f'[entrypoint] Waiting for database connection ({i+1}/15)...')
        time.sleep(1)
print('[entrypoint] Proceeding with migration...')
" || true

    # ── Run Alembic Migrations ──
    echo "[entrypoint] Running database migrations..."
    cd /app
    alembic upgrade head || echo "[entrypoint] WARNING: Migration failed (may be first run, tables will be created by app)"
    echo "[entrypoint] Migrations complete."
fi

# ── Start the application ──
echo "[entrypoint] Starting application..."
exec "$@"
