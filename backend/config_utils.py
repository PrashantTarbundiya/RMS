import os
import json
import threading

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(BACKEND_DIR, 'data', 'config.json')
_config_lock = threading.Lock()

DEFAULT_CONFIG = {
    "CONFIRM_THRESHOLD": 0.55
}

def load_config():
    with _config_lock:
        if not os.path.exists(CONFIG_PATH):
            save_config_internal(DEFAULT_CONFIG)
            return dict(DEFAULT_CONFIG)
        try:
            with open(CONFIG_PATH, 'r') as f:
                config = json.load(f)
                merged = dict(DEFAULT_CONFIG)
                merged.update(config)
                return merged
        except Exception:
            return dict(DEFAULT_CONFIG)

def save_config_internal(config_dict):
    os.makedirs(os.path.dirname(CONFIG_PATH), exist_ok=True)
    current = {}
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, 'r') as f:
                current = json.load(f)
        except: pass
    current.update(config_dict)
    with open(CONFIG_PATH, 'w') as f:
        json.dump(current, f, indent=4)
    return current

def save_config(config_dict):
    with _config_lock:
        return save_config_internal(config_dict)

def get_confirm_threshold():
    config = load_config()
    return float(config.get("CONFIRM_THRESHOLD", 0.55))
