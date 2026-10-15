import multiprocessing

# Gunicorn configuration for RMS Face AI (SaaS)

# Bind to 0.0.0.0 for external access
bind = "0.0.0.0:8000"

# Use GeventWebSocketWorker for Flask-SocketIO WebSocket support with gevent async_mode
worker_class = "geventwebsocket.gunicorn.workers.GeventWebSocketWorker"
workers = 2
worker_connections = 1000

# Timeouts: Retraining can take some time, but we moved it to Celery.
# The longest request should be bulk upload or model inference.
timeout = 120
keepalive = 5

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"

# Preload app for memory savings (loads ML models once before forking)
# However, because we lazy-load models per-org, preload might just save Flask memory.
preload_app = False
