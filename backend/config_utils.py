"""
config_utils.py — Application configuration management.

Dual-mode design:
  - When DATABASE_URL is set (multi-tenant): reads per-org config from
    the Organization table in PostgreSQL.
  - When DATABASE_URL is absent (single-tenant): reads from the local
    config.json file (original behavior preserved).
"""

import os
import json
import logging
import threading

logger = logging.getLogger('rms-api')

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(BACKEND_DIR, 'data', 'config.json')
_config_lock = threading.Lock()

DEFAULT_CONFIG = {
    "CONFIRM_THRESHOLD": 0.55,
    "ENABLE_FACENET512": True,
    "ENABLE_INSIGHTFACE": True,
    "ENABLE_GHOSTFACENET": False,  # Disabled by default due to high error rate
    "ENABLE_VGGFACE": False
}


# ──────────────────────────────────────────────────────────────────────
# File-Based Config (Single-Tenant Fallback)
# ──────────────────────────────────────────────────────────────────────

def load_config():
    """Load config from the local JSON file (single-tenant mode)."""
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
    """Internal: write config dict to JSON file."""
    os.makedirs(os.path.dirname(CONFIG_PATH), exist_ok=True)
    current = {}
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, 'r') as f:
                current = json.load(f)
        except Exception:
            pass
    current.update(config_dict)
    with open(CONFIG_PATH, 'w') as f:
        json.dump(current, f, indent=4)
    return current


def save_config(config_dict):
    """Save config to the local JSON file (single-tenant mode)."""
    with _config_lock:
        return save_config_internal(config_dict)


def get_confirm_threshold():
    """Get the CONFIRM_THRESHOLD from local config (single-tenant mode)."""
    config = load_config()
    return float(config.get("CONFIRM_THRESHOLD", 0.55))


# ──────────────────────────────────────────────────────────────────────
# Database-Based Config (Multi-Tenant Mode)
# ──────────────────────────────────────────────────────────────────────

def get_org_config(org_id):
    """
    Load configuration for a specific organization from PostgreSQL.

    Falls back to file-based config if the database is not available.

    Args:
        org_id: Organization UUID string.

    Returns:
        dict with at least {"CONFIRM_THRESHOLD": float}
    """
    try:
        from database.db import is_db_available, get_db_session

        if not is_db_available() or org_id is None:
            return load_config()

        from database.models import Organization

        base_cfg = load_config()
        with get_db_session() as db:
            if db is None:
                return base_cfg
            org = db.query(Organization).filter_by(id=str(org_id)).first()
            if org is None:
                return base_cfg
            result = dict(base_cfg)
            result.update({
                "CONFIRM_THRESHOLD": org.confirm_threshold if org.confirm_threshold is not None else base_cfg.get("CONFIRM_THRESHOLD", 0.55),
                "org_name": org.name,
                "deployment_mode": org.deployment_mode.value if org.deployment_mode else "cloud",
                "plan_tier": org.plan_tier.value if org.plan_tier else "starter",
            })
            return result
    except Exception as e:
        logger.warning(f"Failed to load org config from DB: {e}. Falling back to file config.")
        return load_config()


def save_org_config(org_id, config_dict):
    """
    Save configuration for a specific organization to PostgreSQL.

    Currently only supports updating CONFIRM_THRESHOLD.

    Args:
        org_id: Organization UUID string.
        config_dict: Dict with config keys to update.

    Returns:
        dict with the updated config values.
    """
    try:
        from database.db import is_db_available, get_db_session

        if not is_db_available() or org_id is None:
            return save_config(config_dict)

        from database.models import Organization

        with get_db_session() as db:
            if db is None:
                return save_config(config_dict)
            org = db.query(Organization).filter_by(id=str(org_id)).first()
            if org is None:
                logger.warning(f"Org {org_id} not found, cannot save config.")
                return dict(DEFAULT_CONFIG)

            if "CONFIRM_THRESHOLD" in config_dict:
                threshold = float(config_dict["CONFIRM_THRESHOLD"])
                threshold = max(0.1, min(1.0, threshold))  # Clamp to valid range
                org.confirm_threshold = threshold

            # db.commit() is handled by the context manager

        return get_org_config(org_id)
    except Exception as e:
        logger.error(f"Failed to save org config to DB: {e}. Falling back to file config.")
        return save_config(config_dict)


def get_org_confirm_threshold(org_id=None):
    """
    Get the CONFIRM_THRESHOLD for a specific organization.

    Args:
        org_id: Organization UUID, or None for single-tenant mode.

    Returns:
        float: The confirmation threshold value.
    """
    if org_id is None:
        return get_confirm_threshold()
    config = get_org_config(org_id)
    return float(config.get("CONFIRM_THRESHOLD", DEFAULT_CONFIG["CONFIRM_THRESHOLD"]))
