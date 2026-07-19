import multiprocessing

# Gunicorn configuration for RMS Face AI (SaaS)

# Bind to 0.0.0.0 for external access
bind = "0.0.0.0:8000"

# Use gevent or eventlet if doing heavy async, 
# but for PyTorch/OpenCV workloads, synchronous workers or gthread are better 
# to avoid GIL contention and thread-safety issues with CV2.
worker_class = "gthread"
workers = multiprocessing.cpu_count() * 2 + 1
threads = 4

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
