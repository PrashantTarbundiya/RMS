# AuraPass™ Enterprise — Maintenance & Operations Guide

This runbook provides Day-2 operational procedures, routine health monitoring, log rotation, database vacuuming, and recovery actions for system administrators and SREs.

---

## 1. Routine Health & Availability Checks

### 1.1 Automated Health Ping
- **Endpoint**: `GET /api/ping`
- **Expected Status**: `200 OK`
- **Payload Schema**:
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-11-02T10:00:00Z",
    "database": "connected",
    "models": {
      "facenet512": true,
      "insightface": true
    }
  }
  ```
- **CLI Check**:
  ```powershell
  python -c "import requests; r = requests.get('http://127.0.0.1:5000/api/ping'); print(r.status_code, r.json())"
  ```

---

## 2. Storage & Log Hygiene

### 2.1 Ephemeral Video Buffer Cleanup
- Temporary image debug frames (`scratch_cam*.png`) generated during testing must be purged periodically:
  ```powershell
  Remove-Item -Path "e:\RMS\scratch_cam*.png" -Force -ErrorAction SilentlyContinue
  ```

### 2.2 Application Log Rotation
- Server logs located in `backend/logs/` or container standard out.
- Ensure log size does not exceed $500\text{MB}$. Rotate logs with 14-day retention.

---

## 3. Database Maintenance (SQLite & PostgreSQL)

### 3.1 SQLite WAL Checkpoint & Vacuum
For local sovereign installations:
```python
import sqlite3
conn = sqlite3.connect('backend/data/rms.db')
conn.execute("PRAGMA wal_checkpoint(TRUNCATE);")
conn.execute("VACUUM;")
conn.close()
```

### 3.2 Backup & Snapshot Verification
1. Create automatic organization snapshot:
   - Call `POST /api/models/snapshots/create` with org admin authorization.
   - Verifies snapshot written to `backend/data/orgs/<org_id>/snapshots/`.
2. Off-site Backup:
   - Archive `backend/data/rms.db` and `dataset_cleaned/orgs/` to encrypted external volume.

---

## 4. Antigravity AI Engineering Environment Maintenance
1. **Skill Discovery Health Check**:
   - Verify all 51 skills in `.agents/skills/` have valid YAML frontmatter:
     ```powershell
     python -c "import glob; [open(s).read() for s in glob.glob('.agents/skills/*/SKILL.md')]; print('Skills OK')"
     ```
2. **MCP Connectivity Verification**:
   - Inspect active MCP servers:
     ```powershell
     python -c "import json; print(list(json.load(open(r'C:\Users\VATSAL\.gemini\config\mcp_config.json'))['mcpServers'].keys()))"
     ```

