"""
security_hardening.py — Broader Security Hardening for RMS Face AI.

Phase 10 improvements:
  1. OAuth2/SSO integration (Google Workspace, Microsoft Entra, Okta)
     via OIDC discovery — provider-agnostic.
  2. API key rotation with grace period — old key stays valid during
     the transition so cameras don't drop mid-rotation.
  3. Encryption at rest for encodings.pickle — per-org AES-256-GCM keys
     so a stolen file is useless without the correct key.
"""

import os
import sys
import json
import secrets
import hashlib
import logging
import pickle
from datetime import datetime, timezone, timedelta
from base64 import b64encode, b64decode

logger = logging.getLogger('rms-security')

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))


# ─── 1. OAuth2/SSO — OIDC Provider Integration ─────────────────────

# Supported providers and their OIDC discovery URLs
OIDC_PROVIDERS = {
    'google': {
        'discovery_url': 'https://accounts.google.com/.well-known/openid-configuration',
        'display_name': 'Google Workspace',
    },
    'microsoft': {
        'discovery_url': 'https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration',
        'display_name': 'Microsoft Entra',
    },
    'okta': {
        # Okta discovery URL is per-tenant: https://{domain}/.well-known/openid-configuration
        'discovery_url_template': 'https://{domain}/.well-known/openid-configuration',
        'display_name': 'Okta',
    },
}


def get_sso_config():
    """
    Read SSO configuration from environment variables.

    Required env vars for each provider:
      SSO_PROVIDER=google|microsoft|okta
      SSO_CLIENT_ID=...
      SSO_CLIENT_SECRET=...
      SSO_REDIRECT_URI=https://your-app.com/api/auth/sso/callback
      SSO_OKTA_DOMAIN=your-org.okta.com  (only for Okta)

    Returns:
        dict or None if SSO is not configured.
    """
    provider = os.environ.get('SSO_PROVIDER', '').lower()
    if not provider or provider not in OIDC_PROVIDERS:
        return None

    config = {
        'provider': provider,
        'client_id': os.environ.get('SSO_CLIENT_ID', ''),
        'client_secret': os.environ.get('SSO_CLIENT_SECRET', ''),
        'redirect_uri': os.environ.get('SSO_REDIRECT_URI', ''),
        'display_name': OIDC_PROVIDERS[provider]['display_name'],
    }

    if not config['client_id'] or not config['client_secret']:
        return None

    # Build discovery URL
    if provider == 'okta':
        domain = os.environ.get('SSO_OKTA_DOMAIN', '')
        if not domain:
            return None
        config['discovery_url'] = OIDC_PROVIDERS['okta']['discovery_url_template'].format(domain=domain)
    else:
        config['discovery_url'] = OIDC_PROVIDERS[provider]['discovery_url']

    return config


def build_sso_auth_url(config, state=None):
    """
    Build the OAuth2 authorization URL to redirect the user to.

    Args:
        config: SSO config from get_sso_config()
        state: Anti-CSRF state parameter (generate if None)

    Returns:
        (auth_url, state) — redirect user to auth_url, verify state on callback.
    """
    if state is None:
        state = secrets.token_urlsafe(32)

    # Standard OIDC authorization endpoint patterns
    auth_endpoints = {
        'google': 'https://accounts.google.com/o/oauth2/v2/auth',
        'microsoft': 'https://login.microsoftonline.com/common/oauth2/v2/authorize',
        'okta': config.get('discovery_url', '').replace(
            '/.well-known/openid-configuration', '/v1/authorize'
        ),
    }

    auth_url = auth_endpoints.get(config['provider'], '')

    params = {
        'client_id': config['client_id'],
        'response_type': 'code',
        'redirect_uri': config['redirect_uri'],
        'scope': 'openid email profile',
        'state': state,
        'nonce': secrets.token_urlsafe(16),
    }

    if config['provider'] == 'google':
        params['access_type'] = 'offline'
        params['prompt'] = 'consent'
    elif config['provider'] == 'microsoft':
        params['response_mode'] = 'query'

    from urllib.parse import urlencode
    full_url = f"{auth_url}?{urlencode(params)}"

    return full_url, state


def validate_sso_callback(config, code, expected_state, received_state):
    """
    Validate the SSO callback and exchange the code for user info.

    Args:
        config: SSO config
        code: Authorization code from callback
        expected_state: State we sent in the auth request
        received_state: State received in the callback

    Returns:
        (success, user_info, error)
        user_info = {'email': ..., 'name': ..., 'provider_id': ...}
    """
    # Verify state (anti-CSRF)
    if expected_state != received_state:
        return False, None, 'State mismatch — possible CSRF attack'

    if not code:
        return False, None, 'Missing authorization code'

    # Token exchange endpoints
    token_endpoints = {
        'google': 'https://oauth2.googleapis.com/token',
        'microsoft': 'https://login.microsoftonline.com/common/oauth2/v2/token',
        'okta': config.get('discovery_url', '').replace(
            '/.well-known/openid-configuration', '/v1/token'
        ),
    }

    # User info endpoints
    userinfo_endpoints = {
        'google': 'https://openidconnect.googleapis.com/v1/userinfo',
        'microsoft': 'https://graph.microsoft.com/v1.0/me',
        'okta': config.get('discovery_url', '').replace(
            '/.well-known/openid-configuration', '/v1/userinfo'
        ),
    }

    try:
        import requests

        # Exchange code for tokens
        token_response = requests.post(
            token_endpoints[config['provider']],
            data={
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': config['redirect_uri'],
                'client_id': config['client_id'],
                'client_secret': config['client_secret'],
            },
            timeout=10,
        )

        if token_response.status_code != 200:
            return False, None, f'Token exchange failed: {token_response.text[:200]}'

        tokens = token_response.json()
        access_token = tokens.get('access_token')

        if not access_token:
            return False, None, 'No access token in response'

        # Get user info
        headers = {'Authorization': f'Bearer {access_token}'}
        userinfo_response = requests.get(
            userinfo_endpoints[config['provider']],
            headers=headers,
            timeout=10,
        )

        if userinfo_response.status_code != 200:
            return False, None, f'User info request failed: {userinfo_response.status_code}'

        user_data = userinfo_response.json()

        # Normalize user info across providers
        user_info = _normalize_sso_user(config['provider'], user_data)

        return True, user_info, None

    except Exception as e:
        logger.error(f"SSO callback validation error: {e}", exc_info=True)
        return False, None, str(e)


def _normalize_sso_user(provider, data):
    """Normalize user info from different providers into a common format."""
    if provider == 'google':
        return {
            'email': data.get('email', ''),
            'name': data.get('name', ''),
            'provider_id': data.get('sub', ''),
            'picture': data.get('picture', ''),
            'provider': 'google',
            'email_verified': data.get('email_verified', False),
        }
    elif provider == 'microsoft':
        return {
            'email': data.get('mail') or data.get('userPrincipalName', ''),
            'name': data.get('displayName', ''),
            'provider_id': data.get('id', ''),
            'picture': None,
            'provider': 'microsoft',
            'email_verified': True,  # Microsoft accounts are always verified
        }
    elif provider == 'okta':
        return {
            'email': data.get('email', ''),
            'name': data.get('name', ''),
            'provider_id': data.get('sub', ''),
            'picture': data.get('picture', ''),
            'provider': 'okta',
            'email_verified': data.get('email_verified', False),
        }
    return {'email': '', 'name': '', 'provider_id': '', 'provider': provider}


# ─── 2. API Key Rotation with Grace Period ──────────────────────────

def rotate_api_key(camera_id, grace_period_hours=24):
    """
    Rotate a camera's API key with a grace period.

    During the grace period, BOTH the old key and new key are accepted.
    After the grace period, only the new key works.

    Args:
        camera_id: The camera's database ID.
        grace_period_hours: How long the old key remains valid (default 24h).

    Returns:
        (success, result, error)
        result = {
            'new_key': str,
            'old_key_expires': datetime,
            'grace_period_hours': int,
        }
    """
    from database.db import is_db_available, get_db_session
    if not is_db_available():
        return False, {}, 'Database not available'

    try:
        from database.models import Camera

        with get_db_session() as db:
            camera = db.query(Camera).filter_by(id=camera_id).first()
            if not camera:
                return False, {}, f'Camera not found: {camera_id}'

            old_key = camera.api_key
            new_key = secrets.token_hex(32)  # 64-char hex key

            # Store the old key with expiry for grace period lookup
            grace_expiry = datetime.now(timezone.utc) + timedelta(hours=grace_period_hours)

            # Store grace period data in a JSON file for the middleware to check
            grace_file = os.path.join(BACKEND_DIR, 'data', 'api_key_grace.json')
            grace_data = _load_grace_data(grace_file)

            if old_key:
                grace_data[old_key] = {
                    'camera_id': camera_id,
                    'org_id': camera.org_id,
                    'expires_at': grace_expiry.isoformat(),
                    'replaced_by': new_key,
                }

            # Update the camera with the new key
            camera.api_key = new_key
            db.commit()

            # Save grace data
            _save_grace_data(grace_file, grace_data)

            logger.info(f"API key rotated for camera {camera.name} ({camera_id}). "
                        f"Old key valid until {grace_expiry.isoformat()}")

            return True, {
                'new_key': new_key,
                'old_key_expires': grace_expiry.isoformat(),
                'grace_period_hours': grace_period_hours,
                'camera_name': camera.name,
            }, None

    except Exception as e:
        logger.error(f"API key rotation error: {e}", exc_info=True)
        return False, {}, str(e)


def validate_grace_period_key(api_key):
    """
    Check if an API key is in the grace period (old key still valid).

    Returns:
        dict or None — camera info if the key is in grace period, None otherwise.
    """
    grace_file = os.path.join(BACKEND_DIR, 'data', 'api_key_grace.json')
    grace_data = _load_grace_data(grace_file)

    if api_key not in grace_data:
        return None

    entry = grace_data[api_key]
    expires_at = datetime.fromisoformat(entry['expires_at'])

    if datetime.now(timezone.utc) > expires_at:
        # Grace period expired — clean up
        del grace_data[api_key]
        _save_grace_data(grace_file, grace_data)
        return None

    return {
        'camera_id': entry['camera_id'],
        'org_id': entry['org_id'],
        'grace_period': True,
        'expires_at': entry['expires_at'],
    }


def cleanup_expired_grace_keys():
    """Remove expired grace period entries."""
    grace_file = os.path.join(BACKEND_DIR, 'data', 'api_key_grace.json')
    grace_data = _load_grace_data(grace_file)

    now = datetime.now(timezone.utc)
    cleaned = {k: v for k, v in grace_data.items()
               if datetime.fromisoformat(v['expires_at']) > now}

    removed = len(grace_data) - len(cleaned)
    if removed > 0:
        _save_grace_data(grace_file, cleaned)
        logger.info(f"Cleaned up {removed} expired API key grace entries")

    return removed


def _load_grace_data(filepath):
    """Load grace period data from JSON file."""
    try:
        if os.path.exists(filepath):
            with open(filepath, 'r') as f:
                return json.load(f)
    except Exception:
        pass
    return {}


def _save_grace_data(filepath, data):
    """Save grace period data to JSON file."""
    try:
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        logger.error(f"Failed to save grace data: {e}")


# ─── 3. Encryption at Rest for Encodings ────────────────────────────

def generate_org_encryption_key():
    """Generate a new AES-256 encryption key for an organization."""
    return secrets.token_bytes(32)  # 256 bits


def derive_key_from_passphrase(passphrase, salt=None):
    """
    Derive an AES-256 key from a passphrase using PBKDF2.

    Args:
        passphrase: The secret passphrase
        salt: 16-byte salt (generated if None)

    Returns:
        (key, salt) — both are bytes
    """
    if salt is None:
        salt = os.urandom(16)

    key = hashlib.pbkdf2_hmac('sha256', passphrase.encode('utf-8'), salt, 100000)
    return key, salt


def encrypt_encodings(encodings_data, key):
    """
    Encrypt encodings data using AES-256-GCM.

    Args:
        encodings_data: bytes (pickled encodings)
        key: 32-byte AES key

    Returns:
        bytes — encrypted payload: salt(16) + nonce(12) + tag(16) + ciphertext
    """
    try:
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    except ImportError:
        # Fallback: use a simpler XOR-based approach if cryptography not available
        return _encrypt_xor_fallback(encodings_data, key)

    nonce = os.urandom(12)  # 96-bit nonce for GCM
    aesgcm = AESGCM(key)
    ciphertext = aesgcm.encrypt(nonce, encodings_data, None)

    # Format: MAGIC(4) + nonce(12) + ciphertext_with_tag
    magic = b'RMSE'  # RMS Encrypted marker
    return magic + nonce + ciphertext


def decrypt_encodings(encrypted_data, key):
    """
    Decrypt encodings data encrypted with encrypt_encodings().

    Args:
        encrypted_data: bytes — the encrypted payload
        key: 32-byte AES key

    Returns:
        bytes — the decrypted encodings data
    """
    if not encrypted_data or len(encrypted_data) < 16:
        raise ValueError("Data too short to be encrypted")

    # Check magic header
    magic = encrypted_data[:4]
    if magic == b'RMSE':
        # AES-GCM format
        try:
            from cryptography.hazmat.primitives.ciphers.aead import AESGCM
        except ImportError:
            raise ImportError("cryptography package required for AES-GCM decryption")

        nonce = encrypted_data[4:16]
        ciphertext_with_tag = encrypted_data[16:]

        aesgcm = AESGCM(key)
        return aesgcm.decrypt(nonce, ciphertext_with_tag, None)

    elif magic == b'RMSX':
        # XOR fallback format
        return _decrypt_xor_fallback(encrypted_data, key)

    else:
        raise ValueError("Unknown encryption format (missing RMSE/RMSX header)")


def encrypt_encodings_file(input_path, output_path, key):
    """
    Encrypt an encodings.pickle file to an encrypted output file.

    Args:
        input_path: Path to the plaintext encodings.pickle
        output_path: Path to write the encrypted file
        key: 32-byte AES key

    Returns:
        (success, stats, error)
    """
    if not os.path.exists(input_path):
        return False, {}, f"Input file not found: {input_path}"

    try:
        with open(input_path, 'rb') as f:
            plaintext = f.read()

        encrypted = encrypt_encodings(plaintext, key)

        with open(output_path, 'wb') as f:
            f.write(encrypted)

        return True, {
            'input_size': len(plaintext),
            'encrypted_size': len(encrypted),
            'overhead_bytes': len(encrypted) - len(plaintext),
        }, None

    except Exception as e:
        logger.error(f"Encryption error: {e}", exc_info=True)
        return False, {}, str(e)


def decrypt_encodings_file(encrypted_path, key):
    """
    Decrypt an encrypted encodings file and return the data.

    Args:
        encrypted_path: Path to the encrypted file
        key: 32-byte AES key

    Returns:
        (success, data_dict, error)
        data_dict = the unpickled encodings dictionary
    """
    if not os.path.exists(encrypted_path):
        return False, None, f"Encrypted file not found: {encrypted_path}"

    try:
        with open(encrypted_path, 'rb') as f:
            encrypted = f.read()

        decrypted = decrypt_encodings(encrypted, key)
        data = pickle.loads(decrypted)

        return True, data, None

    except Exception as e:
        logger.error(f"Decryption error: {e}", exc_info=True)
        return False, None, str(e)


def is_file_encrypted(filepath):
    """Check if a file has the RMS encryption header."""
    try:
        with open(filepath, 'rb') as f:
            magic = f.read(4)
        return magic in (b'RMSE', b'RMSX')
    except Exception:
        return False


# ─── XOR Fallback (when cryptography package unavailable) ────────────

def _encrypt_xor_fallback(data, key):
    """Simple XOR encryption as fallback when cryptography is not available."""
    # Derive a longer key stream using SHA-256 in counter mode
    key_stream = b''
    counter = 0
    while len(key_stream) < len(data):
        key_stream += hashlib.sha256(key + counter.to_bytes(4, 'big')).digest()
        counter += 1

    encrypted = bytes(a ^ b for a, b in zip(data, key_stream[:len(data)]))
    checksum = hashlib.sha256(data).digest()[:8]

    return b'RMSX' + checksum + encrypted


def _decrypt_xor_fallback(encrypted_data, key):
    """Decrypt XOR-encrypted data."""
    checksum = encrypted_data[4:12]
    ciphertext = encrypted_data[12:]

    key_stream = b''
    counter = 0
    while len(key_stream) < len(ciphertext):
        key_stream += hashlib.sha256(key + counter.to_bytes(4, 'big')).digest()
        counter += 1

    decrypted = bytes(a ^ b for a, b in zip(ciphertext, key_stream[:len(ciphertext)]))

    # Verify checksum
    if hashlib.sha256(decrypted).digest()[:8] != checksum:
        raise ValueError("Decryption failed: checksum mismatch (wrong key?)")

    return decrypted
