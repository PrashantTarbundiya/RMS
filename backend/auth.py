"""
auth.py — Authentication utilities for JWT token management and password hashing.

Provides:
  - Password hashing/verification via bcrypt
  - JWT access token creation/validation (short-lived, 15 min)
  - JWT refresh token creation/validation (long-lived, 7 days)

Tokens carry: user_id, org_id, role — enough for the middleware to
enforce RBAC without a database query on every request.
"""

import os
import logging
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

logger = logging.getLogger('rms-api')

# ──────────────────────────────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────────────────────────────

JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'dev-jwt-secret-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_ACCESS_TOKEN_EXPIRES = timedelta(
    minutes=int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES_MINUTES', '15'))
)
JWT_REFRESH_TOKEN_EXPIRES = timedelta(
    days=int(os.environ.get('JWT_REFRESH_TOKEN_EXPIRES_DAYS', '7'))
)


# ──────────────────────────────────────────────────────────────────────
# Password Hashing
# ──────────────────────────────────────────────────────────────────────

def hash_password(plain_password):
    """
    Hash a plain-text password using bcrypt.

    Args:
        plain_password: The raw password string.

    Returns:
        str: The bcrypt hash (safe to store in the database).
    """
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(plain_password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(plain_password, hashed_password):
    """
    Verify a plain-text password against a bcrypt hash.

    Args:
        plain_password: The raw password to check.
        hashed_password: The stored bcrypt hash.

    Returns:
        bool: True if the password matches.
    """
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    except Exception as e:
        logger.warning(f"Password verification error: {e}")
        return False


# ──────────────────────────────────────────────────────────────────────
# JWT Token Creation
# ──────────────────────────────────────────────────────────────────────

def create_access_token(user_id, org_id, role, extra_claims=None):
    """
    Create a short-lived JWT access token.

    The payload contains everything the middleware needs to authorize
    a request without hitting the database:
      - sub (user_id)
      - org_id
      - role
      - exp (expiration timestamp)
      - iat (issued-at timestamp)
      - type ("access")

    Args:
        user_id: UUID string of the authenticated user.
        org_id: UUID string of the user's organization.
        role: UserRole enum value (e.g., "org_admin").
        extra_claims: Optional dict of additional claims.

    Returns:
        str: Encoded JWT string.
    """
    now = datetime.now(timezone.utc)
    payload = {
        'sub': str(user_id),
        'org_id': str(org_id),
        'role': str(role.value if hasattr(role, 'value') else role),
        'type': 'access',
        'iat': now,
        'exp': now + JWT_ACCESS_TOKEN_EXPIRES,
    }
    if extra_claims:
        payload.update(extra_claims)

    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id):
    """
    Create a long-lived JWT refresh token.

    Refresh tokens only carry the user_id — the full user profile
    is re-fetched from the database during token refresh to ensure
    role/org changes are picked up.

    Args:
        user_id: UUID string of the authenticated user.

    Returns:
        str: Encoded JWT string.
    """
    now = datetime.now(timezone.utc)
    payload = {
        'sub': str(user_id),
        'type': 'refresh',
        'iat': now,
        'exp': now + JWT_REFRESH_TOKEN_EXPIRES,
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


# ──────────────────────────────────────────────────────────────────────
# JWT Token Decoding
# ──────────────────────────────────────────────────────────────────────

def decode_token(token):
    """
    Decode and validate a JWT token.

    Args:
        token: The raw JWT string (without "Bearer " prefix).

    Returns:
        dict: The decoded payload, or None if invalid/expired.
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        logger.debug("JWT token expired.")
        return None
    except jwt.InvalidTokenError as e:
        logger.debug(f"Invalid JWT token: {e}")
        return None
