#!/usr/bin/env python3
"""
AuraPass™ Enterprise — Hardware Camera & RTSP Edge Streaming Daemon

Usage:
    python edge_streamer.py --stream "rtsp://admin:pass@192.168.1.100:554/Streaming/Channels/101" --key "rms_cam_..." --server "http://localhost:5000"

Features:
    - Connects to any physical RTSP IP camera (Hikvision, Dahua, CP Plus, Axis, Hanwha, Uniview) or USB webcam.
    - Low-latency frame acquisition via OpenCV VideoCapture with buffer flushing.
    - Automatic network drop reconnection with exponential backoff.
    - Sends sampled frames to AuraPass /api/predict with X-Camera-Key authentication.
    - Logs real-time employee check-ins, recognition confidence, and end-to-end latency.
"""

import cv2
import time
import argparse
import logging
import requests
import sys

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] [AuraPass-Edge] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger('edge_streamer')

def run_streamer(stream_source, api_key, server_url, fps_limit=3.0, motion_threshold=15.0):
    logger.info("=" * 65)
    logger.info(" AuraPass™ Enterprise — Edge Camera Streaming Daemon")
    logger.info("=" * 65)
    logger.info(f"Target Server : {server_url}")
    logger.info(f"Camera Stream : {stream_source}")
    logger.info(f"Target FPS    : {fps_limit} frames/sec")
    logger.info("=" * 65)

    predict_url = f"{server_url.rstrip('/')}/api/predict"
    headers = {
        'X-Camera-Key': api_key
    }

    # Handle USB camera integer indexes
    source = int(stream_source) if stream_source.isdigit() else stream_source

    frame_interval = 1.0 / max(0.5, fps_limit)
    last_sent_time = 0.0
    backoff = 2.0

    while True:
        logger.info(f"Connecting to camera stream: {stream_source} ...")
        cap = cv2.VideoCapture(source)
        
        # Optimize buffer size for RTSP low latency
        if not isinstance(source, int):
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

        if not cap.isOpened():
            logger.error(f"Failed to open video source. Retrying in {backoff:.1f}s...")
            time.sleep(backoff)
            backoff = min(backoff * 1.5, 30.0)
            continue

        logger.info("Camera stream connected successfully! Processing frames...")
        backoff = 2.0
        consecutive_errors = 0

        try:
            while True:
                ret, frame = cap.read()
                if not ret or frame is None:
                    consecutive_errors += 1
                    if consecutive_errors > 15:
                        logger.warning("Stream read timeout. Reconnecting...")
                        break
                    time.sleep(0.05)
                    continue

                consecutive_errors = 0
                now = time.time()

                if now - last_sent_time >= frame_interval:
                    last_sent_time = now

                    # Resize frame for optimal facial verification balance (max 1080p / ideal 720p)
                    h, w = frame.shape[:2]
                    if w > 1280:
                        scale = 1280.0 / w
                        frame_resized = cv2.resize(frame, (1280, int(h * scale)), interpolation=cv2.INTER_AREA)
                    else:
                        frame_resized = frame

                    # Encode to JPEG
                    _, buffer = cv2.imencode('.jpg', frame_resized, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
                    files = {'image': ('frame.jpg', buffer.tobytes(), 'image/jpeg')}

                    try:
                        t0 = time.time()
                        resp = requests.post(predict_url, headers=headers, files=files, timeout=4.0)
                        latency_ms = int((time.time() - t0) * 1000)

                        if resp.status_code == 200:
                            data = resp.json()
                            status = data.get('status', 'NO_FACE')
                            emp_name = data.get('employee_name') or data.get('name') or 'Unknown'
                            conf = data.get('confidence', 0)

                            if status in ['VERIFIED', 'ON_TIME', 'LATE', 'CHECK_IN'] or emp_name != 'Unknown':
                                logger.info(f"✅ ACCESS GRANTED: {emp_name} | Confidence: {conf}% | Roundtrip: {latency_ms}ms")
                            elif status == 'UNKNOWN' or status == 'ACCESS_DENIED':
                                logger.warning(f"⚠️ UNRECOGNIZED FACE | Roundtrip: {latency_ms}ms")
                        elif resp.status_code == 401 or resp.status_code == 403:
                            logger.error(f"❌ Authentication Failed: Invalid X-Camera-Key ({resp.status_code}). Check your device key.")
                            time.sleep(5)
                        else:
                            # 204 or silent no-face responses
                            pass

                    except requests.exceptions.RequestException as req_err:
                        logger.warning(f"Server API communication warning: {req_err}")

        except KeyboardInterrupt:
            logger.info("Daemon interrupted by operator. Exiting cleanly...")
            break
        except Exception as e:
            logger.error(f"Unexpected streaming exception: {e}")
        finally:
            cap.release()

        time.sleep(backoff)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="AuraPass™ Enterprise — Hardware Camera & RTSP Edge Streaming Daemon")
    parser.add_argument('--stream', required=True, help='RTSP URL (e.g. rtsp://user:pass@ip:554/live) or USB camera index (e.g. 0)')
    parser.add_argument('--key', required=True, help='AuraPass Camera Device API Key (rms_cam_...)')
    parser.add_argument('--server', default='http://localhost:5000', help='AuraPass Server Base URL (e.g. https://13-60-225-165.sslip.io)')
    parser.add_argument('--fps', type=float, default=3.0, help='Sampling rate in frames per second (default: 3.0)')

    args = parser.parse_args()
    run_streamer(args.stream, args.key, args.server, args.fps)
