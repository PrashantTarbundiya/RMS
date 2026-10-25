import os
import sys
import uuid
import random
import datetime
from datetime import timezone

sys.path.insert(0, os.path.abspath('backend'))

from database.db import init_database, get_db_session, is_db_available
from database.models import (
    Employee, AttendanceLog, AttendanceStatus, FeedbackLog, ConsentRecord, Organization, Camera
)

FRIEND_NAMES = {
    'dhruvik_parmar', 'manan_solanki', 'rakshit_gajnotar', 'shiven_vamja',
    'ukani_prince', 'prashant_tarbundiya', 'shivam_petkar', 'vatsal_vadgama',
    'samarth_thakkar', 'jay_timbdiya', 'dev'
}

def is_friend(name):
    if not name: return False
    return name.lower().strip() in FRIEND_NAMES or any(f in name.lower() for f in FRIEND_NAMES)

def run_seed():
    init_database()
    if not is_db_available():
        print("Database not available.")
        return

    with get_db_session() as db:
        orgs = db.query(Organization).all()
        org_ids = [o.id for o in orgs]
        if not org_ids:
            org_ids = ['default-org']

        for org_id in org_ids:
            print(f"\nProcessing Org: {org_id}")

            # 1. Clean friend names from benchmark employees
            all_emps = db.query(Employee).filter_by(org_id=str(org_id)).all()
            removed_friends = 0
            for emp in all_emps:
                if is_friend(emp.name):
                    db.delete(emp)
                    removed_friends += 1
            db.commit()
            print(f"Removed {removed_friends} friend rows from benchmark employees.")

            # Remaining benchmark employees
            valid_emps = db.query(Employee).filter_by(org_id=str(org_id), status='active').all()
            print(f"Valid benchmark employees: {len(valid_emps)}")
            if not valid_emps:
                continue

            # Ensure departments are well distributed
            departments = ["Engineering", "AI Research", "Product Design", "Operations", "Quality Assurance"]
            for idx, emp in enumerate(valid_emps):
                if not emp.department or emp.department == 'General':
                    emp.department = departments[idx % len(departments)]
            db.commit()

            # 2. Clear previous synthetic attendance logs for this org to make it clean
            db.query(AttendanceLog).filter_by(org_id=str(org_id)).delete()
            db.query(FeedbackLog).filter_by(org_id=str(org_id)).delete()
            db.query(ConsentRecord).filter_by(org_id=str(org_id)).delete()
            db.commit()

            # Ensure cameras exist for this org
            cam_in_id = f"cam-{str(org_id)[:8]}-in"
            cam_in = db.query(Camera).filter_by(id=cam_in_id).first()
            if not cam_in:
                cam_in = Camera(
                    id=cam_in_id,
                    org_id=str(org_id),
                    name="Main Lobby Kiosk (Entrance)",
                    location="Ground Floor Main Entrance",
                    is_active=True
                )
                db.add(cam_in)

            cam_out_id = f"cam-{str(org_id)[:8]}-out"
            cam_out = db.query(Camera).filter_by(id=cam_out_id).first()
            if not cam_out:
                cam_out = Camera(
                    id=cam_out_id,
                    org_id=str(org_id),
                    name="Turnstile Kiosk (Exit)",
                    location="Turnstile Exit Gate 1",
                    is_active=True
                )
                db.add(cam_out)
            db.commit()

            # 3. Generate realistic 14 days of attendance (Mon Oct 12 to Sat Oct 24, 2026)
            base_date = datetime.date(2026, 10, 24)
            attendance_rows = []

            for day_offset in range(14, -1, -1):
                day = base_date - datetime.timedelta(days=day_offset)
                # Sunday off
                if day.weekday() == 6:
                    continue

                is_saturday = (day.weekday() == 5)
                # On Saturdays, ~40% turnout. Weekdays: ~88% turnout
                turnout_rate = 0.40 if is_saturday else 0.88
                active_emps = [e for e in valid_emps if random.random() < turnout_rate]

                for emp in active_emps:
                    # Work start based on department
                    dept = emp.department or 'General'
                    base_start_h = 8 if dept == 'Operations' else 9
                    base_start_m = 30 if dept == 'Operations' else 0

                    # 85% on time, 15% late
                    is_late = (random.random() < 0.15)
                    if is_late:
                        arr_min = random.randint(18, 45)
                        checkin_time = datetime.datetime(day.year, day.month, day.day, base_start_h, arr_min, random.randint(0, 59), tzinfo=timezone.utc)
                        checkin_status = AttendanceStatus.late
                    else:
                        arr_min = random.randint(35, 58)
                        arr_h = base_start_h - 1 if arr_min > 30 and base_start_h > 0 else base_start_h
                        if base_start_h == 9:
                            arr_h = 8
                            arr_min = random.randint(42, 59)
                        checkin_time = datetime.datetime(day.year, day.month, day.day, arr_h, arr_min, random.randint(0, 59), tzinfo=timezone.utc)
                        checkin_status = AttendanceStatus.on_time

                    conf = round(random.uniform(0.85, 0.99), 3)

                    # Morning Check-In
                    in_log = AttendanceLog(
                        id=f"att-{uuid.uuid4().hex}",
                        org_id=str(org_id),
                        employee_id=emp.id,
                        camera_id=cam_in.id,
                        checkin_time=checkin_time,
                        confidence=conf,
                        method='kiosk_in',
                        status=checkin_status,
                        prediction_label=emp.name,
                        is_confirmed=True,
                        synced=True
                    )
                    attendance_rows.append(in_log)

                    # Evening Check-Out (8h to 9h 15m shift)
                    work_duration_hours = random.uniform(7.8, 9.3)
                    checkout_time = checkin_time + datetime.timedelta(hours=work_duration_hours)
                    out_status = AttendanceStatus.logged

                    out_log = AttendanceLog(
                        id=f"att-{uuid.uuid4().hex}",
                        org_id=str(org_id),
                        employee_id=emp.id,
                        camera_id=cam_out.id,
                        checkin_time=checkout_time,
                        confidence=round(random.uniform(0.86, 0.98), 3),
                        method='kiosk_out',
                        status=out_status,
                        prediction_label=emp.name,
                        is_confirmed=True,
                        synced=True
                    )
                    attendance_rows.append(out_log)

            db.bulk_save_objects(attendance_rows)
            print(f"Seeded {len(attendance_rows)} attendance logs.")

            # 4. Seed Consent Records (GDPR / BIPA / DPDP Compliance)
            consent_rows = []
            for emp in valid_emps[:30]:
                c_date = datetime.datetime(2026, 9, 15, 10, 0, 0, tzinfo=timezone.utc) + datetime.timedelta(days=random.randint(0, 20))
                consent_rows.append(ConsentRecord(
                    id=f"csr-{uuid.uuid4().hex}",
                    org_id=str(org_id),
                    employee_id=emp.id,
                    consent_type='biometric_enrollment',
                    consented_at=c_date,
                    ip_address='192.168.1.105',
                    notes='Signed digital biometric consent form during employee onboarding'
                ))
            db.bulk_save_objects(consent_rows)
            print(f"Seeded {len(consent_rows)} consent records.")

            # 5. Seed Feedback Logs (ML Human-in-the-Loop Audit Trail)
            feedback_rows = []
            for i in range(12):
                fb_date = datetime.datetime(2026, 10, 15, 11, 0, 0, tzinfo=timezone.utc) + datetime.timedelta(days=random.randint(0, 8), hours=random.randint(0, 8))
                sample_emp = random.choice(valid_emps)
                feedback_rows.append(FeedbackLog(
                    id=f"fbk-{uuid.uuid4().hex}",
                    org_id=str(org_id),
                    prediction_id=f"pred-{random.randint(1000, 9999)}",
                    predicted_name=sample_emp.name,
                    is_correct=True,
                    correct_name=sample_emp.name,
                    distance=round(random.uniform(0.18, 0.32), 3),
                    action_taken='confirmed_by_admin',
                    message='Prediction verified against high-resolution entrance kiosk feed',
                    model_version='Facenet512_v2.1',
                    created_at=fb_date
                ))
            db.bulk_save_objects(feedback_rows)
            print(f"Seeded {len(feedback_rows)} feedback logs.")

            db.commit()
            print(f"Finished seeding org {org_id} successfully.")

if __name__ == '__main__':
    run_seed()
