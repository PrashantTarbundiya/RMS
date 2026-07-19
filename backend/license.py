import os
import jwt
from datetime import datetime, timezone
import json
import logging

logger = logging.getLogger('rms-license')

# For a production scenario, you would embed the public key into the source code 
# or use a secure enclave. For this prototype, we'll use a shared secret or env var.
LICENSE_SECRET = os.environ.get('LICENSE_VERIFICATION_KEY', 'rms-super-secret-license-key-for-offline')

def verify_license_key(license_str: str):
    """
    Verifies a cryptographic license key string.
    Returns (is_valid: bool, payload: dict, error_message: str)
    """
    try:
        # Decode and verify signature & expiration automatically
        payload = jwt.decode(
            license_str, 
            LICENSE_SECRET, 
            algorithms=['HS256']
        )
        return True, payload, None
    except jwt.ExpiredSignatureError:
        return False, None, "License has expired. Please contact sales."
    except jwt.InvalidTokenError as e:
        return False, None, f"Invalid license key: {str(e)}"
    except Exception as e:
        return False, None, f"License verification error: {str(e)}"


def enforce_local_license():
    """
    Reads license.key from the backend directory and checks limits.
    Raises Exception if the server should not start.
    """
    license_path = os.path.join(os.path.dirname(__file__), 'license.key')
    
    if not os.path.exists(license_path):
        logger.warning("license.key not found in backend directory. Operating in trial/development mode.")
        return {'org_id': 'trial_org', 'max_employees': 9999}
        
    with open(license_path, 'r') as f:
        license_str = f.read().strip()
        
    is_valid, payload, error_msg = verify_license_key(license_str)
    
    if not is_valid:
        raise RuntimeError(f"License Error: {error_msg}")
        
    logger.info(f"Offline License Validated. Organization: {payload.get('org_id')}, Max Employees: {payload.get('max_employees')}")
    return payload
