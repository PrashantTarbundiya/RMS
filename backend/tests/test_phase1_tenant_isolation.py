"""
backend/tests/test_phase1_tenant_isolation.py
Phase 1 Critical Tenant Isolation Verification Test Suite.

Tests:
1. Registration creates 0 benchmark employees and 0 benchmark pickle files.
2. Empty retrain does not import benchmark data and preserves existing state.
3. Unknown employee attendance requests return 404 and create 0 attendance logs.
4. Cross-tenant employee ID attendance requests are rejected (404) with zero logs.
5. Valid enrolled employees can record attendance properly.
6. Unauthenticated requests return 401 in multi-tenant mode (no default-org fallback).
7. get_encodings_path isolates default-org to backend/data/orgs/default-org in multi-tenant mode.
"""

import os
import sys
import uuid
import tempfile
import shutil
import unittest
import json
import time

# Ensure backend directory is in sys.path
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Force test environment
os.environ['FLASK_ENV'] = 'testing'
os.environ['AUTH_REQUIRED'] = 'true'
os.environ['ALLOW_DEV_ANONYMOUS'] = 'false'

from server import app, local_training_queue
from database.db import init_database, create_tables, get_db_session
from database.models import Organization, User, Employee, AttendanceLog, UserRole, EmployeeStatus, PlanTier
from auth import create_access_token, hash_password
from org_storage import get_encodings_path, is_multitenant_mode, _get_org_data_dir


class TestPhase1TenantIsolation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Create an isolated temporary test database and storage
        cls.temp_dir = tempfile.mkdtemp(prefix="rms_test_p1_")
        cls.test_db_path = os.path.join(cls.temp_dir, "test_rms.db")
        cls.test_db_url = f"sqlite:///{cls.test_db_path}"
        os.environ['DATABASE_URL'] = cls.test_db_url
        os.environ['STORAGE_DIR'] = cls.temp_dir

        init_database(cls.test_db_url)
        create_tables()

        app.config['TESTING'] = True
        cls.client = app.test_client()

    @classmethod
    def tearDownClass(cls):
        # Clean up temporary directories
        if os.path.exists(cls.temp_dir):
            shutil.rmtree(cls.temp_dir, ignore_errors=True)

    def test_01_registration_isolation(self):
        """Test 1: Registration creates 0 benchmark employees and 0 benchmark pickle files."""
        unique_slug = f"acme-{uuid.uuid4().hex[:6]}"
        reg_payload = {
            'org_name': 'Acme Corporation',
            'slug': unique_slug,
            'email': f'admin@{unique_slug}.com',
            'password': 'SecurePassword123!',
            'admin_name': 'Acme Administrator'
        }

        res = self.client.post('/api/auth/register', json=reg_payload)
        self.assertEqual(res.status_code, 201, f"Registration failed: {res.get_json()}")
        data = res.get_json()
        org_id = data['user']['org_id']

        # 1. Verify 0 employees were seeded in the database for this organization
        with get_db_session() as db:
            emp_count = db.query(Employee).filter(Employee.org_id == str(org_id)).count()
        self.assertEqual(emp_count, 0, f"Expected 0 employees for new tenant, found {emp_count}")

        # 2. Verify NO benchmark encodings pickle file was copied into the tenant folder
        tenant_encodings = get_encodings_path(org_id, 'Facenet512')
        self.assertFalse(os.path.exists(tenant_encodings), f"Encodings file should not exist yet: {tenant_encodings}")

        print(f"  [PASS] Test 1: New tenant '{unique_slug}' registered with 0 synthetic employees and 0 pickle files.")

    def test_02_empty_retrain_no_benchmark_fallback(self):
        """Test 2: Empty retrain does not import benchmark data and preserves existing state."""
        org_id = f"test-empty-org-{uuid.uuid4().hex[:6]}"
        with get_db_session() as db:
            org = Organization(id=org_id, name="Empty Org", slug=org_id, plan_tier=PlanTier.starter)
            db.add(org)
            db.commit()

        # Enforce empty dataset directory
        from org_storage import get_dataset_cleaned_dir
        cleaned_dir = get_dataset_cleaned_dir(org_id)
        if os.path.exists(cleaned_dir):
            shutil.rmtree(cleaned_dir)
        os.makedirs(cleaned_dir, exist_ok=True)

        token = create_access_token('test-admin', org_id, UserRole.org_admin)
        res = self.client.post(
            '/api/train/all',
            json={'epochs': 1},
            headers={'Authorization': f'Bearer {token}'}
        )
        self.assertEqual(res.status_code, 200)

        # Wait for queue worker to process job
        local_training_queue.join()
        time.sleep(0.5)

        # Check that 0 employees were created
        with get_db_session() as db:
            emp_count = db.query(Employee).filter(Employee.org_id == org_id).count()
        self.assertEqual(emp_count, 0, "Empty retrain must never seed synthetic employees")

        # Check that no benchmark encodings file was seeded
        tenant_encodings = get_encodings_path(org_id, 'Facenet512')
        self.assertFalse(os.path.exists(tenant_encodings), "Empty retrain must never seed benchmark weights")

        print("  [PASS] Test 2: Retraining with empty dataset completed safely without seeding benchmark weights.")

    def test_03_unknown_employee_attendance_rejected(self):
        """Test 3: Unknown employee attendance requests return 404 and create 0 attendance logs."""
        org_id = f"test-org-{uuid.uuid4().hex[:6]}"
        with get_db_session() as db:
            org = Organization(id=org_id, name="Test Org", slug=org_id, plan_tier=PlanTier.starter)
            db.add(org)
            db.commit()

        token = create_access_token('test-admin', org_id, UserRole.org_admin)
        att_payload = {
            'name': 'Unknown Intruder',
            'confidence': 0.95,
            'direction': 'in'
        }

        res = self.client.post(
            '/api/attendance/record',
            json=att_payload,
            headers={'Authorization': f'Bearer {token}'}
        )
        self.assertEqual(res.status_code, 404)
        err_json = res.get_json()
        self.assertEqual(err_json.get('code'), 'EMPLOYEE_NOT_FOUND')

        # Verify 0 employees were created
        with get_db_session() as db:
            emp_count = db.query(Employee).filter(Employee.org_id == org_id).count()
            log_count = db.query(AttendanceLog).filter(AttendanceLog.org_id == org_id).count()
        self.assertEqual(emp_count, 0, "No employee should be auto-created for unknown face")
        self.assertEqual(log_count, 0, "No attendance log should be recorded for rejected unknown person")

        print("  [PASS] Test 3: Unknown person attendance correctly rejected with 404 (0 auto-created rows).")

    def test_04_cross_tenant_employee_rejected(self):
        """Test 4: Cross-tenant employee ID attendance requests are rejected."""
        org_a_id = f"org-a-{uuid.uuid4().hex[:6]}"
        org_b_id = f"org-b-{uuid.uuid4().hex[:6]}"

        with get_db_session() as db:
            org_a = Organization(id=org_a_id, name="Org A", slug=org_a_id, plan_tier=PlanTier.starter)
            org_b = Organization(id=org_b_id, name="Org B", slug=org_b_id, plan_tier=PlanTier.starter)
            db.add(org_a)
            db.add(org_b)

            # Employee belongs to Org A
            emp_a = Employee(
                id=f"emp-a-{uuid.uuid4().hex[:6]}",
                org_id=org_a_id,
                name="Alice OrgA",
                employee_code="RMS-ALICE-1",
                department="Engineering",
                status=EmployeeStatus.active
            )
            db.add(emp_a)
            db.commit()
            emp_a_id = emp_a.id

        # Org B attempts to record attendance referencing Alice from Org A
        token_b = create_access_token('admin-b', org_b_id, UserRole.org_admin)
        res = self.client.post(
            '/api/attendance/record',
            json={
                'employee_id': emp_a_id,
                'name': 'Alice OrgA',
                'confidence': 0.95
            },
            headers={'Authorization': f'Bearer {token_b}'}
        )
        self.assertEqual(res.status_code, 404)
        self.assertEqual(res.get_json().get('code'), 'EMPLOYEE_NOT_FOUND')

        # Ensure no attendance logs created in Org B
        with get_db_session() as db:
            logs_b = db.query(AttendanceLog).filter(AttendanceLog.org_id == org_b_id).count()
        self.assertEqual(logs_b, 0, "Cross-tenant attendance must create 0 logs")

        print("  [PASS] Test 4: Cross-tenant employee ID attendance attempt rejected with 404.")

    def test_05_valid_enrolled_employee_attendance(self):
        """Test 5: Valid enrolled employees can still record attendance."""
        org_id = f"org-valid-{uuid.uuid4().hex[:6]}"
        with get_db_session() as db:
            org = Organization(id=org_id, name="Valid Org", slug=org_id, plan_tier=PlanTier.starter)
            db.add(org)

            emp = Employee(
                id=f"emp-{uuid.uuid4().hex[:6]}",
                org_id=org_id,
                name="John Doe",
                employee_code="RMS-JOHN-1",
                department="Engineering",
                status=EmployeeStatus.active
            )
            db.add(emp)
            db.commit()
            emp_id = emp.id

        token = create_access_token('admin-valid', org_id, UserRole.org_admin)
        res = self.client.post(
            '/api/attendance/record',
            json={
                'employee_id': emp_id,
                'name': 'John Doe',
                'confidence': 0.92,
                'direction': 'in'
            },
            headers={'Authorization': f'Bearer {token}'}
        )
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.get_json().get('success'))

        # Verify log recorded
        with get_db_session() as db:
            log = db.query(AttendanceLog).filter(AttendanceLog.employee_id == emp_id).first()
            self.assertIsNotNone(log)
            self.assertEqual(log.prediction_label, "John Doe")

        print("  [PASS] Test 5: Valid enrolled employee successfully recorded attendance.")

    def test_06_unauthenticated_request_rejected(self):
        """Test 6: Unauthenticated requests return 401 in production / multi-tenant mode."""
        res = self.client.post('/api/attendance/record', json={'name': 'Anyone'})
        self.assertEqual(res.status_code, 401)
        err = res.get_json()
        self.assertEqual(err.get('code'), 'AUTH_REQUIRED')

        # Also test single-tenant-token rejection in multi-tenant mode
        res2 = self.client.post(
            '/api/attendance/record',
            json={'name': 'Anyone'},
            headers={'Authorization': 'Bearer single-tenant-token'}
        )
        self.assertEqual(res2.status_code, 401)
        self.assertEqual(res2.get_json().get('code'), 'INVALID_TOKEN')

        print("  [PASS] Test 6: Unauthenticated request rejected with HTTP 401 (no default-org fallback).")

    def test_07_storage_resolver_multi_tenant_isolation(self):
        """Test 7: get_encodings_path isolates default-org and normal tenants in multi-tenant mode."""
        self.assertTrue(is_multitenant_mode())

        # default-org path must be isolated in data/orgs/default-org/
        default_path = get_encodings_path('default-org', 'Facenet512')
        self.assertIn(os.path.join('data', 'orgs', 'default-org'), default_path)
        self.assertFalse(default_path.endswith(os.path.join('backend', 'data', 'encodings.pickle')))

        # tenant path must be isolated in data/orgs/{org_id}/
        custom_org = 'tenant-xyz-123'
        custom_path = get_encodings_path(custom_org, 'Facenet512')
        self.assertIn(os.path.join('data', 'orgs', custom_org), custom_path)

        print("  [PASS] Test 7: Storage resolver isolates default-org and custom tenants from global benchmark master.")


if __name__ == '__main__':
    unittest.main()
