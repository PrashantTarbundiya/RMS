# AuraPass™ Enterprise — Phase 2 Benchmark Data Integrity & Forensic Inventory

**Document Reference**: `docs/reports/PHASE_2_BENCHMARK_DATA_INTEGRITY.md`  
**Execution Timestamp**: 2026-11-02T21:25:00+05:30  
**Authority**: Lead DevSecOps Auditor & Principal Biometric ML Engineer  
**Workspace**: `E:\RMS`  
**Governance**: Strict adherence to `GEMINI.md` Rules A through I and Phase 1.2 Safety Rules  

---

## 1. Executive Summary

A forensic cryptographic audit was conducted across all files under `backend/data/orgs/`, comparing them against the master benchmark dataset `backend/data/encodings.pickle` (SHA256: `7bd0370005d31c411f7c57ecc925803997517ff34410fed88a874690501da68f`).

### Verified Core Findings:
1. **Customer Organization (`RMC`, UUID `f549fd90-1b8e-4848-8a8d-c7f0b50845b0`)**:
   - Contains **zero benchmark pickle files** in its tenant storage directory.
   - Contains **three genuine registered employees** in the database: `Vatsal Vadgama`, `Shivam Petkar`, `Rakshit Gajnotar`.
   - All three genuine employees have dedicated cleaned image datasets under `dataset_cleaned/orgs/f549fd90-1b8e-4848-8a8d-c7f0b50845b0/`.
2. **NIRMA Tenant (`7d9bbd5d-3da2-44d1-a5e2-f4f2dc6f76f9`)**:
   - Contains **zero benchmark pickle files**.
3. **Default Tenant (`default-org`)**:
   - Contains **zero benchmark pickle files** in its isolated folder.
4. **Historical Legacy/Test Directories**:
   - Exactly 10 abandoned historical directories (`26cf69a0`, `43668307`, `5254c451`, `6c4835db`, `79d1a4ca`, `842cd542`, `bcbe5bde`, `default`, `local-org`, `test-org-123`) contain byte-for-byte copies of the master benchmark files.
   - Cryptographic analysis proved that **0 custom identities** exist in any of these 10 legacy directories ($100\%$ benchmark overlap, $0\%$ proprietary data).

---

## 2. Cryptographic Hash Inventory of Master Benchmark Files

| Benchmark File | File Size | SHA256 Hash | Person Count | Embedding Count |
| :--- | :--- | :--- | :--- | :--- |
| `backend/data/encodings.pickle` | 4,969,525 B | `7bd0370005d31c411f7c57ecc925803997517ff34410fed88a874690501da68f` | 70 LFW persons | 1,076 vectors (512-d) |
| `backend/data/encodings_GhostFaceNet.pickle` | 4,969,527 B | `007e3bcc2a0e28f3bb22ce3660fa471207908fbfe55df1d7ca022a842cfaf6d8` | 70 LFW persons | 1,076 vectors (512-d) |
| `backend/data/encodings_InsightFace.pickle` | 4,969,526 B | `dbe9226e6eb00d075210c499c8fc38b34645228c29013f9f7063fa2b9ba54326` | 70 LFW persons | 1,076 vectors (512-d) |
| `backend/data/encodings_VGG-Face.pickle` | 34,304,885 B | `ed2b8ea25be8e21946051515bb560fc9ea44eb1c7816ef179dc887012586dbd2` | 62 LFW persons | 794 vectors (4096-d) |

---

## 3. Directory-by-Directory Tenant Classification

| Organization UUID / Directory | Tenant Status | Benchmark Files Present | Genuine Employee Overlap | Classification |
| :--- | :--- | :--- | :--- | :--- |
| `f549fd90-1b8e-4848-8a8d-c7f0b50845b0` | **Active Customer (RMC)** | None (0 files) | 3 genuine employees | **Clean Active Customer** |
| `7d9bbd5d-3da2-44d1-a5e2-f4f2dc6f76f9` | **Active Tenant (NIRMA)** | None (0 files) | 0 employees in DB | **Clean Active Tenant** |
| `default-org` | **Default Dev Tenant** | None (0 files) | 0 employees in DB | **Clean Isolated Tenant** |
| `26cf69a0-4aa2-4b93-8733-becbb5f66f66` | Historical Orphan | 3 pickle files | 0 custom identities | **Confirmed Benchmark Copy** |
| `43668307-9f70-4402-9d27-9b997bbf9f3c` | Historical Orphan | 4 pickle files | 0 custom identities | **Confirmed Benchmark Copy** |
| `5254c451-f2f8-4dac-bf05-433909a96142` | Historical Orphan | 4 pickle files | 0 custom identities | **Confirmed Benchmark Copy** |
| `6c4835db-e089-4194-b3fd-06eab42e61b6` | Historical Orphan | 4 pickle files | 0 custom identities | **Confirmed Benchmark Copy** |
| `79d1a4ca-e7ed-4cbe-81ba-77be3ebab6cf` | Historical Orphan | 3 pickle files | 0 custom identities | **Confirmed Benchmark Copy** |
| `842cd542-85c3-4630-9eb0-1cf016e5c711` | Historical Orphan | 3 pickle files | 0 custom identities | **Confirmed Benchmark Copy** |
| `bcbe5bde-e7ad-4a5c-b23a-875cb154202a` | Historical Orphan | 3 pickle files | 0 custom identities | **Confirmed Benchmark Copy** |
| `default` | Legacy Directory | 3 pickle files | 0 custom identities | **Confirmed Benchmark Copy** |
| `local-org` | Legacy Directory | 3 pickle files | 0 custom identities | **Confirmed Benchmark Copy** |
| `test-org-123` | Legacy Test Fixture | 3 pickle files | 0 custom identities | **Confirmed Benchmark Copy** |

---

## 4. Current Inference & Analytics Isolation Verification

1. **Inference Isolation**:
   - `backend/org_storage.py:get_encodings_path()` resolves solely to the authenticated organization's subfolder: `backend/data/orgs/{org_id}/encodings.pickle`.
   - When RMC performs facial recognition, the engine loads only RMC-specific encodings. Because RMC has no benchmark pickle files, zero benchmark identities are loaded into its KNN classifier.
2. **Dashboard & Analytics Isolation**:
   - In `backend/server.py:get_dashboard_stats()`, metrics are computed strictly from the tenant's `dataset_cleaned/orgs/{org_id}` and `employees` table where `Employee.org_id == org_id`.
   - Verified that `GET /api/dashboard` for RMC returns `total_people: 3` and `total_photos: 17`, with zero synthetic benchmark records.

---

## 5. Non-Destructive Owner-Review Cleanup Plan

In accordance with Phase 1.2 safety rules, **no existing tenant directories were moved or deleted during this automated run**. When the owner approves decommissioning of legacy test fixtures, the following procedure should be executed:

```powershell
# 1. Archive orphan benchmark copies to an external backup folder (Safe Staging)
$backupDir = "E:\RMS\archive\legacy_benchmark_tenants"
New-Item -ItemType Directory -Force -Path $backupDir

$orphanOrgs = @(
    "26cf69a0-4aa2-4b93-8733-becbb5f66f66",
    "43668307-9f70-4402-9d27-9b997bbf9f3c",
    "5254c451-f2f8-4dac-bf05-433909a96142",
    "6c4835db-e089-4194-b3fd-06eab42e61b6",
    "79d1a4ca-e7ed-4cbe-81ba-77be3ebab6cf",
    "842cd542-85c3-4630-9eb0-1cf016e5c711",
    "bcbe5bde-e7ad-4a5c-b23a-875cb154202a",
    "default",
    "local-org",
    "test-org-123"
)

foreach ($org in $orphanOrgs) {
    $src = "backend\data\orgs\$org"
    if (Test-Path $src) {
        Move-Item -Path $src -Destination "$backupDir\$org"
    }
}
```

---

## 6. Verification Status

- **Customer Data Integrity**: Verified 100% clean (RMC has 0 benchmark files, 3 genuine active personnel).
- **Inference Isolation**: Verified.
- **Destructive Deletion**: 0 customer files deleted or moved.

