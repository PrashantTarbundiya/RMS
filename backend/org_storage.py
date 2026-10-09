"""
org_storage.py — Per-organization file path utilities.

Manages namespaced storage for multi-tenant data isolation.
Each organization gets its own:
  - encodings.pickle  (KNN embedding index)
  - feedback_log.json (correction audit trail)
  - dataset_cleaned/  (training images)

Directory layout:
  backend/data/orgs/{org_id}/encodings.pickle
  backend/data/orgs/{org_id}/feedback_log.json
  dataset_cleaned/orgs/{org_id}/{employee_name}/frontal/...

When org_id is None (single-tenant mode), paths fall back to the
original global locations for backward compatibility.
"""

import os
import pickle
import json
import logging

logger = logging.getLogger('rms-api')

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)

# Global fallback paths (single-tenant mode)
_GLOBAL_DATA_DIR = os.path.join(BACKEND_DIR, 'data')
_GLOBAL_ENCODINGS_PATH = os.path.join(_GLOBAL_DATA_DIR, 'encodings.pickle')
_GLOBAL_FEEDBACK_LOG_PATH = os.path.join(_GLOBAL_DATA_DIR, 'feedback_log.json')
_GLOBAL_CONFIG_PATH = os.path.join(_GLOBAL_DATA_DIR, 'config.json')
_GLOBAL_RECOGNITION_HISTORY_PATH = os.path.join(_GLOBAL_DATA_DIR, 'recognition_history.json')

# Global fallback paths for SOTA models
_GLOBAL_SOTA_DIR = os.path.join(BACKEND_DIR, 'models', 'sota_finetune')
_GLOBAL_SOTA_MODEL = os.path.join(_GLOBAL_SOTA_DIR, 'best_mobile_sideface.pth')
_GLOBAL_SOTA_CLASSES = os.path.join(_GLOBAL_SOTA_DIR, 'mobile_classes.txt')


def _get_org_data_dir(org_id):
    """Get the data directory for a specific organization."""
    return os.path.join(BACKEND_DIR, 'data', 'orgs', str(org_id))


def get_storage_dir():
    """Get the root storage directory (may be overridden by STORAGE_DIR env var)."""
    return os.environ.get('STORAGE_DIR', PROJECT_ROOT)


# ──────────────────────────────────────────────────────────────────────
# Path Resolvers
# ──────────────────────────────────────────────────────────────────────

def get_encodings_path(org_id=None, model_name="Facenet512"):
    """
    Get the path to the encodings file for a specific model.

    Args:
        org_id: Organization UUID string, or None for single-tenant mode.
        model_name: The name of the embedding model (e.g., Facenet512, GhostFaceNet)

    Returns:
        Absolute path to the org's encodings file.
    """
    filename = f'encodings_{model_name}.pickle' if model_name != "Facenet512" else 'encodings.pickle'
    
    if org_id is None or org_id == 'default-org':
        return os.path.join(_GLOBAL_DATA_DIR, filename)
        
    org_dir = _get_org_data_dir(org_id)
    os.makedirs(org_dir, exist_ok=True)
    return os.path.join(org_dir, filename)


def get_feedback_log_path(org_id=None):
    """Get path to the org's feedback_log.json."""
    if org_id is None or org_id == 'default-org':
        return _GLOBAL_FEEDBACK_LOG_PATH
    org_dir = _get_org_data_dir(org_id)
    os.makedirs(org_dir, exist_ok=True)
    return os.path.join(org_dir, 'feedback_log.json')


def get_config_path(org_id=None):
    """Get path to the org's config.json."""
    if org_id is None or org_id == 'default-org':
        return _GLOBAL_CONFIG_PATH
    org_dir = _get_org_data_dir(org_id)
    os.makedirs(org_dir, exist_ok=True)
    return os.path.join(org_dir, 'config.json')


def get_recognition_history_path(org_id=None):
    """Get path to the org's recognition_history.json."""
    if org_id is None or org_id == 'default-org':
        return _GLOBAL_RECOGNITION_HISTORY_PATH
    org_dir = _get_org_data_dir(org_id)
    os.makedirs(org_dir, exist_ok=True)
    return os.path.join(org_dir, 'recognition_history.json')


def get_dataset_cleaned_dir(org_id=None):
    """
    Get the dataset_cleaned directory for an organization.

    Args:
        org_id: Organization UUID, or None for global mode.

    Returns:
        Absolute path to the org's cleaned dataset directory.
    """
    storage = get_storage_dir()
    if org_id is None or org_id == 'default-org':
        return os.path.join(storage, 'dataset_cleaned')
    path = os.path.join(storage, 'dataset_cleaned', 'orgs', str(org_id))
    os.makedirs(path, exist_ok=True)
    return path


def get_raw_dataset_dir(org_id=None):
    """Get the raw dataset directory for an organization."""
    storage = get_storage_dir()
    if org_id is None or org_id == 'default-org':
        return os.path.join(storage, 'dataset')
    path = os.path.join(storage, 'dataset', 'orgs', str(org_id))
    os.makedirs(path, exist_ok=True)
    return path


def get_sota_model_path(org_id=None):
    """Get the path to the org's MobileNetV2 weights (.pth)."""
    if org_id is None or org_id == 'default-org':
        path = _GLOBAL_SOTA_MODEL
    else:
        path = os.path.join(_get_org_data_dir(org_id), 'sota', 'best_mobile_sideface.pth')
    
    os.makedirs(os.path.dirname(path), exist_ok=True)
    return path


def get_sota_classes_path(org_id=None):
    """Get the path to the org's mobile_classes.txt."""
    if org_id is None or org_id == 'default-org':
        path = _GLOBAL_SOTA_CLASSES
    else:
        path = os.path.join(_get_org_data_dir(org_id), 'sota', 'mobile_classes.txt')
    
    os.makedirs(os.path.dirname(path), exist_ok=True)
    return path


# ──────────────────────────────────────────────────────────────────────
# Encodings I/O
# ──────────────────────────────────────────────────────────────────────

def load_encodings(org_id=None, model_name="Facenet512"):
    """
    Load the KNN embeddings index for an organization.

    Returns:
        tuple: (encodings_list, names_list) or (None, None) if not found.
    """
    path = get_encodings_path(org_id, model_name=model_name)
    if not os.path.exists(path):
        return None, None
    try:
        with open(path, 'rb') as f:
            data = pickle.load(f)
        encodings = data.get('encodings', [])
        names = data.get('names', [])
        logger.info(f"Loaded {len(encodings)} encodings for model={model_name}, org={org_id or 'global'}")
        return encodings, names
    except Exception as e:
        logger.warning(f"Failed to load encodings for model={model_name}, org={org_id}: {e}")
        return None, None


def save_encodings(encodings, names, org_id=None, model_name="Facenet512"):
    """
    Save the KNN embeddings index for an organization.

    Args:
        encodings: List of embedding vectors.
        names: List of corresponding person names.
        org_id: Organization UUID, or None for global mode.
        model_name: The name of the embedding model (e.g., Facenet512, GhostFaceNet).
    """
    path = get_encodings_path(org_id, model_name=model_name)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    data = {'encodings': encodings, 'names': names}
    with open(path, 'wb') as f:
        pickle.dump(data, f)
    logger.info(f"Saved {len(encodings)} encodings for model={model_name}, org={org_id or 'global'}")


# ──────────────────────────────────────────────────────────────────────
# Org Directory Setup
# ──────────────────────────────────────────────────────────────────────

def initialize_org_storage(org_id):
    """
    Create all required directories for a new organization.
    Called during org registration.
    """
    dirs = [
        _get_org_data_dir(org_id),
        get_dataset_cleaned_dir(org_id),
        get_raw_dataset_dir(org_id),
    ]
    for d in dirs:
        os.makedirs(d, exist_ok=True)
    logger.info(f"Initialized storage directories for org={org_id}")


def delete_org_storage(org_id):
    """
    Delete all files and directories for an organization.
    Called when an org is permanently deleted.

    WARNING: This is irreversible and destroys all training data.
    """
    import shutil
    paths = [
        _get_org_data_dir(org_id),
        get_dataset_cleaned_dir(org_id),
        get_raw_dataset_dir(org_id),
    ]
    for path in paths:
        if os.path.exists(path):
            shutil.rmtree(path)
            logger.info(f"Deleted storage: {path}")
