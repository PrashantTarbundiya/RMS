import os
import logging

# Gunicorn configuration for RMS Face AI (SaaS)

# Read PORT dynamically from environment (Docker/Render pass $PORT, default to 8000)
port = os.environ.get("PORT", "8000")
bind = f"0.0.0.0:{port}"

# Use GeventWebSocketWorker for Flask-SocketIO WebSocket support with gevent async_mode
worker_class = "geventwebsocket.gunicorn.workers.GeventWebSocketWorker"

# Use exactly 1 worker for free/starter cloud tiers (512MB RAM) to avoid OOM kills
workers = int(os.environ.get("WEB_CONCURRENCY", "1"))
worker_connections = 100
max_requests = 100
max_requests_jitter = 10

# Request timeouts
timeout = 300
keepalive = 10

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"

# Preload app: False ensures clean process-specific state
preload_app = False

def post_fork(server, worker):
    """
    Invoked just after a worker has been forked.
    Disposes any open SQLAlchemy database connections inherited from the master process,
    preventing socket deadlocks and SSL connection corruption across process boundaries.
    """
    server.log.info(f"Worker spawned with PID: {worker.pid}")
    try:
        from database.db import get_engine
        engine = get_engine()
        if engine is not None:
            engine.dispose(close=False)
            server.log.info(f"[Worker {worker.pid}] Successfully disposed inherited database connection pool.")
    except Exception as e:
        server.log.warning(f"[Worker {worker.pid}] Database post-fork cleanup note: {e}")

