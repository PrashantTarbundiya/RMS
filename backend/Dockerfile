# Use official lightweight Python image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies (required for OpenCV & curl for healthchecks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir --no-deps deepface>=0.0.79 && \
    rm -rf /root/.cache /tmp/*

# Copy the rest of the application code
COPY . .

# Copy and set entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose port for Gunicorn
EXPOSE 8000

# Set environment variables for production
ENV DEPLOYMENT_MODE=local
ENV PYTHONUNBUFFERED=1

# Entrypoint runs migrations, then hands off to CMD
ENTRYPOINT ["/entrypoint.sh"]

# Command to run Gunicorn with gevent for WebSocket support
CMD ["gunicorn", "-c", "gunicorn.conf.py", "server:app"]
