# 12 Deployment

## Edge Deployment (Local Intranet)
RMS Face AI is heavily optimized for local Edge Deployment to avoid cloud egress costs and maintain strict data privacy.
- **Hardware Requirements:** Modern multi-core CPU (Intel i5/i7 or AMD Ryzen 5+) and 8GB RAM minimum. An NVIDIA GPU with CUDA support is highly recommended for scaling past 50 simultaneous users.
- **Bootstrapping:** Simply run `start.bat`. This automatically sets up the Python virtual environment, installs PIP dependencies, compiles the Vite frontend, and starts both servers.
- **Network Exposure:** The host machine must have its firewall configured to allow inbound TCP traffic on Port `5000` (Flask) and Port `5173` (Vite) so that mobile devices and laptops on the same Wi-Fi network can connect.

## Cloud Deployment (Render.com)
The project includes a `render.yaml` for deployment to Render.
- **Limitations:** Free and standard cloud tiers do not provide GPUs. PyTorch MobileNetV2 inference running on shared cloud vCPUs will suffer severe latency (~2-5 seconds per frame), rendering the Live Attendance feature practically unusable.
- **Docker:** If deploying to AWS ECS or GCP Cloud Run, a `Dockerfile` must be created extending `python:3.10-slim`. You must ensure `libgl1-mesa-glx` is installed via `apt-get` to support OpenCV.

## CI/CD & Monitoring
**Recommendation:** 
- Set up a GitHub Actions workflow that runs `pytest` on the `inference.py` logic whenever code is pushed.
- Implement Datadog or Sentry for production logging. Currently, logging is restricted to standard stdout/stderr streams.
- **Storage Volumes:** If deploying to a containerized cloud environment, the `/dataset` and `/backend/data` folders MUST be mapped to a persistent volume (e.g., AWS EFS). If the container restarts, all trained `encodings.pickle` and `recognition_history.json` files will be lost without a persistent volume.
