import os
import sys
import time
import secrets
import threading
from datetime import datetime, timezone

from security_hardening import (
    validate_grace_period_key,
    _save_grace_data,
    _load_grace_data,
    BACKEND_DIR
)

def run_test():
    print("=== Testing API Key Rotation Under Active Concurrent Load ===")
    
    grace_file = os.path.join(BACKEND_DIR, 'data', 'api_key_grace.json')
    old_key = secrets.token_hex(32)
    new_key = secrets.token_hex(32)
    camera_id = "test_cam_001"
    
    total_requests = 100
    successful_requests = 0
    errors = 0
    rotation_done = False
    
    lock = threading.Lock()

    def simulate_camera_requests():
        nonlocal successful_requests, errors
        for i in range(total_requests):
            # Mid-way through requests, perform rotation!
            if i == 50 and not rotation_done:
                pass  # Handled by main thread or trigger thread
                
            # Request uses old_key or new_key depending on rotation
            key_to_use = old_key
            
            # Middleware check simulation:
            # 1. First check primary db key (simulated)
            is_valid_db = (key_to_use == new_key) if rotation_done else (key_to_use == old_key)
            
            # 2. If not in DB, check grace period!
            is_valid_grace = False
            if not is_valid_db:
                grace_info = validate_grace_period_key(key_to_use)
                if grace_info and grace_info['camera_id'] == camera_id:
                    is_valid_grace = True

            if is_valid_db or is_valid_grace:
                with lock:
                    successful_requests += 1
            else:
                with lock:
                    errors += 1

            time.sleep(0.005)

    def trigger_rotation():
        nonlocal rotation_done
        time.sleep(0.1) # Wait until requests are halfway
        
        # Perform rotation logic
        from datetime import timedelta
        grace_expiry = datetime.now(timezone.utc) + timedelta(hours=24)
        grace_data = _load_grace_data(grace_file)
        grace_data[old_key] = {
            'camera_id': camera_id,
            'org_id': 'org_1',
            'expires_at': grace_expiry.isoformat(),
            'replaced_by': new_key,
        }
        _save_grace_data(grace_file, grace_data)
        
        with lock:
            rotation_done = True
        print(f"-> Key rotated mid-flight at {datetime.now(timezone.utc)}")

    # Start threads
    t1 = threading.Thread(target=simulate_camera_requests)
    t2 = threading.Thread(target=trigger_rotation)

    t1.start()
    t2.start()

    t1.join()
    t2.join()

    print(f"Total Requests: {total_requests}")
    print(f"Successful Requests: {successful_requests}")
    print(f"Dropped/Failed Requests: {errors}")

    # Cleanup
    grace_data = _load_grace_data(grace_file)
    if old_key in grace_data:
        del grace_data[old_key]
        _save_grace_data(grace_file, grace_data)

    if errors == 0 and successful_requests == total_requests:
        print("SUCCESS: Zero dropped requests during concurrent API Key rotation!")
    else:
        print("FAIL: Requests were dropped during API key rotation!")

if __name__ == '__main__':
    run_test()
