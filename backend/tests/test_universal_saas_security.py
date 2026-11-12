"""
test_universal_saas_security.py — Regression & Verification Suite for Universal SaaS Security Hardening.

Empirically tests:
1. Critical Auth Bypass remediation on require_api_key_or_auth (/api/predict)
2. Path Traversal defense on person photo endpoints
3. Cross-Tenant IDOR defense on organization export download
4. Privilege escalation defense on platform backup download
5. CORS domain origin whitelist & rejection of arbitrary external domains
6. Universal HTTP Security Headers injection
7. Strict file upload extension & MIME validation
8. Production 500 error masking
"""

import unittest
import os
import json
import sys
from unittest.mock import patch
from werkzeug.datastructures import FileStorage
from io import BytesIO

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from server import app, is_allowed_origin, _allowed_file, handle_exception
from middleware import require_api_key_or_auth


class TestUniversalSaaSSecurity(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        self.client = app.test_client()

    # ─── 1. Auth Bypass Prevention ──────────────────────────────────────────

    def test_require_api_key_or_auth_rejects_unauthenticated(self):
        """Verify that require_api_key_or_auth returns 401 when no key or token is provided."""
        dummy_endpoint = require_api_key_or_auth(lambda: ('OK', 200))

        with app.test_request_context('/api/predict', method='POST'):
            with patch.dict(os.environ, {'RMS_ALLOW_DEV_ANON': '0', 'FLASK_ENV': 'production'}):
                with patch('middleware._is_auth_enabled', return_value=True):
                    response, code = dummy_endpoint()
                    self.assertEqual(code, 401)
                    data = json.loads(response.get_data(as_text=True))
                    self.assertEqual(data.get('code'), 'AUTH_REQUIRED')

    def test_require_api_key_or_auth_rejects_single_tenant_token_in_multi_tenant(self):
        """Verify single-tenant-token is rejected in production multi-tenant mode."""
        dummy_endpoint = require_api_key_or_auth(lambda: ('OK', 200))

        with app.test_request_context('/api/predict', method='POST', headers={'Authorization': 'Bearer single-tenant-token'}):
            with patch.dict(os.environ, {'RMS_ALLOW_DEV_ANON': '0', 'FLASK_ENV': 'production'}):
                with patch('middleware._is_auth_enabled', return_value=True):
                    response, code = dummy_endpoint()
                    self.assertEqual(code, 401)
                    data = json.loads(response.get_data(as_text=True))
                    self.assertEqual(data.get('code'), 'INVALID_TOKEN')

    # ─── 2. Path Traversal Prevention ────────────────────────────────────────

    def test_get_person_photo_path_traversal_rejected(self):
        """Verify that directory traversal attempts are rejected safely (400 or 404)."""
        with patch('auth.decode_token', return_value={'sub': 'u1', 'org_id': 'org-1', 'role': 'viewer', 'type': 'access'}):
            headers = {'Authorization': 'Bearer test-token'}
            
            # Test double dot in URL path - blocked by router or parameter check
            res1 = self.client.get('/api/persons/Shivam/photos/..%2f..%2f/secret.txt', headers=headers)
            self.assertIn(res1.status_code, (400, 404))

            # Test double dot parameter
            res2 = self.client.get('/api/persons/Shivam/photos/frontal/..%2fconfig.json', headers=headers)
            self.assertIn(res2.status_code, (400, 404))

    # ─── 3. Cross-Tenant IDOR Defense on Export ──────────────────────────────

    def test_download_export_tenant_isolation(self):
        """Verify an org admin cannot download an export from another tenant."""
        with patch('auth.decode_token', return_value={'sub': 'admin-b', 'org_id': 'org-tenant-b-1234', 'role': 'org_admin', 'type': 'access'}):
            headers = {'Authorization': 'Bearer token-b'}
            
            # Attempt to download Tenant A's export
            foreign_filename = "org_export_foreign12_20261112_120000.zip"
            res = self.client.get(f'/api/backup/download-export/{foreign_filename}', headers=headers)
            
            self.assertEqual(res.status_code, 403)
            data = res.get_json()
            self.assertIn('Access denied', data.get('error', ''))

    # ─── 4. Privilege Escalation Defense on System Backup ─────────────────────

    def test_download_backup_requires_platform_owner(self):
        """Verify an org_admin cannot download platform-wide backups."""
        with patch('auth.decode_token', return_value={'sub': 'admin-b', 'org_id': 'org-b', 'role': 'org_admin', 'type': 'access'}):
            headers = {'Authorization': 'Bearer token-b'}
            res = self.client.get('/api/backup/download/rms_backup_20261112.zip', headers=headers)
            
            # Must be rejected because platform_owner is required
            self.assertEqual(res.status_code, 403)

    # ─── 5. CORS Domain Whitelist ─────────────────────────────────────────────

    def test_cors_origin_validation(self):
        """Verify that arbitrary third-party Vercel apps are rejected, while official/localhost are allowed."""
        # Localhost should be allowed
        self.assertTrue(is_allowed_origin("http://localhost:5173"))
        self.assertTrue(is_allowed_origin("http://127.0.0.1:3000"))

        # Official AuraPass domains
        self.assertTrue(is_allowed_origin("https://aurapass.org"))
        self.assertTrue(is_allowed_origin("https://aurapass-enterprise.vercel.app"))

        # Arbitrary malicious Vercel tenant should be REJECTED
        self.assertFalse(is_allowed_origin("https://attacker-app.vercel.app"))
        self.assertFalse(is_allowed_origin("https://evil-phish.vercel.app"))
        self.assertFalse(is_allowed_origin("https://aurapass.org.attacker.com"))

    # ─── 6. Universal HTTP Security Headers ───────────────────────────────────

    def test_http_security_headers_injected(self):
        """Verify standard OWASP defense-in-depth security headers on responses."""
        res = self.client.get('/api/health')
        self.assertEqual(res.headers.get("X-Content-Type-Options"), "nosniff")
        self.assertEqual(res.headers.get("X-Frame-Options"), "DENY")
        self.assertEqual(res.headers.get("Referrer-Policy"), "strict-origin-when-cross-origin")

    # ─── 7. File Upload Validation ────────────────────────────────────────────

    def test_allowed_file_validation(self):
        """Verify file upload extension check cannot be bypassed with spoofed MIME."""
        # Legitimate images with valid binary magic bytes
        legit_jpg = FileStorage(stream=BytesIO(b"\xff\xd8\xff\xe0" + b"fake data"), filename="face.jpg", content_type="image/jpeg")
        self.assertTrue(_allowed_file(legit_jpg))

        legit_png = FileStorage(stream=BytesIO(b"\x89PNG\r\n\x1a\n" + b"fake data"), filename="photo.png", content_type="image/png")
        self.assertTrue(_allowed_file(legit_png))

        # Malicious file with spoofed MIME type — MUST be rejected
        malicious_php = FileStorage(stream=BytesIO(b"<?php echo 1;"), filename="shell.php", content_type="image/jpeg")
        self.assertFalse(_allowed_file(malicious_php))

        malicious_py = FileStorage(stream=BytesIO(b"import os"), filename="backdoor.py", content_type="image/png")
        self.assertFalse(_allowed_file(malicious_py))

        malicious_html = FileStorage(stream=BytesIO(b"<script>alert(1)</script>"), filename="xss.html", content_type="image/jpeg")
        self.assertFalse(_allowed_file(malicious_html))

    # ─── 8. Production 500 Error Masking ──────────────────────────────────────

    def test_production_error_masking(self):
        """Verify that in production, internal exception tracebacks are masked."""
        with app.test_request_context('/api/some-endpoint'):
            with patch.dict(os.environ, {'FLASK_ENV': 'production'}):
                exc = RuntimeError("Database connection string: postgres://user:secret@db.internal:5432/rms")
                response, code = handle_exception(exc)
                self.assertEqual(code, 500)
                data = json.loads(response.get_data(as_text=True))
                self.assertNotIn("Database connection string", data.get('error', ''))
                self.assertIn("internal server error occurred", data.get('error', '').lower())


if __name__ == '__main__':
    unittest.main()
