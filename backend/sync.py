import time
import os
import requests
import logging
from database.db import get_db_session
from database.models import AttendanceLog
import threading

logger = logging.getLogger('rms-sync')
logger.setLevel(logging.INFO)

CLOUD_API_URL = os.environ.get('CLOUD_API_URL', 'http://localhost:8000')

def sync_logs():
    """
    Finds unsynced AttendanceLog records locally and pushes them to the Cloud API.
    Used in 'hybrid' deployment mode.
    """
    logger.info("Starting Edge-to-Cloud Sync Worker...")
    
    # Needs to poll periodically
    while True:
        try:
            with get_db_session() as session:
                unsynced = session.query(AttendanceLog).filter_by(synced=False).all()
                
                if unsynced:
                    payload = []
                    for log in unsynced:
                        payload.append({
                            'id': log.id,
                            'org_id': log.org_id,
                            'employee_id': log.employee_id,
                            'camera_id': log.camera_id,
                            'checkin_time': log.checkin_time.isoformat(),
                            'confidence': log.confidence,
                            'method': log.method,
                            'status': log.status.value,
                            'prediction_label': log.prediction_label,
                            'is_confirmed': log.is_confirmed
                        })
                    
                    # Read API key for the appliance (camera or edge node api key)
                    api_key = os.environ.get('EDGE_API_KEY', 'edge_default_key')
                    
                    response = requests.post(
                        f"{CLOUD_API_URL}/api/sync",
                        json={'logs': payload},
                        headers={'Authorization': f'Bearer {api_key}'},
                        timeout=10
                    )
                    
                    if response.status_code == 200:
                        for log in unsynced:
                            log.synced = True
                        session.commit()
                        logger.info(f"Successfully synced {len(payload)} logs to cloud.")
                    else:
                        logger.warning(f"Cloud sync failed: HTTP {response.status_code} - {response.text}")
        except Exception as e:
            logger.error(f"Sync error: {e}")
            
        time.sleep(60) # sync every 60 seconds

def start_sync_worker():
    thread = threading.Thread(target=sync_logs, daemon=True)
    thread.start()
    return thread

if __name__ == "__main__":
    sync_logs()
