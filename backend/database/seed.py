"""
database/seed.py — Automatic database seed for local/dev and fresh installations.

Populates:
  - Default Organization ('default-org')
  - Default Admin User ('local-admin')
  - Employees synced from dataset_cleaned/ directory
  - AttendanceLog records for realistic analytics charts
  - FeedbackLog records imported from feedback_log.json for audit log visualization
"""

import os
import sys
import json
import random
from datetime import datetime, timezone, timedelta
import logging

logger = logging.getLogger('rms-seed')

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

PROJECT_ROOT = os.path.dirname(BACKEND_DIR)
DATASET_DIR = os.path.join(PROJECT_ROOT, 'dataset_cleaned')
FEEDBACK_LOG_PATH = os.path.join(BACKEND_DIR, 'data', 'feedback_log.json')


def seed_database():
    """Seed initial data if tables are empty."""
    from database.db import get_db_session, is_db_available
    if not is_db_available():
        logger.warning("Database unavailable, skipping seed.")
        return False

    from database.models import (
        Organization, User, Employee, AttendanceLog, FeedbackLog,
        DeploymentMode, PlanTier, UserRole, EmployeeStatus, AttendanceStatus
    )
    from auth import hash_password

    try:
        with get_db_session() as db:
            if db is None:
                return False

            # 1. Default Organization
            org = db.query(Organization).filter_by(id="default-org").first()
            if not org:
                org = Organization(
                    id="default-org",
                    name="Default Organization",
                    slug="default-org",
                    deployment_mode=DeploymentMode.local,
                    plan_tier=PlanTier.business,
                    confirm_threshold=0.38,
                    created_at=datetime.now(timezone.utc)
                )
                db.add(org)
                db.flush()
                logger.info("Created default organization: default-org")

            # 2. Default User
            user = db.query(User).filter_by(id="local-admin").first()
            if not user:
                user = User(
                    id="local-admin",
                    org_id="default-org",
                    email="admin@rms.local",
                    name="System Administrator",
                    password_hash=hash_password("admin12345"),
                    role=UserRole.org_admin,
                    is_active=True,
                    created_at=datetime.now(timezone.utc)
                )
                db.add(user)
                db.flush()
                logger.info("Created default admin user: admin@rms.local")

            # 3. Employees from dataset_cleaned/
            departments = ["Engineering", "AI Research", "Product Design", "Operations", "Quality Assurance"]
            existing_employees = {e.name: e for e in db.query(Employee).filter_by(org_id="default-org").all()}
            existing_ids = {e[0] for e in db.query(Employee.id).all()}
            existing_codes = {e[0] for e in db.query(Employee.employee_code).all()}
            
            created_employees = []
            if os.path.exists(DATASET_DIR):
                folder_names = sorted([
                    d for d in os.listdir(DATASET_DIR)
                    if os.path.isdir(os.path.join(DATASET_DIR, d)) and d != 'orgs' and not d.startswith('.')
                ])

                for idx, folder_name in enumerate(folder_names, start=1):
                    folder_path = os.path.join(DATASET_DIR, folder_name)
                    # Count images
                    img_count = sum(
                        len(files) for _, _, files in os.walk(folder_path)
                        if any(f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')) for f in files)
                    )

                    dept = departments[(idx - 1) % len(departments)]
                    emp = existing_employees.get(folder_name)
                    if not emp:
                        emp_id = f"emp-{idx:04d}"
                        id_counter = idx
                        while emp_id in existing_ids:
                            id_counter += 1
                            emp_id = f"emp-{id_counter:04d}"
                        existing_ids.add(emp_id)

                        code = f"RMS-{idx:03d}"
                        code_counter = idx
                        while code in existing_codes:
                            code_counter += 1
                            code = f"RMS-{code_counter:03d}"
                        existing_codes.add(code)

                        emp = Employee(
                            id=emp_id,
                            org_id="default-org",
                            name=folder_name,
                            employee_code=code,
                            department=dept,
                            email=f"{folder_name.replace(' ', '.').lower()}@rms.local",
                            status=EmployeeStatus.active,
                            image_count=img_count,
                            created_at=datetime.now(timezone.utc) - timedelta(days=30)
                        )
                        db.add(emp)
                        created_employees.append(emp)
                    else:
                        created_employees.append(emp)
                db.flush()

            all_employees = db.query(Employee).filter_by(org_id="default-org").all()

            # 4. Attendance Logs — Do NOT generate synthetic logs.
            # Only genuine live scan events will be logged.

            # 5. Audit Feedback Logs (if empty, load from feedback_log.json)
            feedback_count = db.query(FeedbackLog).filter_by(org_id="default-org").count()
            if feedback_count == 0 and os.path.exists(FEEDBACK_LOG_PATH):
                try:
                    with open(FEEDBACK_LOG_PATH, 'r', encoding='utf-8') as f:
                        feedbacks = json.load(f)
                    
                    # Take up to 100 recent feedback records
                    sample_feedbacks = feedbacks[-100:] if isinstance(feedbacks, list) else []
                    for fb in sample_feedbacks:
                        ts_str = fb.get('timestamp')
                        ts = None
                        if ts_str:
                            try:
                                ts = datetime.fromisoformat(ts_str.replace('Z', '+00:00'))
                            except Exception:
                                ts = datetime.now(timezone.utc)
                        else:
                            ts = datetime.now(timezone.utc)

                        f_log = FeedbackLog(
                            org_id="default-org",
                            prediction_id=str(fb.get('id', 'pred-001')),
                            predicted_name=fb.get('predicted_name', 'Unknown'),
                            correct_name=fb.get('correct_name') or fb.get('predicted_name', 'Unknown'),
                            is_correct=fb.get('is_correct', True),
                            action_taken=fb.get('action', 'confirmed'),
                            message=fb.get('message', 'User feedback recorded'),
                            distance=float(fb.get('distance', 0.25)) if fb.get('distance') is not None else None,
                            created_at=ts
                        )
                        db.add(f_log)
                    db.flush()
                    logger.info(f"Seeded {len(sample_feedbacks)} feedback records into audit log.")
                except Exception as fb_err:
                    logger.warning(f"Failed to seed feedback records: {fb_err}")

        logger.info("Database seeding completed successfully.")
        return True
    except Exception as e:
        logger.error(f"Error during database seeding: {e}")
        return False


if __name__ == "__main__":
    from database.db import init_database, create_tables
    init_database()
    create_tables()
    seed_database()
