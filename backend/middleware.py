"""
middleware.py — Flask decorators for authentication and authorization.

Provides three decorators that form the security enforcement layer:

  @require_auth
    Extracts the JWT from the Authorization header, validates it,
    and injects the authenticated user's identity into Flask's `g` object.

  @require_role(*roles)
    Checks that the authenticated user's role is in the allowed set.

  @inject_org_id
    Pulls org_id from g.current_user and passes it as a keyword argument
    to the route function. This is the SINGLE enforcement point —
    no route should ever trust an org_id from query params or request body.

Dual-mode design:
  When DATABASE_URL is not set, @require_auth is a no-op passthrough
  (single-tenant mode with no auth). The org_id will be None, and all
  downstream functions fall back to global file-based storage.
"""

import functools
import logging
from flask import request, jsonify, g

logger = logging.getLogger('rms-api')

# Role hierarchy (higher index = more privileged)
_ROLE_HIERARCHY = {
    'kiosk': 0,
    'viewer': 1,
    'manager': 2,
    'org_admin': 3,
    'platform_owner': 4,
}


def _is_auth_enabled():
    """Check if database/auth is available."""
    try:
        from database.db import is_db_available
        return is_db_available()
    except ImportError:
        return False


def require_auth(f):
    """
    Decorator: Require a valid JWT access token in the Authorization header.

    On success, sets:
      g.current_user = {
          'user_id': str,
          'org_id': str,
          'role': str,
      }

    On failure, returns 401 JSON response.

    In single-tenant mode (no DATABASE_URL), this is a no-op passthrough
    that sets g.current_user with org_id=None.
    """
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        # Single-tenant mode: skip auth entirely
        if not _is_auth_enabled():
            g.current_user = {
                'user_id': None,
                'org_id': None,
                'role': 'org_admin',  # Full access in single-tenant mode
            }
            return f(*args, **kwargs)

        # Extract token from Authorization header or query parameter
        token = None
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]
        else:
            token = request.args.get('token')

        if not token:
            return jsonify({'error': 'Missing or invalid authentication token. Expected Bearer header or token query parameter.'}), 401

        # Decode and validate
        from auth import decode_token
        payload = decode_token(token)
        if payload is None:
            return jsonify({'error': 'Invalid or expired token. Please log in again.'}), 401

        if payload.get('type') != 'access':
            return jsonify({'error': 'Invalid token type. Use an access token, not a refresh token.'}), 401

        # Inject user identity into Flask's request context
        g.current_user = {
            'user_id': payload.get('sub'),
            'org_id': payload.get('org_id'),
            'role': payload.get('role', 'viewer'),
        }

        return f(*args, **kwargs)

    return decorated


def require_role(*allowed_roles):
    """
    Decorator: Require the authenticated user to have one of the specified roles.

    Uses a role hierarchy — a platform_owner can access anything an org_admin can, etc.

    Usage:
        @app.route('/api/admin-only')
        @require_auth
        @require_role('org_admin', 'platform_owner')
        def admin_endpoint():
            ...

    Args:
        *allowed_roles: Role strings that are permitted (e.g., 'org_admin', 'manager').
    """
    def decorator(f):
        @functools.wraps(f)
        def decorated(*args, **kwargs):
            user = getattr(g, 'current_user', None)
            if user is None:
                return jsonify({'error': 'Authentication required.'}), 401

            user_role = user.get('role', 'viewer')

            # Check if user's role is in the allowed list OR is more privileged
            user_level = _ROLE_HIERARCHY.get(user_role, 0)
            min_required_level = min(_ROLE_HIERARCHY.get(r, 99) for r in allowed_roles)

            if user_level >= min_required_level:
                return f(*args, **kwargs)

            return jsonify({
                'error': f'Insufficient permissions. Required: {", ".join(allowed_roles)}. Your role: {user_role}.'
            }), 403

        return decorated
    return decorator


def inject_org_id(f):
    """
    Decorator: Extract org_id from g.current_user and pass it as a
    keyword argument to the route function.

    This is the SINGLE enforcement point for tenant isolation.
    Never trust an org_id from query params or request body.

    The route function must accept an `org_id` keyword argument:

        @app.route('/api/persons')
        @require_auth
        @inject_org_id
        def get_persons(org_id=None):
            # org_id is guaranteed to be the authenticated user's org
            ...
    """
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        user = getattr(g, 'current_user', None)
        org_id = user.get('org_id') if user else None
        kwargs['org_id'] = org_id
        return f(*args, **kwargs)

    return decorated


def get_current_org_id():
    """
    Utility: Get the current request's org_id from g.current_user.

    For use in non-decorated helper functions that need the org context.

    Returns:
        str or None: The org_id of the authenticated user.
    """
    user = getattr(g, 'current_user', None)
    if user is None:
        return None
    return user.get('org_id')


def get_current_user_id():
    """Utility: Get the current request's user_id."""
    user = getattr(g, 'current_user', None)
    if user is None:
        return None
    return user.get('user_id')
