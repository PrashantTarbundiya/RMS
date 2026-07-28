import time
import requests
import socketio
import base64
import os
import sys

URL = 'http://127.0.0.1:5000'
WS_URL = 'ws://127.0.0.1:5000'
FRAMES = 50

# create a dummy image to send
def create_dummy_image():
    import numpy as np
    import cv2
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    # Draw a face-like rectangle so detector finds something
    cv2.rectangle(img, (200, 150), (440, 390), (255, 255, 255), -1)
    ret, buf = cv2.imencode('.jpg', img)
    return buf.tobytes()

dummy_image_bytes = create_dummy_image()
dummy_b64 = base64.b64encode(dummy_image_bytes).decode('utf-8')

print(f"Benchmarking HTTP /predict...")
start_time = time.time()
http_times = []
for i in range(FRAMES):
    t0 = time.time()
    try:
        res = requests.post(f"{URL}/api/predict", files={'image': ('dummy.jpg', dummy_image_bytes, 'image/jpeg')}, data={'test_mode': 'true'})
    except Exception as e:
        print("HTTP Error", e)
    http_times.append(time.time() - t0)
http_total = time.time() - start_time
print(f"HTTP Avg Latency: {sum(http_times)/len(http_times):.4f}s")
print(f"HTTP Total Time for {FRAMES} requests: {http_total:.2f}s")

print(f"\nBenchmarking WebSocket /stream_frame...")
sio = socketio.Client()
ws_times = []
frames_received = 0

start_ws = time.time()

t0_ws = None

@sio.on('prediction_result')
def on_result(data):
    global frames_received, t0_ws
    ws_times.append(time.time() - t0_ws)
    frames_received += 1
    if frames_received < FRAMES:
        t0_ws = time.time()
        sio.emit('stream_frame', {'image': dummy_b64})
    else:
        sio.disconnect()

sio.connect(WS_URL, transports=['websocket'])
t0_ws = time.time()
sio.emit('stream_frame', {'image': dummy_b64})
sio.wait()

ws_total = time.time() - start_ws
print(f"WebSocket Avg Latency: {sum(ws_times)/len(ws_times):.4f}s")
print(f"WebSocket Total Time for {FRAMES} requests: {ws_total:.2f}s")

print("\n--- Summary ---")
print(f"Latency Reduction: {(1 - (sum(ws_times)/len(ws_times)) / (sum(http_times)/len(http_times))) * 100:.2f}%")
print(f"Total Time Reduction: {(1 - ws_total / http_total) * 100:.2f}%")
