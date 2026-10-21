"""
observability.py — Production Observability, Structured Logging, and Error Tracking.

Phase 7 features:
  1. Structured request logging with request_id, org_id, and endpoint context.
  2. Global error handler capturing all unhandled exceptions with full context.
  3. Internal health/uptime API endpoint (/api/internal/health).
"""

import os
import sys
import uuid
import time
import json
import logging
import traceback
from datetime import datetime, timezone
from flask import request, jsonify, g, Response

logger = logging.getLogger('rms-api')


class StructuredJsonFormatter(logging.Formatter):
    """Format log messages as JSON strings with request context."""

    def format(self, record):
        log_entry = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
        }

        # Inject context from Flask's g object if inside request context
        try:
            from flask import has_request_context
            if has_request_context():
                log_entry['request_id'] = getattr(g, 'request_id', None)
                log_entry['org_id'] = getattr(g, 'org_id', None)
                log_entry['endpoint'] = request.endpoint
                log_entry['method'] = request.method
                log_entry['path'] = request.path
                log_entry['remote_addr'] = request.remote_addr
        except Exception:
            pass

        if record.exc_info:
            log_entry['exception'] = self.formatException(record.exc_info)

        return json.dumps(log_entry)


def init_observability(app):
    """Configure structured logging, request tracking, and error handling for the app."""

    # 1. Configure Logger Handler with Structured Formatter
    json_formatter = StructuredJsonFormatter()
    for handler in logging.getLogger().handlers:
        handler.setFormatter(json_formatter)

    # 2. Before Request: Inject Request ID & Org ID context
    @app.before_request
    def set_request_context():
        # Read or generate X-Request-ID
        req_id = request.headers.get('X-Request-ID')
        if not req_id:
            req_id = f"req_{uuid.uuid4().hex[:12]}"
        g.request_id = req_id

        # Extract org_id if available
        g.org_id = None
        current_user = getattr(g, 'current_user', None)
        if current_user and isinstance(current_user, dict):
            g.org_id = current_user.get('org_id')

    # 3. After Request: Attach X-Request-ID to Response
    @app.after_request
    def attach_response_headers(response):
        if hasattr(g, 'request_id'):
            response.headers['X-Request-ID'] = g.request_id
        return response

    # 4. Global Error Handler for Unhandled Exceptions
    @app.errorhandler(Exception)
    def handle_unhandled_exception(e):
        req_id = getattr(g, 'request_id', 'unknown')
        org_id = getattr(g, 'org_id', None)
        
        err_msg = f"Unhandled Exception [{req_id}]: {str(e)}"
        logger.error(err_msg, exc_info=True)

        # Trigger Sentry if SDK is active
        try:
            import sentry_sdk
            sentry_sdk.capture_exception(e)
        except Exception:
            pass

        # Return standardized 500 response with request_id for support tracing
        response = jsonify({
            'error': 'Internal Server Error',
            'message': 'An unexpected error occurred. Please contact support with the request_id.',
            'request_id': req_id,
            'timestamp': datetime.now(timezone.utc).isoformat(),
        })
        response.status_code = 500

        # Ensure CORS headers are present on error responses too —
        # without them, browsers block the response entirely and show
        # misleading "CORS error" instead of the real 500 error.
        try:
            origin = request.headers.get('Origin', '')
            if origin:
                import os as _os
                frontend_url = _os.environ.get('FRONTEND_URL', '')
                is_allowed = (
                    origin.startswith('http://localhost:')
                    or origin.startswith('http://127.0.0.1:')
                    or origin.endswith('.vercel.app')
                    or (frontend_url and origin in frontend_url)
                )
                if is_allowed:
                    response.headers['Access-Control-Allow-Origin'] = origin
                    response.headers['Access-Control-Allow-Credentials'] = 'true'
        except Exception:
            pass

        return response

    # 5. Internal Health Monitoring Endpoint
    @app.route('/api/internal/health', methods=['GET'])
    def internal_health_check():
        return jsonify(get_system_health())


def get_system_health():
    """Evaluate system health metrics including DB, disk, and memory status."""
    status = 'healthy'
    checks = {}

    # Check Database Connection
    db_status = 'n/a'
    db_latency_ms = None
    try:
        from database.db import is_db_available, get_db_session
        if is_db_available():
            t0 = time.time()
            with get_db_session() as session:
                if session is not None:
                    session.execute("SELECT 1")
                    db_latency_ms = round((time.time() - t0) * 1000, 2)
                    db_status = 'connected'
                else:
                    db_status = 'disconnected'
                    status = 'degraded'
        else:
            db_status = 'single_tenant_mode'
    except Exception as e:
        db_status = f'error: {str(e)}'
        status = 'degraded'

    checks['database'] = {
        'status': db_status,
        'latency_ms': db_latency_ms,
    }

    # Check System Memory
    try:
        import psutil
        mem = psutil.virtual_memory()
        checks['memory'] = {
            'total_mb': round(mem.total / (1024 * 1024), 2),
            'available_mb': round(mem.available / (1024 * 1024), 2),
            'percent_used': mem.percent,
        }
        if mem.percent > 95:
            status = 'degraded'
    except ImportError:
        checks['memory'] = 'psutil_not_installed'

    # Check Disk Usage
    try:
        import shutil
        total, used, free = shutil.disk_usage(os.path.dirname(os.path.abspath(__file__)))
        percent_used = round((used / total) * 100, 1)
        checks['disk'] = {
            'total_gb': round(total / (1024**3), 2),
            'free_gb': round(free / (1024**3), 2),
            'percent_used': percent_used,
        }
        if percent_used > 95:
            status = 'degraded'
    except Exception:
        checks['disk'] = 'unavailable'

    return {
        'status': status,
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'checks': checks,
    }
