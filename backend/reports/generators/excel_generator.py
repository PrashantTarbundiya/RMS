"""
Enterprise Excel (.xlsx) Report Generator — AuraPass™ Enterprise
Generates polished, multi-tab, auto-styled Excel workbooks using openpyxl.
"""

import io
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter


# Brand palette for Excel workbooks
HEADER_FILL = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
HEADER_FONT = Font(name="Calibri", size=11, bold=True, color="FFFFFF")

SECTION_FILL = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")
SECTION_FONT = Font(name="Calibri", size=11, bold=True, color="0F172A")

TITLE_FONT = Font(name="Calibri", size=16, bold=True, color="0F172A")
SUBTITLE_FONT = Font(name="Calibri", size=10, italic=True, color="64748B")

ZEBRA_FILL = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")
WHITE_FILL = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")

SUCCESS_FILL = PatternFill(start_color="ECFDF5", end_color="ECFDF5", fill_type="solid")
SUCCESS_FONT = Font(name="Calibri", size=10, bold=True, color="065F46")

WARNING_FILL = PatternFill(start_color="FEF3C7", end_color="FEF3C7", fill_type="solid")
WARNING_FONT = Font(name="Calibri", size=10, bold=True, color="92400E")

MUTED_FONT = Font(name="Calibri", size=10, color="64748B")
REGULAR_FONT = Font(name="Calibri", size=10, color="0F172A")
BOLD_FONT = Font(name="Calibri", size=10, bold=True, color="0F172A")

THIN_BORDER = Border(
    left=Side(style='thin', color='E2E8F0'),
    right=Side(style='thin', color='E2E8F0'),
    top=Side(style='thin', color='E2E8F0'),
    bottom=Side(style='thin', color='E2E8F0')
)

DOUBLE_BOTTOM_BORDER = Border(
    left=Side(style='thin', color='E2E8F0'),
    right=Side(style='thin', color='E2E8F0'),
    top=Side(style='thin', color='E2E8F0'),
    bottom=Side(style='double', color='0F172A')
)


def _autofit_columns(ws, min_width=12, max_width=45):
    """Automatically sizes column widths based on maximum content length."""
    for col in ws.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            val_str = str(cell.value or '')
            if '\n' in val_str:
                val_str = max(val_str.split('\n'), key=len)
            max_len = max(max_len, len(val_str))
        ws.column_dimensions[col_letter].width = min(max(max_len + 3, min_width), max_width)


def _build_metadata_sheet(ws, meta, overview, title_text="Executive Analytics & Biometric Report"):
    """Fills standardized Executive Summary sheet with metadata and core KPIs."""
    ws.views.sheetView[0].showGridLines = True

    # Title block
    ws['B2'] = "AuraPass™ Enterprise Platform"
    ws['B2'].font = TITLE_FONT

    ws['B3'] = f"{title_text} • Verified Corporate Export"
    ws['B3'].font = SUBTITLE_FONT

    # Metadata table
    ws['B5'] = "REPORT METADATA"
    ws['B5'].font = SECTION_FONT
    ws['B5'].fill = SECTION_FILL
    ws['C5'].fill = SECTION_FILL
    ws.merge_cells('B5:C5')

    metadata_rows = [
        ("Report Reference ID", meta.get('report_id', 'N/A')),
        ("Deploying Organization", meta.get('org_name', 'N/A')),
        ("Tenant UUID", meta.get('org_id', 'default-org')),
        ("Generation Timestamp (UTC)", meta.get('generated_at_human', 'N/A')),
        ("Reporting Period", meta.get('period_label', 'Custom Range')),
        ("Department Scope", meta.get('applied_filters', {}).get('department', 'All Departments')),
        ("Shift Baseline Time", meta.get('applied_filters', {}).get('work_start_time', '09:00')),
        ("Verification Engine", "Local Vector Enclave (Air-Gapped)"),
        ("Compliance Standard", "ISO/IEC 30107-3 / Indian DPDP Act 2023"),
    ]

    for idx, (label, val) in enumerate(metadata_rows, start=6):
        ws[f'B{idx}'] = label
        ws[f'B{idx}'].font = BOLD_FONT
        ws[f'B{idx}'].border = THIN_BORDER
        ws[f'B{idx}'].fill = ZEBRA_FILL

        ws[f'C{idx}'] = val
        ws[f'C{idx}'].font = REGULAR_FONT
        ws[f'C{idx}'].border = THIN_BORDER

    # Overview KPIs table
    start_kpi = len(metadata_rows) + 7
    ws[f'B{start_kpi}'] = "KEY PERFORMANCE INDICATORS (KPIS)"
    ws[f'B{start_kpi}'].font = SECTION_FONT
    ws[f'B{start_kpi}'].fill = SECTION_FILL
    ws[f'C{start_kpi}'].fill = SECTION_FILL
    ws.merge_cells(f'B{start_kpi}:C{start_kpi}')

    kpis = [
        ("Total Biometric Logs in Scope", overview.get('total_attendance_logs', 0)),
        ("Confirmed Identity Check-ins", overview.get('confirmed_logs', 0)),
        ("Unmatched / Guest Events", overview.get('unconfirmed_logs', 0)),
        ("Overall Recognition Rate (%)", f"{overview.get('recognition_rate', 0.0):.1f}%"),
        ("Unique Verified Attendees", overview.get('unique_attendees', 0)),
        ("Total Enrolled Staff in Scope", overview.get('total_employees', 0)),
    ]

    for idx, (label, val) in enumerate(kpis, start=start_kpi + 1):
        ws[f'B{idx}'] = label
        ws[f'B{idx}'].font = BOLD_FONT
        ws[f'B{idx}'].border = THIN_BORDER
        ws[f'B{idx}'].fill = ZEBRA_FILL

        ws[f'C{idx}'] = val
        ws[f'C{idx}'].font = REGULAR_FONT
        ws[f'C{idx}'].border = THIN_BORDER

    _autofit_columns(ws, min_width=18, max_width=50)


def _generate_analytics_excel(wb, report_data):
    """Creates multi-tab Excel workbook for Executive Analytics."""
    meta = report_data.get('metadata', {})
    overview = report_data.get('overview', {})
    depts = report_data.get('department_breakdown', {}).get('departments', [])
    late_analysis = report_data.get('late_arrival_analysis', {})

    # Tab 1: Executive Summary
    ws_sum = wb.active
    ws_sum.title = "Executive Summary"
    _build_metadata_sheet(ws_sum, meta, overview, "Executive Analytics & Biometric Verification")

    # Tab 2: Department Breakdown
    ws_dept = wb.create_sheet(title="Department Breakdown")
    ws_dept.views.sheetView[0].showGridLines = True

    dept_headers = [
        "Department Name", "Active Staff", "Total Check-ins",
        "Attendance Rate (%)", "Avg Confidence (%)"
    ]
    ws_dept.append(dept_headers)
    for col_num in range(1, len(dept_headers) + 1):
        c = ws_dept.cell(row=1, column=col_num)
        c.fill = HEADER_FILL
        c.font = HEADER_FONT
        c.alignment = Alignment(horizontal='center' if col_num > 1 else 'left')

    for row_idx, d in enumerate(depts, start=2):
        ws_dept.append([
            d.get('name', 'General'),
            d.get('employee_count', 0),
            d.get('checkin_count', 0),
            d.get('attendance_rate', 0.0),
            d.get('avg_confidence', 0.0),
        ])
        fill = ZEBRA_FILL if row_idx % 2 == 0 else WHITE_FILL
        for col_idx in range(1, len(dept_headers) + 1):
            cell = ws_dept.cell(row=row_idx, column=col_idx)
            cell.border = THIN_BORDER
            cell.font = REGULAR_FONT
            cell.fill = fill
            if col_idx in (2, 3):
                cell.alignment = Alignment(horizontal='right')
                cell.number_format = '#,##0'
            elif col_idx in (4, 5):
                cell.alignment = Alignment(horizontal='right')
                cell.number_format = '0.0"%"'

    _autofit_columns(ws_dept)

    # Tab 3: Late Arrivals Analysis
    ws_late = wb.create_sheet(title="Late Arrivals")
    ws_late.views.sheetView[0].showGridLines = True

    # Summary KPI row for late arrivals
    ws_late['A1'] = "LATE ARRIVALS METRIC SUMMARY"
    ws_late['A1'].font = SECTION_FONT
    ws_late['A1'].fill = SECTION_FILL
    ws_late.merge_cells('A1:D1')

    late_kpis = [
        ("Total First Check-ins Analyzed", late_analysis.get('total_checkins_analyzed', 0)),
        ("Late Arrivals Count", late_analysis.get('late_count', 0)),
        ("Late Arrival Rate (%)", f"{late_analysis.get('late_percentage', 0.0):.1f}%"),
        ("Average Delay (Minutes)", f"{late_analysis.get('avg_delay_minutes', 0.0):.1f} mins"),
    ]
    for idx, (lbl, val) in enumerate(late_kpis, start=2):
        ws_late[f'A{idx}'] = lbl
        ws_late[f'A{idx}'].font = BOLD_FONT
        ws_late[f'A{idx}'].fill = ZEBRA_FILL
        ws_late[f'A{idx}'].border = THIN_BORDER

        ws_late[f'B{idx}'] = val
        ws_late[f'B{idx}'].font = REGULAR_FONT
        ws_late[f'B{idx}'].border = THIN_BORDER

    # Top late employees table
    start_row = len(late_kpis) + 4
    ws_late[f'A{start_row}'] = "TOP RECURRING LATE ARRIVALS"
    ws_late[f'A{start_row}'].font = SECTION_FONT
    ws_late[f'A{start_row}'].fill = SECTION_FILL
    ws_late.merge_cells(f'A{start_row}:D{start_row}')

    tbl_headers = ["Employee Name", "Department", "Late Check-in Count", "Cumulative Delay (Mins)"]
    header_row = start_row + 1
    for c_idx, h in enumerate(tbl_headers, start=1):
        cell = ws_late.cell(row=header_row, column=c_idx, value=h)
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.alignment = Alignment(horizontal='center' if c_idx > 2 else 'left')

    top_late = late_analysis.get('top_late_employees', [])
    for r_idx, emp in enumerate(top_late, start=header_row + 1):
        ws_late.append([
            emp.get('name', 'N/A'),
            emp.get('department', 'General'),
            emp.get('late_count', 0),
            round(emp.get('total_delay_minutes', 0.0), 1)
        ])
        fill = ZEBRA_FILL if r_idx % 2 == 0 else WHITE_FILL
        for c_idx in range(1, 5):
            c = ws_late.cell(row=r_idx, column=c_idx)
            c.border = THIN_BORDER
            c.font = REGULAR_FONT
            c.fill = fill
            if c_idx in (3, 4):
                c.alignment = Alignment(horizontal='right')

    _autofit_columns(ws_late)


def _generate_attendance_excel(wb, report_data):
    """Creates multi-tab Excel workbook for Attendance Register."""
    meta = report_data.get('metadata', {})
    summary = report_data.get('summary', {})
    records = report_data.get('records', [])

    # Tab 1: Register Summary
    ws_sum = wb.active
    ws_sum.title = "Register Summary"
    overview = {
        'total_attendance_logs': summary.get('total_records', len(records)),
        'confirmed_logs': summary.get('confirmed_records', 0),
        'unconfirmed_logs': summary.get('unmatched_records', 0),
        'recognition_rate': summary.get('confirmed_percentage', 0.0),
        'unique_attendees': summary.get('unique_identities', 0),
        'total_employees': summary.get('unique_identities', 0),
    }
    _build_metadata_sheet(ws_sum, meta, overview, "Official Attendance Register")

    # Tab 2: Attendance Records
    ws_records = wb.create_sheet(title="Attendance Register")
    ws_records.views.sheetView[0].showGridLines = True

    headers = [
        "Seq #", "Log ID", "Check-in Timestamp (Local)",
        "Employee Code", "Full Name", "Department",
        "Camera / Lane", "Confidence (%)", "Status"
    ]
    ws_records.append(headers)
    for col_idx in range(1, len(headers) + 1):
        cell = ws_records.cell(row=1, column=col_idx)
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.alignment = Alignment(horizontal='center' if col_idx in (1, 8, 9) else 'left')

    for r_idx, r in enumerate(records, start=2):
        status_val = r.get('status', 'OK')
        ws_records.append([
            r.get('index', r_idx - 1),
            r.get('log_id', ''),
            r.get('timestamp_human', ''),
            r.get('employee_code', '-'),
            r.get('name', 'Unknown'),
            r.get('department', 'General'),
            r.get('camera_name', 'Lane 01'),
            r.get('confidence_pct', 0.0),
            status_val
        ])

        fill = ZEBRA_FILL if r_idx % 2 == 0 else WHITE_FILL
        for col_idx in range(1, len(headers) + 1):
            cell = ws_records.cell(row=r_idx, column=col_idx)
            cell.border = THIN_BORDER
            cell.font = REGULAR_FONT
            cell.fill = fill

            if col_idx == 1:
                cell.alignment = Alignment(horizontal='center')
            elif col_idx == 8:
                cell.alignment = Alignment(horizontal='right')
                cell.number_format = '0.0"%"'
            elif col_idx == 9:
                cell.alignment = Alignment(horizontal='center')
                if status_val == 'CONFIRMED':
                    cell.fill = SUCCESS_FILL
                    cell.font = SUCCESS_FONT
                else:
                    cell.fill = WARNING_FILL
                    cell.font = WARNING_FONT

    # Add Excel AutoFilter
    max_col = get_column_letter(len(headers))
    ws_records.auto_filter.ref = f"A1:{max_col}{len(records) + 1}"

    _autofit_columns(ws_records)


def _generate_audit_excel(wb, report_data):
    """Creates multi-tab Excel workbook for Security & Compliance Audit Trail."""
    meta = report_data.get('metadata', {})
    summary = report_data.get('summary', {})
    records = report_data.get('records', [])

    ws_sum = wb.active
    ws_sum.title = "Audit Overview"
    overview = {
        'total_attendance_logs': summary.get('total_audit_events', len(records)),
        'confirmed_logs': summary.get('access_events', 0),
        'unconfirmed_logs': summary.get('feedback_events', 0),
        'recognition_rate': 100.0,
        'unique_attendees': summary.get('consent_events', 0),
        'total_employees': 0,
    }
    _build_metadata_sheet(ws_sum, meta, overview, "Security & Compliance Audit Trail")

    ws_records = wb.create_sheet(title="Audit Events")
    ws_records.views.sheetView[0].showGridLines = True

    headers = ["Seq #", "Event Category", "Timestamp (Local)", "Details / Message", "Status / Decision"]
    ws_records.append(headers)
    for col_idx in range(1, len(headers) + 1):
        cell = ws_records.cell(row=1, column=col_idx)
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT

    for r_idx, r in enumerate(records, start=2):
        ws_records.append([
            r.get('index', r_idx - 1),
            r.get('type', 'Security Event'),
            r.get('timestamp_human', ''),
            r.get('details', ''),
            r.get('status', 'OK')
        ])
        fill = ZEBRA_FILL if r_idx % 2 == 0 else WHITE_FILL
        for col_idx in range(1, len(headers) + 1):
            cell = ws_records.cell(row=r_idx, column=col_idx)
            cell.border = THIN_BORDER
            cell.font = REGULAR_FONT
            cell.fill = fill

    _autofit_columns(ws_records)


def generate_excel_report(report_data):
    """
    Master dispatcher that creates verified multi-tab .xlsx workbooks
    matching the canonical report data structure. Returns bytes.
    """
    wb = Workbook()
    report_type = report_data.get('metadata', {}).get('report_type', 'executive_analytics')

    if report_type == 'attendance_register':
        _generate_attendance_excel(wb, report_data)
    elif report_type == 'audit_trail':
        _generate_audit_excel(wb, report_data)
    else:
        _generate_analytics_excel(wb, report_data)

    buffer = io.BytesIO()
    wb.save(buffer)
    excel_bytes = buffer.getvalue()
    buffer.close()
    return excel_bytes

