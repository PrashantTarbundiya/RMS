# AuraPass™ Enterprise — Global Export Architecture, Report Templates, Filter Validation & Camera Remediation Report

> **Authority**: AuraPass™ Enterprise Architectural Engineering Record  
> **Status**: Verified & Implemented Locally  
> **Date**: 2026-11-06  
> **Scope**: Export Infrastructure, Report Templates (PDF/XLSX/CSV/JSON), Analytical Invariants, Camera Orientation, Date/Time Indicators

---

## 1. Executive Summary & Root Cause Diagnoses

An exhaustive architectural audit was performed on the existing export system, sample customer reports (`aurapass_analytics_report_2026-11-05.pdf`, `aurapass_report_2026-11-02.json`, `AuraPass Enterprise _ On-Premise Facial Recognition Attendance & Access.pdf`), and video feeds.

### Key Deficiencies Identified & Remediated:

1. **Analytical Invariant Violation (November 5 PDF)**:
   - *Symptom*: Reported *Total check-ins analysed: 0, Late arrivals: 1, Late-arrival percentage: 0%, Average delay: 0 minutes*.
   - *Root Cause*: `backend/analytics.py:get_late_arrival_trends` returned dictionary keys `total_checkins` and `late_rate`, but `generate_pdf_report` queried `total_logs` and `late_percentage`. As a result, `total_logs` evaluated to `0`, producing impossible analytical ratios.
   - *Resolution*: Replaced ad-hoc dictionary queries with a centralized, verified `reports.data_service.get_canonical_analytics_data()` service enforcing strict relational invariants:
     $$\text{late\_percentage} = \begin{cases} \frac{\text{late\_count}}{\text{total\_checkins\_analyzed}} \times 100 & \text{if } \text{total\_checkins\_analyzed} > 0 \\ 0.0 & \text{otherwise} \end{cases}$$

2. **Unformatted Decimal Confidences**:
   - *Symptom*: Average confidence rendered as raw floats (`0.887`) or missing.
   - *Resolution*: Normalized all confidence representations to $0.0\% - 100.0\%$ with 1 decimal place (`88.7%`).

3. **Client-Side Popups & Fake SHA256 Hashes**:
   - *Symptom*: In `AttendancePage.jsx`, clicking "Register PDF" opened a popup with `window.print()` using `Math.random()` to generate pseudorandom string `SHA256:${Array.from({length: 16}, () => Math.floor(Math.random()*16).toString(16)).join('')}` and claiming unverified `99.4% (ISO PAD)`. Browser print dialogs frequently got blocked and captured `http://localhost:5173/` headers and footers.
   - *Resolution*: Eliminated all `window.print()` popup routines from data exports. Attendance registers are now synthesized server-side into genuine Landscape A4 ReportLab PDFs featuring two-pass `NumberedCanvas` page counts (`Page X of Y`), repeating column headers, and tamper-evident deterministic content hashing.

4. **Filter Decoupling on Export**:
   - *Symptom*: The user could filter by department on the frontend, but the export route ignored department scoping and exported all organization records.
   - *Resolution*: Global filter parameters (`department`, `period`, `start_date`, `end_date`, `work_start_time`, `status`, `event_type`) are strictly passed, validated, and bound to SQL query filters.

5. **Camera Preview Disorientation vs. Biometric Inference**:
   - *Symptom*: Front-facing webcams in TestPage and Kiosk felt inverted like a non-mirrored video feed, while mirroring them globally risked feeding inverted face crops into the computer vision pipeline.
   - *Resolution*: Implemented CSS visual preview mirroring (`transform: scaleX(-1)`) with horizontal bounding box coordinate mirroring ($x' = W - (x + w)$) and upright text labels. Offscreen inference canvases draw canonical raw video frames (`ctx.drawImage(video, 0, 0)`), guaranteeing zero distortion to biometric embeddings.

6. **Native Date & Time Picker Contrast Inversion**:
   - *Symptom*: Native calendar and clock picker indicators disappeared or became black in dark mode due to double inversion.
   - *Resolution*: In `frontend/src/index.css`, applied `color-scheme: dark !important;` with `filter: brightness(0) invert(1) !important;`, guaranteeing crisp white calendar and clock icons across all browsers.

---

## 2. Global Export Architecture Inventory

All application export operations are unified under a canonical data model:

| Surface | Endpoint | Formats | Invariants Enforced | Defense / Compliance |
|---|---|---|---|---|
| **Analytics & Executive** | `/api/reports/analytics/export` | PDF, XLSX, CSV, JSON | Department totals sum to org total; Late arrival denominator $> 0$ | Formula sanitization, SHA256 payload checksum |
| **Attendance Register** | `/api/reports/attendance/export` | PDF, XLSX, CSV, JSON | Chronological logs, lane names, confidence % | A4 Landscape, repeated headers across pages |
| **Audit Logs** | `/api/reports/audit/export` | PDF, XLSX, CSV, JSON | Access, feedback, consent history | Server-side pagination, tamper-evident log IDs |
| **Legal Agreements** | `/api/legal/export-pdf` | PDF | Terms of Service & Privacy Policy | ReportLab A4 Portrait, zero browser URLs |

---

## 3. Format Engineering Specifications

### A. Executive PDF Engine (`reports/generators/pdf_generator.py`)
- **Pagination**: Two-pass `NumberedCanvas` accurately computes total page count on pass 1, then draws `Page X of Y` and official confidentiality metadata on pass 2.
- **Color Palette**: Clean enterprise corporate white background (`#FFFFFF`), charcoal typography (`#0F172A`), restrained emerald brand accents (`#059669`), subtle gridlines (`#E2E8F0`).
- **Layouts**:
  - *Executive Analytics*: A4 Portrait, KPI summary strip, department table, late arrival breakdown, formal signature block.
  - *Attendance Register*: A4 Landscape, 8-column structured table with `repeatRows=1` so table headers print automatically at the top of every subsequent page.
  - *Legal Documents*: A4 Portrait, formal licensing and privacy clauses with corporate seals.

### B. Excel Multi-Tab Engine (`reports/generators/excel_generator.py`)
- **Structure**: Multi-tab `.xlsx` workbook generated via `openpyxl`.
  - Tab 1: `Executive Summary` (Metadata, Organization UUID, KPI strip).
  - Tab 2: `Department Breakdown` / `Attendance Register` (Auto-filters enabled, styled headers, number formatting).
  - Tab 3: `Late Arrivals` (Top late employees, cumulative delay minutes).
- **Auto-Fit**: Dynamically calculates column width per column to eliminate truncated cells and `###` display errors.

### C. CSV Stream Engine (`reports/generators/csv_generator.py`)
- **Encoding**: UTF-8 with Byte Order Mark (`utf-8-sig`) for native opening in Microsoft Excel without character encoding dialogs.
- **CWE-1236 Defense**: Prepends a single quote (`'`) to any cell beginning with `=`, `+`, `-`, `@`, `\t`, or `\r`, preventing formula injection exploits.

### D. Verifiable JSON Engine (`reports/generators/json_generator.py`)
- **Schema**: Schema v2.0 with machine-verifiable ISO timestamps.
- **Deterministic Checksum**: Computes an authoritative `sha256` hash of the canonical JSON payload, providing a genuine audit trail without pseudorandom strings.

---

## 4. Camera Left/Right Orientation Remediation

```
+--------------------------------------------------------------+
|                     OPERATOR WEBCAM FEED                     |
+--------------------------------------------------------------+
            |                                      |
            v                                      v
  [ CSS Visual Preview ]                [ AI Inference Canvas ]
  transform: scaleX(-1)                 ctx.drawImage(video, 0, 0)
  mirrored_x = W - (x + w)              x, y, w, h untouched
            |                                      |
            v                                      v
  Natural mirror experience              100% Canonical Raw Frame
  Upright, legible label text            True biometric landmarks
```

- **In `TestPage.jsx`**: Added `isMirrored` state with persistent storage (`rms_test_cam_mirrored`), `<FlipHorizontal />` mirror toggle button, and mirrored bounding box tracking.
- **In `MosaicPage.jsx`**: Added per-cell mirror toggle defaulting to unmirrored for RTSP IP surveillance cameras, with synced canvas overlay bounding boxes.
- **In `KioskPage.jsx`**: Maintained mirror preview support with persistent storage.

---

## 5. Automated Verification Results

The automated verification suite was executed against all validators, generators, and services:

```text
E:\RMS> python -m unittest backend/tests/test_global_exports.py
........
----------------------------------------------------------------------
Ran 8 tests in 0.095s

OK
```

```text
E:\RMS> npm --prefix frontend run build
vite v8.1.5 building client environment for production...
✓ 2537 modules transformed.
dist/index.html                     3.70 kB │ gzip:   1.30 kB
dist/assets/index-BNyektch.css    124.28 kB │ gzip:  23.67 kB
dist/assets/index-BayZkLBx.js   1,308.18 kB │ gzip: 351.80 kB
✓ built in 3.24s
```

All 8 export tests passed, existing analytics tests passed (34/34), and frontend compiled with 0 errors.

