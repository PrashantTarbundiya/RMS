"""
ec2_restore.py — Runs on EC2 to sync restored weights and database entries.
"""
import os
import shutil
import subprocess

DATA_DIR = "/var/lib/docker/volumes/rms_rms_data/_data"
HOME_DIR = "/home/ubuntu"

files_to_sync = [
    'encodings.pickle',
    'encodings_GhostFaceNet.pickle',
    'encodings_InsightFace.pickle'
]

print("[1/4] Copying restored pickle files into docker volume...")
for f in files_to_sync:
    src = os.path.join(HOME_DIR, f)
    dst = os.path.join(DATA_DIR, f)
    if os.path.exists(src):
        shutil.copy2(src, dst)
        print(f"  Copied {src} -> {dst}")
        name, ext = os.path.splitext(f)
        master_dst = os.path.join(DATA_DIR, f"{name}_master{ext}")
        shutil.copy2(src, master_dst)
        print(f"  Copied master {src} -> {master_dst}")

print("\n[2/4] Syncing to all organization folders...")
orgs_dir = os.path.join(DATA_DIR, 'orgs')
if os.path.exists(orgs_dir):
    for org in os.listdir(orgs_dir):
        org_path = os.path.join(orgs_dir, org)
        if os.path.isdir(org_path):
            for f in files_to_sync:
                src = os.path.join(HOME_DIR, f)
                dst = os.path.join(org_path, f)
                shutil.copy2(src, dst)
            print(f"  Updated org: {org}")

print("\n[3/4] Restoring 8 missing team members in PostgreSQL employees table...")

# Get org IDs via docker exec psql
cmd_orgs = [
    "docker", "exec", "rms_postgres", "psql", "-U", "rms", "-d", "rms_db", "-t", "-A",
    "-c", "SELECT id, name FROM organizations;"
]
proc = subprocess.run(cmd_orgs, capture_output=True, text=True, check=True)
org_lines = [line.strip().split('|') for line in proc.stdout.strip().split('\n') if '|' in line]

missing_members = [
    ('vatsal_vadgama', 'Engineering', 11),
    ('prashant_tarbundiya', 'AI Research', 30),
    ('Ukani_Prince', 'Engineering', 32),
    ('Dhruvik_Parmar', 'Product Design', 13),
    ('Manan_Solanki', 'Operations', 10),
    ('Shiven_Vamja', 'Quality Assurance', 10),
    ('Rakshit_gajnotar', 'Engineering', 3),
    ('shivam_petkar', 'Engineering', 3),
]

sql_commands = []
for org_id, org_name in org_lines:
    print(f"  Restoring for org: {org_name} ({org_id})")
    for raw_name, dept, img_cnt in missing_members:
        emp_id = f"emp-{str(org_id)[:8]}-{raw_name[:12]}"
        emp_code = f"RMS-{str(org_id)[:4].upper()}-{raw_name[:6].upper()}"
        email = f"{raw_name.lower()}@rms.enterprise"
        sql = f"""
            INSERT INTO employees 
            (id, org_id, name, employee_code, department, email, status, image_count, created_at, updated_at)
            VALUES ('{emp_id}', '{org_id}', '{raw_name}', '{emp_code}', '{dept}', '{email}', 'active', {img_cnt}, NOW(), NOW())
            ON CONFLICT (id) DO UPDATE SET 
                name = EXCLUDED.name,
                status = 'active',
                department = EXCLUDED.department,
                updated_at = NOW();
        """
        sql_commands.append(sql)

full_sql = "\n".join(sql_commands)
subprocess.run([
    "docker", "exec", "-i", "rms_postgres", "psql", "-U", "rms", "-d", "rms_db"
], input=full_sql, text=True, check=True)

# Verify employee counts
cmd_counts = [
    "docker", "exec", "rms_postgres", "psql", "-U", "rms", "-d", "rms_db",
    "-c", "SELECT org_id, count(*) FROM employees GROUP BY org_id;"
]
subprocess.run(cmd_counts, check=True)

print("\n[4/4] Restarting docker containers...")
subprocess.run(["docker", "restart", "rms_api", "rms_ml_worker"], check=True)
print("EC2 RESTORATION COMPLETE!")
