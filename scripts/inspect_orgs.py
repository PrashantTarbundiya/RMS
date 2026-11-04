import os
from database.db import init_database, get_db_session
from database.models import Organization, User, Employee

init_database(os.environ.get('DATABASE_URL'))

with get_db_session() as db:
    print("=== ORGANIZATIONS ===")
    for o in db.query(Organization).all():
        print(f"ID: {o.id} | Name: {o.name}")
    print("\n=== USERS ===")
    for u in db.query(User).all():
        print(f"Email: {u.email} | Org: {u.org_id} | Name: {u.name}")
    print("\n=== EMPLOYEES PER ORG ===")
    for o in db.query(Organization).all():
        emps = db.query(Employee).filter_by(org_id=o.id).all()
        print(f"Org '{o.name}' ({o.id}): {len(emps)} employees")
        for e in emps[:5]:
            print(f"   - {e.name}")
