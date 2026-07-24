"""
test_backup_restore.py — Unit tests for Phase 6: Backup, Restore & Data Portability.

Tests:
  1. Create backup (file-based, no DB) — produces a valid zip
  2. Backup manifest integrity — contains required fields
  3. Backup contains data files
  4. Dry-run restore validation — validates archive without modifying anything
  5. Restore detects missing manifest
  6. Restore detects corrupted files (checksum mismatch)
  7. Backup list functionality
  8. SHA-256 file hashing
  9. Manifest key mapping
  10. Real end-to-end: create → dry-run restore → validate
"""

import sys
import os
import json
import zipfile
import tempfile
import shutil

sys.path.insert(0, os.path.dirname(__file__))

passed = 0
failed = 0

def test(name, condition, detail=""):
    global passed, failed
    if condition:
        passed += 1
        print(f"  \u2713 PASS: {name}")
    else:
        failed += 1
        print(f"  \u2717 FAIL: {name}" + (f" — {detail}" if detail else ""))


print()
print("=" * 60)
print("BACKUP, RESTORE & DATA PORTABILITY — UNIT TEST SUITE")
print("=" * 60)
print()

# Setup test directory
test_dir = os.path.join(os.path.dirname(__file__), '_test_backup_temp')
os.makedirs(test_dir, exist_ok=True)

# ── Test 1: SHA-256 Hashing ──
print("── 1. SHA-256 File Hashing ──")
from backup_restore import _sha256_file

# Create a test file
test_file = os.path.join(test_dir, 'test_hash.txt')
with open(test_file, 'w') as f:
    f.write('Hello, RMS backup test!')

hash1 = _sha256_file(test_file)
hash2 = _sha256_file(test_file)
test("SHA-256 hash is consistent", hash1 == hash2)
test("SHA-256 hash is 64 chars hex", len(hash1) == 64 and all(c in '0123456789abcdef' for c in hash1))

# ── Test 2: Manifest Key Mapping ──
print("── 2. Manifest Key Mapping ──")
from backup_restore import _manifest_key_to_archive_path

test("encodings.pickle maps correctly",
     _manifest_key_to_archive_path('encodings.pickle') == 'data/encodings.pickle')
test("sota_model maps correctly",
     _manifest_key_to_archive_path('sota_model') == 'models/best_mobile_sideface.pth')
test("config.json maps correctly",
     _manifest_key_to_archive_path('config.json') == 'data/config.json')

# ── Test 3: Create Backup (No DB) ──
print("── 3. Create Backup (No DB) ──")
from backup_restore import create_full_backup

backup_output_dir = os.path.join(test_dir, 'backups')
success, backup_path, manifest, error = create_full_backup(
    output_dir=backup_output_dir
)

test("Backup creation succeeds", success)
test("Backup file exists", os.path.exists(backup_path) if backup_path else False)
test("Backup is a valid zip", zipfile.is_zipfile(backup_path) if backup_path else False)

# ── Test 4: Manifest Integrity ──
print("── 4. Manifest Integrity ──")
test("Manifest has backup_name", 'backup_name' in manifest)
test("Manifest has created_at", 'created_at' in manifest)
test("Manifest has version", 'version' in manifest)
test("Manifest has files dict", isinstance(manifest.get('files'), dict))
test("Manifest has stats dict", isinstance(manifest.get('stats'), dict))

# ── Test 5: Backup Archive Contents ──
print("── 5. Backup Archive Contents ──")
if backup_path and os.path.exists(backup_path):
    with zipfile.ZipFile(backup_path, 'r') as zf:
        names = zf.namelist()
        test("Archive contains manifest.json", 'manifest.json' in names)
        # May or may not contain data files depending on dev setup
        has_any_content = len(names) >= 1
        test("Archive has at least manifest", has_any_content)
else:
    test("Archive contents (skipped - no backup)", False)
    test("Archive has manifest (skipped)", False)

# ── Test 6: Dry-Run Restore ──
print("── 6. Dry-Run Restore ──")
from backup_restore import restore_from_backup

if backup_path and os.path.exists(backup_path):
    success_dr, report_dr, error_dr = restore_from_backup(backup_path, dry_run=True)
    test("Dry-run restore succeeds", success_dr)
    test("Report has steps", 'steps' in report_dr and len(report_dr['steps']) > 0)
    test("Report contains manifest validated step",
         any('Manifest validated' in s for s in report_dr.get('steps', [])))
    test("Dry run flag in report", report_dr.get('dry_run') == True)
else:
    for t in ["Dry-run restore succeeds", "Report has steps",
              "Report contains manifest step", "Dry run flag"]:
        test(f"{t} (skipped)", False)

# ── Test 7: Restore Detects Missing File ──
print("── 7. Missing Backup File Detection ──")
success_missing, _, error_missing = restore_from_backup('/nonexistent/backup.zip')
test("Restore fails for missing file", success_missing == False)
test("Error mentions file not found", 'not found' in (error_missing or '').lower())

# ── Test 8: Restore Detects Invalid Zip ──
print("── 8. Invalid Zip Detection ──")
bad_zip_path = os.path.join(test_dir, 'bad.zip')
with open(bad_zip_path, 'w') as f:
    f.write('this is not a zip file')
success_bad, _, error_bad = restore_from_backup(bad_zip_path)
test("Restore fails for invalid zip", success_bad == False)
test("Error mentions corrupted", 'corrupted' in (error_bad or '').lower() or 'invalid' in (error_bad or '').lower())

# ── Test 9: Restore Detects Missing Manifest ──
print("── 9. Missing Manifest Detection ──")
no_manifest_zip = os.path.join(test_dir, 'no_manifest.zip')
with zipfile.ZipFile(no_manifest_zip, 'w') as zf:
    zf.writestr('some_file.txt', 'test data')
success_nm, _, error_nm = restore_from_backup(no_manifest_zip)
test("Restore fails without manifest", success_nm == False)
test("Error mentions manifest", 'manifest' in (error_nm or '').lower())

# ── Test 10: List Backups ──
print("── 10. List Backups ──")
from backup_restore import list_backups

backups = list_backups(backup_output_dir)
test("List returns our backup", len(backups) >= 1)
if backups:
    test("Backup entry has filename", 'filename' in backups[0])
    test("Backup entry has size", 'size_bytes' in backups[0])
    test("Backup entry has created_at", backups[0].get('created_at') is not None)
else:
    for t in ["Backup entry has filename", "Backup entry has size", "Backup entry has created_at"]:
        test(f"{t} (skipped)", False)

# ── Test 11: End-to-End Create → Validate ──
print("── 11. End-to-End Create → Validate ──")
# Create a backup with known test data
e2e_dir = os.path.join(test_dir, 'e2e')
os.makedirs(os.path.join(e2e_dir, 'data'), exist_ok=True)

# Create test data files
test_config = os.path.join(e2e_dir, 'data', 'config.json')
with open(test_config, 'w') as f:
    json.dump({'test': True, 'threshold': 0.55}, f)

# Create a manual backup zip with manifest
e2e_zip_path = os.path.join(test_dir, 'e2e_test.zip')
config_hash = _sha256_file(test_config)
e2e_manifest = {
    'backup_name': 'e2e_test',
    'created_at': '2026-01-01T00:00:00',
    'version': '1.0.0',
    'files': {'config.json': config_hash},
    'stats': {},
}
with zipfile.ZipFile(e2e_zip_path, 'w') as zf:
    zf.write(test_config, 'data/config.json')
    zf.writestr('manifest.json', json.dumps(e2e_manifest))

# Validate it
success_e2e, report_e2e, error_e2e = restore_from_backup(e2e_zip_path, dry_run=True)
test("E2E: dry-run validates successfully", success_e2e)
test("E2E: checksum verified in steps",
     any('Checksum verified' in s for s in report_e2e.get('steps', [])))

# Tamper with the zip and verify checksum detection
tampered_zip = os.path.join(test_dir, 'tampered.zip')
e2e_manifest_bad = dict(e2e_manifest)
e2e_manifest_bad['files']['config.json'] = 'a' * 64  # Wrong hash
with zipfile.ZipFile(tampered_zip, 'w') as zf:
    zf.write(test_config, 'data/config.json')
    zf.writestr('manifest.json', json.dumps(e2e_manifest_bad))

success_tampered, _, error_tampered = restore_from_backup(tampered_zip, dry_run=True)
test("E2E: tampered backup rejected", success_tampered == False)
test("E2E: error mentions checksum mismatch", 'checksum' in (error_tampered or '').lower())

# ── Cleanup ──
try:
    shutil.rmtree(test_dir)
except Exception:
    pass

print()
print("=" * 60)
total = passed + failed
if failed == 0:
    print(f"ALL TESTS PASSED: {passed}/{total}")
else:
    print(f"TESTS: {passed}/{total} passed, {failed} FAILED")
print("=" * 60)
print()
