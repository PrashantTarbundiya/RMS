# Use official lightweight Python image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies (required for OpenCV and dlib)
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    build-essential \
    cmake \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose port for Gunicorn
EXPOSE 8000

# Set environment variables for production
ENV DEPLOYMENT_MODE=local
ENV PYTHONUNBUFFERED=1

# Command to run Gunicorn
CMD ["gunicorn", "-c", "gunicorn.conf.py", "server:app"]
