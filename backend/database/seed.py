"""
database/seed.py — Automatic database seed for local/dev and fresh installations.

Populates:
  - Default Organization ('default-org')
  - Default Admin User ('local-admin')
  - Strict: NO fake/synthetic employees or fake attendance logs.
"""

import os
import sys
import json
from datetime import datetime, timezone, timedelta
import logging

logger = logging.getLogger('rms-seed')

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)


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

            # 2. Default User (Generated dynamically or configured via environment, NEVER hardcoded)
            user = db.query(User).filter_by(id="local-admin").first()
            if not user:
                import secrets
                initial_admin_email = os.environ.get("INITIAL_ADMIN_EMAIL", "admin@rms.local").strip().lower()
                initial_admin_password = os.environ.get("INITIAL_ADMIN_PASSWORD")
                generated_password = False

                if not initial_admin_password:
                    initial_admin_password = secrets.token_urlsafe(16)
                    generated_password = True

                user = User(
                    id="local-admin",
                    org_id="default-org",
                    email=initial_admin_email,
                    name="System Administrator",
                    password_hash=hash_password(initial_admin_password),
                    role=UserRole.org_admin,
                    is_active=True,
                    created_at=datetime.now(timezone.utc)
                )
                db.add(user)
                db.flush()

                if generated_password:
                    logger.warning("=================================================================")
                    logger.warning("SECURITY NOTICE: Created initial admin account with one-time random password:")
                    logger.warning(f"  Email:    {initial_admin_email}")
                    logger.warning(f"  Password: {initial_admin_password}")
                    logger.warning("Set INITIAL_ADMIN_PASSWORD in environment or change immediately!")
                    logger.warning("=================================================================")
                else:
                    logger.info(f"Created initial admin user: {initial_admin_email} from environment.")

            # 3. Employees & Attendance Logs
            # Strict production policy: NO synthetic employees or fake attendance records.
            # Real records will be populated only through live kiosk scans or employee enrollment.

        logger.info("Database seeding completed cleanly (0 synthetic records).")
        return True
    except Exception as e:
        logger.error(f"Error during database seeding: {e}")
        return False


if __name__ == "__main__":
    from database.db import init_database, create_tables
    init_database()
    create_tables()
    seed_database()
