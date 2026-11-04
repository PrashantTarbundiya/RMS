import os
from database.db import init_database, get_db_session

db_url = os.environ.get('DATABASE_URL')
init_database(db_url)

from database.models import Organization, User, Employee, AttendanceLog, EmployeeStatus

REAL_EMPLOYEES = [
    {"name": "vatsal_vadgama", "code": "EMP-001", "dept": "Engineering"},
    {"name": "prashant_tarbundiya", "code": "EMP-002", "dept": "Operations"},
    {"name": "Dhruvik_Parmar", "code": "EMP-003", "dept": "Engineering"},
    {"name": "Manan_Solanki", "code": "EMP-004", "dept": "Security"},
    {"name": "Shiven_Vamja", "code": "EMP-005", "dept": "Engineering"},
    {"name": "Ukani_Prince", "code": "EMP-006", "dept": "Operations"},
    {"name": "Rakshit_gajnotar", "code": "EMP-007", "dept": "Quality Assurance"},
    {"name": "shivam_petkar", "code": "EMP-008", "dept": "Engineering"},
]

REAL_NAMES_NORM = {e["name"].strip().lower().replace(' ', '_'): e for e in REAL_EMPLOYEES}

with get_db_session() as db:
    if not db:
        print("ERROR: Could not get db session")
        exit(1)

    print("=== Cleaning database ===")

    # 1. Delete all fake / synthetic / celebrity employees
    all_emps = db.query(Employee).all()
    deleted_emp_count = 0
    existing_emp_names = set()
    for emp in all_emps:
        norm = emp.name.strip().lower().replace(' ', '_')
        if norm not in REAL_NAMES_NORM:
            print(f"Deleting fake/seed employee: {emp.name} (id={emp.id})")
            db.delete(emp)
            deleted_emp_count += 1
        else:
            existing_emp_names.add(norm)

    # 2. Delete invalid attendance logs (e.g. 'Va' or fake celebrity punches)
    all_logs = db.query(AttendanceLog).all()
    deleted_log_count = 0
    for log in all_logs:
        lbl = (log.prediction_label or '').strip().lower().replace(' ', '_')
        if lbl not in REAL_NAMES_NORM and lbl != 'unknown':
            print(f"Deleting invalid attendance log: label='{log.prediction_label}' (id={log.id})")
            db.delete(log)
            deleted_log_count += 1

    # 3. Ensure all 8 real employees exist in default-org
    for emp_info in REAL_EMPLOYEES:
        norm = emp_info["name"].strip().lower().replace(' ', '_')
        if norm not in existing_emp_names:
            print(f"Adding real employee: {emp_info['name']}")
            new_emp = Employee(
                org_id="default-org",
                name=emp_info["name"],
                employee_code=emp_info["code"],
                department=emp_info["dept"],
                email=f"{norm}@aurapass.local",
                status=EmployeeStatus.active,
                image_count=10
            )
            db.add(new_emp)

    db.commit()
    print(f"\nCleanup complete: Deleted {deleted_emp_count} fake employees, {deleted_log_count} invalid attendance logs.")

    print("\nVerified Employees in default-org:")
    remaining = db.query(Employee).filter_by(org_id='default-org').all()
    for e in remaining:
        print(f"  - {e.name} (code={e.employee_code}, dept={e.department}, status={e.status.value})")
