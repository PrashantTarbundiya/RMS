# 14 Future Roadmap

## Current Limitations & Known Issues
1. **CPU Bottleneck:** The PyTorch MobileNetV2 retraining cycle heavily taxes the CPU. On edge devices with limited cooling, this can cause thermal throttling.
2. **Memory Leaks:** Long-running Python Flask servers holding PyTorch tensors in global variables occasionally suffer from RAM bloat over weeks of uptime.
3. **Haar Cascade Yaw Limits:** The OpenCV face detector struggles with extreme side profiles. If an employee looks away from the camera >45 degrees, the bounding box fails to render.
4. **Data Persistence:** Relying on `recognition_history.json` is not scalable for storing years of attendance logs.

## Planned Features

### Architecture Evolution
- **Migrate to PostgreSQL/SQLite:** To support complex SQL joins (e.g., matching a department ID to an attendance log), the flat JSON files must be deprecated in favor of an SQLAlchemy ORM connected to a relational database.
- **Dockerization for Edge:** Package the Flask app and React frontend into a unified `docker-compose.yml` file to ensure the Python runtime and dependencies behave identically across all edge kiosks.

### Security Improvements
- **Implement JWT Authentication:** Exposing the API without auth is dangerous. Future updates must introduce an Admin Login page issuing Bearer tokens.
- **Liveness Detection:** To prevent spoofing via printed photos, integrate a lightweight depth-mapping or blink-detection algorithm into the pre-processing pipeline.

### Performance Improvements
- **GPU Acceleration Transition:** If hardware permits, migrate tensor operations to `CUDA` explicitly.
- **RetinaFace Migration:** Replace Haar Cascades with RetinaFace or MediaPipe for highly robust, multi-angle face detection.
- **Gunicorn/Uvicorn:** Replace the Flask development server (`app.run`) with a production-grade WSGI server running multiple worker processes to handle concurrent webcam requests simultaneously.

### Mobile Upgrades
- Implement React Native Reanimated for smoother 60fps native-driver transitions.
- Explore local on-device ML execution (e.g., TensorFlow Lite) for the first-pass face detection to save network bandwidth before sending the cropped artifact to the server.
