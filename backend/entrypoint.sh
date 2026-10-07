#!/bin/bash
set -e

echo "============================================"
echo "  RMS Face AI — Container Startup"
echo "============================================"

# ── Wait for PostgreSQL to be truly ready ──
if [ -n "$DATABASE_URL" ]; then
    echo "[entrypoint] Waiting for PostgreSQL..."
    
    # Extract host and port from DATABASE_URL
    # Format: postgresql://user:pass@host:port/dbname
    DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
    DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
    
    # Default port if not found
    DB_PORT=${DB_PORT:-5432}
    
    # Wait up to 30 seconds for PostgreSQL
    for i in $(seq 1 30); do
        if pg_isready -h "$DB_HOST" -p "$DB_PORT" -q 2>/dev/null; then
            echo "[entrypoint] PostgreSQL is ready!"
            break
        fi
        echo "[entrypoint] Waiting for PostgreSQL... ($i/30)"
        sleep 1
    done

    # ── Run Alembic Migrations ──
    echo "[entrypoint] Running database migrations..."
    cd /app
    alembic upgrade head || echo "[entrypoint] WARNING: Migration failed (may be first run, tables will be created by app)"
    echo "[entrypoint] Migrations complete."
fi

# ── Start the application ──
echo "[entrypoint] Starting application..."
exec "$@"
