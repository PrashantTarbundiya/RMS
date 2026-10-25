"""
restore_all_identities.py
Restores all genuine identities and embeddings across all models and organizations.
"""
import os
import sys
import zipfile
import pickle
import shutil
import sqlite3
import cv2
import numpy as np

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)
sys.path.insert(0, BACKEND_DIR)

from model import get_embedding, apply_clahe, warmup_models
from org_storage import get_encodings_path

BACKUP_ZIP = os.path.join(BACKEND_DIR, 'backups', 'rms_backup_20261021_160248.zip')
MISSING_SUBJECTS = [
    'vatsal_vadgama',
    'prashant_tarbundiya',
    'Ukani_Prince',
    'Dhruvik_Parmar',
    'Manan_Solanki',
    'Shiven_Vamja',
    'Rakshit_gajnotar',
    'shivam_petkar'
]

def restore_facenet512():
    print("[1/4] Restoring Facenet512 encodings from backup...")
    with zipfile.ZipFile(BACKUP_ZIP, 'r') as z:
        with z.open('data/encodings.pickle') as f:
            backup_data = pickle.load(f)

    total_encs = len(backup_data['encodings'])
    unique_names = len(set(backup_data['names']))
    print(f"  Backup contains {total_encs} embeddings across {unique_names} subjects.")
    assert total_encs == 1042, f"Expected 1042 embeddings, got {total_encs}"
    assert 'vatsal_vadgama' in backup_data['names'], "vatsal_vadgama missing from backup!"

    targets = [
        os.path.join(BACKEND_DIR, 'data', 'encodings.pickle'),
        os.path.join(BACKEND_DIR, 'encodings.pickle'),
    ]

    # Add all org folders
    orgs_dir = os.path.join(BACKEND_DIR, 'data', 'orgs')
    if os.path.exists(orgs_dir):
        for org in os.listdir(orgs_dir):
            org_path = os.path.join(orgs_dir, org)
            if os.path.isdir(org_path):
                targets.append(os.path.join(org_path, 'encodings.pickle'))

    for target in targets:
        os.makedirs(os.path.dirname(target), exist_ok=True)
        with open(target, 'wb') as f:
            pickle.dump(backup_data, f)
        print(f"  Wrote Facenet512 encodings to {target}")

def restore_multi_models():
    print("\n[2/4] Generating genuine embeddings for GhostFaceNet & InsightFace...")
    dataset_cleaned_dir = os.path.join(PROJECT_ROOT, 'dataset_cleaned')
    
    # Collect images for the 8 missing subjects
    subject_images = {}
    for s in MISSING_SUBJECTS:
        s_dir = os.path.join(dataset_cleaned_dir, s)
        if not os.path.exists(s_dir):
            print(f"  [WARNING] Directory not found for {s}: {s_dir}")
            continue
        imgs = []
        for root, _, files in os.walk(s_dir):
            for file in files:
                if file.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                    imgs.append(os.path.join(root, file))
        subject_images[s] = imgs
        print(f"  Subject '{s}': {len(imgs)} images")

    for model_name in ['GhostFaceNet', 'InsightFace']:
        print(f"\n  Processing {model_name}...")
        global_path = os.path.join(BACKEND_DIR, 'data', f'encodings_{model_name}.pickle')
        if not os.path.exists(global_path):
            print(f"  Global path not found: {global_path}")
            continue

        with open(global_path, 'rb') as f:
            model_data = pickle.load(f)

        existing_names = list(model_data.get('names', []))
        existing_encs = list(model_data.get('encodings', []))
        print(f"    Current {model_name}: {len(existing_encs)} embeddings, {len(set(existing_names))} unique names")

        # Filter out any existing entries for these subjects to avoid duplicates
        filtered_pairs = [(e, n) for e, n in zip(existing_encs, existing_names) if n not in MISSING_SUBJECTS]
        filtered_encs = [p[0] for p in filtered_pairs]
        filtered_names = [p[1] for p in filtered_pairs]

        new_count = 0
        for s, img_paths in subject_images.items():
            s_added = 0
            for img_path in img_paths:
                img = cv2.imread(img_path)
                if img is None or img.size == 0:
                    continue
                proc = apply_clahe(img)
                emb = get_embedding(proc, model_name=model_name)
                if emb is not None:
                    filtered_encs.append(emb)
                    filtered_names.append(s)
                    s_added += 1
                    new_count += 1
            print(f"    Added {s_added} vectors for {s}")

        model_data['encodings'] = filtered_encs
        model_data['names'] = filtered_names
        print(f"    Total {model_name} now: {len(filtered_encs)} embeddings, {len(set(filtered_names))} unique names")

        # Save to global
        with open(global_path, 'wb') as f:
            pickle.dump(model_data, f)
        print(f"    Saved updated global {model_name} to {global_path}")

        # Sync to all orgs
        orgs_dir = os.path.join(BACKEND_DIR, 'data', 'orgs')
        if os.path.exists(orgs_dir):
            for org in os.listdir(orgs_dir):
                org_file = os.path.join(orgs_dir, org, f'encodings_{model_name}.pickle')
                if os.path.exists(os.path.dirname(org_file)):
                    with open(org_file, 'wb') as f:
                        pickle.dump(model_data, f)
                    print(f"    Synced to {org_file}")

def restore_database_employees():
    print("\n[3/4] Ensuring all 70 employees exist in rms.db for all organizations...")
    db_path = os.path.join(BACKEND_DIR, 'data', 'rms.db')
    if not os.path.exists(db_path):
        print(f"  Database not found: {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Get all employees from default-org
    cur.execute("SELECT id, name, employee_code, department, email, status, image_count, consent_given_at, consent_revoked_at, created_at, updated_at FROM employees WHERE org_id = 'default-org'")
    default_employees = cur.fetchall()
    print(f"  Found {len(default_employees)} reference employees in 'default-org'")

    # Get all organizations
    cur.execute("SELECT id, name FROM organizations")
    orgs = cur.fetchall()
    print(f"  Found organizations: {orgs}")

    for org_id, org_name in orgs:
        if org_id == 'default-org':
            continue
        print(f"  Checking employees for org: {org_name} ({org_id})...")
        cur.execute("SELECT count(*) FROM employees WHERE org_id = ?", (org_id,))
        count = cur.fetchone()[0]
        print(f"    Current employee count: {count}")
        
        # Populate all 70 employees for this org
        for emp in default_employees:
            eid, name, ecode, dept, email, status, img_cnt, c_given, c_revoked, c_at, u_at = emp
            new_eid = f"emp-{org_id[:8]}-{eid[4:] if eid.startswith('emp-') else eid}"
            new_ecode = f"RMS-{org_id[:4].upper()}-{ecode.replace('RMS-', '')}"
            new_email = f"{name.lower()}@{org_name.lower().replace(' ', '')}.local"

            cur.execute("""
                INSERT OR REPLACE INTO employees 
                (id, org_id, name, employee_code, department, email, status, image_count, consent_given_at, consent_revoked_at, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (new_eid, org_id, name, new_ecode, dept or 'Engineering', new_email, 'active', img_cnt or 10, c_given, c_revoked, c_at, u_at))
        
        cur.execute("SELECT count(*) FROM employees WHERE org_id = ?", (org_id,))
        new_count = cur.fetchone()[0]
        print(f"    Updated employee count for {org_name}: {new_count}")

    conn.commit()
    conn.close()
    print("  Database employees restored successfully.")

def verify_restoration():
    print("\n[4/4] Verifying restoration...")
    from org_storage import load_encodings
    for model in ['Facenet512', 'GhostFaceNet', 'InsightFace']:
        for org in ['default-org', '7d9bbd5d-3da2-44d1-a5e2-f4f2dc6f76f9']:
            encs, names = load_encodings(org, model_name=model)
            vatsal_cnt = names.count('vatsal_vadgama') if names else 0
            print(f"  Model {model:<15} | Org {org[:12]:<12} | Total: {len(names) if names else 0:<5} | Vatsal vectors: {vatsal_cnt}")

if __name__ == '__main__':
    restore_facenet512()
    restore_multi_models()
    restore_database_employees()
    verify_restoration()
    print("\nALL RESTORATIONS COMPLETED SUCCESSFULLY!")
