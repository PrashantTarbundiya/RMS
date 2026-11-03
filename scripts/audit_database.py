import sqlite3

conn = sqlite3.connect('backend/data/rms.db')
cur = conn.cursor()

print("=== ORGANIZATIONS ===")
cur.execute("SELECT id, name, slug, plan_tier FROM organizations")
orgs = cur.fetchall()
for o in orgs:
    print(o)

print("\n=== USERS ===")
cur.execute("SELECT id, org_id, email, name, role, is_active FROM users")
for u in cur.fetchall():
    print(u)

print("\n=== EMPLOYEES COUNT BY ORG ===")
cur.execute("SELECT org_id, count(*) FROM employees GROUP BY org_id")
for ec in cur.fetchall():
    print(ec)

print("\n=== RMC EMPLOYEES (f549fd90-1b8e-4848-8a8d-c7f0b50845b0) ===")
cur.execute("SELECT id, name, employee_code, department, status, image_count FROM employees WHERE org_id='f549fd90-1b8e-4848-8a8d-c7f0b50845b0'")
for emp in cur.fetchall():
    print(emp)

print("\n=== ATTENDANCE LOGS COUNT BY ORG ===")
cur.execute("SELECT org_id, count(*) FROM attendance_logs GROUP BY org_id")
for ac in cur.fetchall():
    print(ac)

conn.close()

