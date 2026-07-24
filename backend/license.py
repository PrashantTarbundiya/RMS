"""
license.py — Offline license key verification for on-premise RMS Face AI installs.

License keys are JWT tokens signed with a shared HMAC secret.
For production, the secret should be set via the LICENSE_VERIFICATION_KEY env var.

Grace period behavior on expiry:
  - 0-14 days past expiry: WARNING state — system works, admin sees warning banner
  - 14-30 days past expiry: DEGRADED state — system works, all sessions see warning
  - 30+ days past expiry: EXPIRED state — new enrollments blocked, recognition still works
    (Never a hard lockout — we don't strand employees at the door)
"""

import os
import jwt
from datetime import datetime, timezone, timedelta
import json
import logging

logger = logging.getLogger('rms-license')

# For production: embed the public key or use a secure enclave.
LICENSE_SECRET = os.environ.get(
    'LICENSE_VERIFICATION_KEY',
    'rms-super-secret-license-key-for-offline'
)

# Grace period configuration
GRACE_WARNING_DAYS = 14   # Days 0-14: warning only
GRACE_DEGRADED_DAYS = 30  # Days 14-30: degraded (visible to all users)
# After 30 days: enrollments blocked, recognition still works


class LicenseStatus:
    """License validation result."""
    VALID = 'valid'
    WARNING = 'warning'       # Expired < 14 days
    DEGRADED = 'degraded'     # Expired 14-30 days
    EXPIRED = 'expired'       # Expired > 30 days (enrollments blocked)
    INVALID = 'invalid'       # Bad key
    MISSING = 'missing'       # No key file (trial mode)


def verify_license_key(license_str: str):
    """
    Verifies a cryptographic license key string.
    Returns (status: str, payload: dict, error_message: str, days_remaining: int)
    """
    try:
        # First try with expiry enforcement
        payload = jwt.decode(
            license_str,
            LICENSE_SECRET,
            algorithms=['HS256']
        )
        # Calculate days remaining
        exp = payload.get('exp', 0)
        now = datetime.now(timezone.utc).timestamp()
        days_remaining = int((exp - now) / 86400)

        return LicenseStatus.VALID, payload, None, days_remaining

    except jwt.ExpiredSignatureError:
        # Decode WITHOUT expiry check to get the grace period info
        try:
            payload = jwt.decode(
                license_str,
                LICENSE_SECRET,
                algorithms=['HS256'],
                options={'verify_exp': False}
            )
            exp = payload.get('exp', 0)
            now = datetime.now(timezone.utc).timestamp()
            days_expired = int((now - exp) / 86400)

            if days_expired <= GRACE_WARNING_DAYS:
                return (
                    LicenseStatus.WARNING, payload,
                    f"License expired {days_expired} day(s) ago. "
                    f"Please renew within {GRACE_WARNING_DAYS - days_expired} days.",
                    -days_expired
                )
            elif days_expired <= GRACE_DEGRADED_DAYS:
                return (
                    LicenseStatus.DEGRADED, payload,
                    f"License expired {days_expired} days ago. "
                    f"New enrollments will be blocked in "
                    f"{GRACE_DEGRADED_DAYS - days_expired} days. "
                    f"Contact sales immediately.",
                    -days_expired
                )
            else:
                return (
                    LicenseStatus.EXPIRED, payload,
                    f"License expired {days_expired} days ago. "
                    f"New employee enrollments are blocked. "
                    f"Existing recognition continues to work. "
                    f"Contact sales to renew.",
                    -days_expired
                )
        except Exception:
            return LicenseStatus.INVALID, None, "License has expired and cannot be read.", 0

    except jwt.InvalidTokenError as e:
        return LicenseStatus.INVALID, None, f"Invalid license key: {str(e)}", 0

    except Exception as e:
        return LicenseStatus.INVALID, None, f"License verification error: {str(e)}", 0


def enforce_local_license():
    """
    Reads license.key from the backend directory and validates it.

    Grace period behavior:
      - VALID/WARNING/DEGRADED: system starts, returns payload
      - EXPIRED: system starts, returns payload with enrollment_blocked=True
      - INVALID: raises RuntimeError (bad key = don't start)
      - MISSING: trial mode (no license file)

    Never does a hard lockout — recognition always works to avoid
    stranding employees at the door.
    """
    license_path = os.path.join(os.path.dirname(__file__), 'license.key')

    if not os.path.exists(license_path):
        logger.warning(
            "license.key not found in backend directory. "
            "Operating in trial/development mode."
        )
        return {
            'org_id': 'trial_org',
            'max_employees': 100,
            'license_status': LicenseStatus.MISSING,
            'enrollment_blocked': False,
        }

    with open(license_path, 'r') as f:
        license_str = f.read().strip()

    status, payload, error_msg, days_remaining = verify_license_key(license_str)

    if status == LicenseStatus.VALID:
        logger.info(
            f"License validated. Organization: {payload.get('org_id')}, "
            f"Max Employees: {payload.get('max_employees')}, "
            f"Days remaining: {days_remaining}"
        )
        payload['license_status'] = LicenseStatus.VALID
        payload['enrollment_blocked'] = False
        payload['days_remaining'] = days_remaining
        return payload

    elif status == LicenseStatus.WARNING:
        logger.warning(f"LICENSE WARNING: {error_msg}")
        payload['license_status'] = LicenseStatus.WARNING
        payload['license_warning'] = error_msg
        payload['enrollment_blocked'] = False
        payload['days_remaining'] = days_remaining
        return payload

    elif status == LicenseStatus.DEGRADED:
        logger.warning(f"LICENSE DEGRADED: {error_msg}")
        payload['license_status'] = LicenseStatus.DEGRADED
        payload['license_warning'] = error_msg
        payload['enrollment_blocked'] = False
        payload['days_remaining'] = days_remaining
        return payload

    elif status == LicenseStatus.EXPIRED:
        # Don't crash — let recognition continue, block enrollments
        logger.error(f"LICENSE EXPIRED: {error_msg}")
        payload['license_status'] = LicenseStatus.EXPIRED
        payload['license_warning'] = error_msg
        payload['enrollment_blocked'] = True
        payload['days_remaining'] = days_remaining
        return payload

    else:
        # INVALID: bad key is a real error — prevent startup
        raise RuntimeError(f"License Error: {error_msg}")


# ─── License Status for API/Frontend ────────────────────────────────

# Cache the license status so we don't re-read the file on every request
_cached_license = None
_cached_at = None
CACHE_TTL_SECONDS = 3600  # Re-validate every hour


def get_license_status():
    """
    Get the current license status. Cached for performance.
    Called periodically by the health check and frontend.
    """
    global _cached_license, _cached_at

    now = datetime.now(timezone.utc)
    if _cached_license and _cached_at:
        if (now - _cached_at).total_seconds() < CACHE_TTL_SECONDS:
            return _cached_license

    try:
        result = enforce_local_license()
        _cached_license = {
            'status': result.get('license_status', LicenseStatus.MISSING),
            'warning': result.get('license_warning'),
            'enrollment_blocked': result.get('enrollment_blocked', False),
            'days_remaining': result.get('days_remaining'),
            'org_id': result.get('org_id'),
            'max_employees': result.get('max_employees'),
        }
        _cached_at = now
    except RuntimeError as e:
        _cached_license = {
            'status': LicenseStatus.INVALID,
            'warning': str(e),
            'enrollment_blocked': True,
        }
        _cached_at = now

    return _cached_license
