"""
backend/tests/test_biometric_lifecycle.py
Tests the complete multi-model biometric lifecycle and deletion integrity.

Tests:
1. Multi-model biometric erasure across Facenet512, InsightFace, GhostFaceNet.
2. Tenant isolation on deletion: Tenant A cannot delete Tenant B's employees.
3. Cache invalidation on deletion.
4. Physical photo dataset folder removal.
5. Database Employee record removal.
"""

import os
import sys
import uuid
import tempfile
import shutil
import unittest
import pickle
import numpy as np

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

os.environ['FLASK_ENV'] = 'testing'
os.environ['AUTH_REQUIRED'] = 'true'
os.environ['ALLOW_DEV_ANONYMOUS'] = 'false'

from server import app, _org_model_cache
from database.db import init_database, create_tables, get_db_session
from database.models import Organization, Employee, UserRole, EmployeeStatus, PlanTier
from auth import create_access_token
from org_storage import get_encodings_path, get_dataset_cleaned_dir, get_raw_dataset_dir, save_encodings


class TestBiometricLifecycle(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp_dir = tempfile.mkdtemp(prefix="rms_test_bio_")
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
        if os.path.exists(cls.temp_dir):
            shutil.rmtree(cls.temp_dir, ignore_errors=True)

    def test_multi_model_deletion_and_cache_invalidation(self):
        """Test complete biometric deletion across all models and DB with cache purge."""
        org_id = f"test-bio-org-{uuid.uuid4().hex[:6]}"
        with get_db_session() as db:
            org = Organization(id=org_id, name="Bio Test Org", slug=org_id, plan_tier=PlanTier.starter)
            db.add(org)

            emp = Employee(
                id=f"emp-{uuid.uuid4().hex[:6]}",
                org_id=org_id,
                name="John_Subject",
                employee_code="RMS-TEST-1",
                department="Engineering",
                status=EmployeeStatus.active,
                image_count=5
            )
            db.add(emp)
            db.commit()

        # Seed physical photo folders
        cleaned_dir = get_dataset_cleaned_dir(org_id)
        person_cleaned = os.path.join(cleaned_dir, "John_Subject")
        os.makedirs(person_cleaned, exist_ok=True)
        with open(os.path.join(person_cleaned, "photo_001.jpg"), "w") as f:
            f.write("mock_photo_content")

        # Seed synthetic multi-model encodings
        fake_vec = list(np.random.randn(512).astype(float))
        models = ['Facenet512', 'InsightFace', 'GhostFaceNet']
        for m in models:
            save_encodings([fake_vec, fake_vec], ["John_Subject", "Other_Colleague"], org_id, model_name=m)

        # Pre-populate in-memory cache to test cache invalidation
        _org_model_cache[org_id] = {
            'facenet512_encodings': [fake_vec],
            'facenet512_names': ["John_Subject"]
        }

        # Issue deletion request
        token = create_access_token('admin-user', org_id, UserRole.org_admin)
        res = self.client.delete(
            '/api/persons/John_Subject',
            headers={'Authorization': f'Bearer {token}'}
        )
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.get_json().get('success'))

        # 1. Verify photo folders deleted
        self.assertFalse(os.path.exists(person_cleaned))

        # 2. Verify vectors erased across ALL models
        for m in models:
            enc_path = get_encodings_path(org_id, m)
            with open(enc_path, "rb") as f:
                data = pickle.load(f)
            self.assertNotIn("John_Subject", data['names'])
            self.assertIn("Other_Colleague", data['names'])
            self.assertEqual(len(data['names']), 1)

        # 3. Verify DB record deleted
        with get_db_session() as db:
            db_emp = db.query(Employee).filter_by(org_id=org_id, name="John_Subject").first()
            self.assertIsNone(db_emp)

        # 4. Verify in-memory cache no longer contains deleted person
        self.assertNotIn("John_Subject", _org_model_cache.get(org_id, {}).get('facenet512_names', []))

        print("  [PASS] Multi-model biometric erasure and cache invalidation verified.")

    def test_cross_tenant_deletion_prevention(self):
        """Test that Tenant A cannot delete an employee belonging to Tenant B."""
        org_a = f"org-a-{uuid.uuid4().hex[:6]}"
        org_b = f"org-b-{uuid.uuid4().hex[:6]}"

        with get_db_session() as db:
            db.add(Organization(id=org_a, name="Org A", slug=org_a, plan_tier=PlanTier.starter))
            db.add(Organization(id=org_b, name="Org B", slug=org_b, plan_tier=PlanTier.starter))

            emp_b = Employee(
                id=f"emp-b-{uuid.uuid4().hex[:6]}",
                org_id=org_b,
                name="Target_Victim",
                employee_code="RMS-B-1",
                department="Executive",
                status=EmployeeStatus.active
            )
            db.add(emp_b)
            db.commit()

        # Seed Victim in Tenant B's cleaned dataset
        b_cleaned = os.path.join(get_dataset_cleaned_dir(org_b), "Target_Victim")
        os.makedirs(b_cleaned, exist_ok=True)

        # Admin of Org A attempts to delete Target_Victim
        token_a = create_access_token('admin-a', org_a, UserRole.org_admin)
        res = self.client.delete(
            '/api/persons/Target_Victim',
            headers={'Authorization': f'Bearer {token_a}'}
        )
        self.assertEqual(res.status_code, 404)

        # Verify Target_Victim in Org B remains completely intact
        self.assertTrue(os.path.exists(b_cleaned))
        with get_db_session() as db:
            emp = db.query(Employee).filter_by(org_id=org_b, name="Target_Victim").first()
            self.assertIsNotNone(emp)

        print("  [PASS] Cross-tenant deletion attempt prevented (HTTP 404).")


if __name__ == '__main__':
    unittest.main()

