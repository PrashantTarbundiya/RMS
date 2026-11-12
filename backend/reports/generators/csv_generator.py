"""
Enterprise CSV Report Generator — AuraPass™ Enterprise
Generates RFC-4180 compliant CSV exports with UTF-8 BOM encoding for Excel compatibility
and formula injection sanitization (CWE-1236).
"""

import io
import csv


def _sanitize_csv_cell(value):
    """
    Prevents CSV Formula Injection (CWE-1236) when opening files in spreadsheet software.
    Prepends a single quote to strings starting with dangerous formula triggers.
    """
    if value is None:
        return ""
    s = str(value)
    if s.startswith(('=', '+', '-', '@', '\t', '\r')):
        return "'" + s
    return s


def _generate_attendance_csv(report_data):
    """Generates standard attendance log CSV stream."""
    records = report_data.get('records', [])
    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

    # Headers
    headers = [
        "Sequence", "Log ID", "Check-in Timestamp (Local)", "Employee Code",
        "Employee Name", "Department", "Camera / Lane", "Confidence (%)", "Status"
    ]
    writer.writerow([_sanitize_csv_cell(h) for h in headers])

    for r in records:
        writer.writerow([
            _sanitize_csv_cell(r.get('index', '')),
            _sanitize_csv_cell(r.get('log_id', '')),
            _sanitize_csv_cell(r.get('timestamp_human', '')),
            _sanitize_csv_cell(r.get('employee_code', '-')),
            _sanitize_csv_cell(r.get('name', 'Unknown')),
            _sanitize_csv_cell(r.get('department', 'General')),
            _sanitize_csv_cell(r.get('camera_name', 'Lane 01')),
            _sanitize_csv_cell(f"{r.get('confidence_pct', 0.0):.1f}%"),
            _sanitize_csv_cell(r.get('status', 'OK')),
        ])

    return output.getvalue().encode('utf-8-sig')


def _generate_analytics_csv(report_data):
    """Generates executive analytics report CSV stream."""
    meta = report_data.get('metadata', {})
    overview = report_data.get('overview', {})
    depts = report_data.get('department_breakdown', {}).get('departments', [])
    late = report_data.get('late_arrival_analysis', {})

    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

    # Section 1: Metadata
    writer.writerow(["# AuraPass™ Enterprise Executive Analytics Export"])
    writer.writerow(["Report ID", _sanitize_csv_cell(meta.get('report_id', 'N/A'))])
    writer.writerow(["Organization", _sanitize_csv_cell(meta.get('org_name', 'N/A'))])
    writer.writerow(["Generated At (UTC)", _sanitize_csv_cell(meta.get('generated_at_human', 'N/A'))])
    writer.writerow(["Period", _sanitize_csv_cell(meta.get('period_label', 'All-Time'))])
    writer.writerow(["Department Filter", _sanitize_csv_cell(meta.get('applied_filters', {}).get('department', 'All'))])
    writer.writerow(["Shift Baseline Time", _sanitize_csv_cell(meta.get('applied_filters', {}).get('work_start_time', '09:00'))])
    writer.writerow([])

    # Section 2: KPIs
    writer.writerow(["# KEY PERFORMANCE INDICATORS"])
    writer.writerow(["Total Biometric Logs", overview.get('total_attendance_logs', 0)])
    writer.writerow(["Confirmed Check-ins", overview.get('confirmed_logs', 0)])
    writer.writerow(["Unconfirmed Logs", overview.get('unconfirmed_logs', 0)])
    writer.writerow(["Overall Recognition Rate (%)", f"{overview.get('recognition_rate', 0.0):.1f}%"])
    writer.writerow(["Unique Attendees", overview.get('unique_attendees', 0)])
    writer.writerow(["Enrolled Staff", overview.get('total_employees', 0)])
    writer.writerow([])

    # Section 3: Department Breakdown
    writer.writerow(["# DEPARTMENT BREAKDOWN"])
    writer.writerow(["Department Name", "Active Staff", "Check-ins", "Attendance Rate (%)", "Avg Confidence (%)"])
    for d in depts:
        writer.writerow([
            _sanitize_csv_cell(d.get('name', 'General')),
            d.get('employee_count', 0),
            d.get('checkin_count', 0),
            f"{d.get('attendance_rate', 0.0):.1f}%",
            f"{d.get('avg_confidence', 0.0):.1f}%",
        ])
    writer.writerow([])

    # Section 4: Late Arrivals
    writer.writerow(["# LATE ARRIVALS ANALYSIS"])
    writer.writerow(["Total First Check-ins Analyzed", late.get('total_checkins_analyzed', 0)])
    writer.writerow(["Late Count", late.get('late_count', 0)])
    writer.writerow(["Late Percentage (%)", f"{late.get('late_percentage', 0.0):.1f}%"])
    writer.writerow(["Average Delay (Minutes)", f"{late.get('avg_delay_minutes', 0.0):.1f}"])
    writer.writerow([])

    top_late = late.get('top_late_employees', [])
    if top_late:
        writer.writerow(["Top Late Employees", "Department", "Late Count", "Total Delay (Mins)"])
        for emp in top_late:
            writer.writerow([
                _sanitize_csv_cell(emp.get('name', 'N/A')),
                _sanitize_csv_cell(emp.get('department', 'General')),
                emp.get('late_count', 0),
                round(emp.get('total_delay_minutes', 0.0), 1),
            ])

    return output.getvalue().encode('utf-8-sig')


def _generate_audit_csv(report_data):
    """Generates security audit trail CSV stream."""
    records = report_data.get('records', [])
    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

    writer.writerow(["# AuraPass™ Enterprise Security Audit Trail"])
    writer.writerow(["Sequence", "Event Category", "Timestamp (Local)", "Details", "Status / Decision"])

    for r in records:
        writer.writerow([
            _sanitize_csv_cell(r.get('index', '')),
            _sanitize_csv_cell(r.get('type', 'Security Event')),
            _sanitize_csv_cell(r.get('timestamp_human', '')),
            _sanitize_csv_cell(r.get('details', '')),
            _sanitize_csv_cell(r.get('status', 'OK')),
        ])

    return output.getvalue().encode('utf-8-sig')


def generate_csv_report(report_data):
    """Master dispatcher returning UTF-8-BOM encoded CSV bytes."""
    report_type = report_data.get('metadata', {}).get('report_type', 'executive_analytics')
    if report_type == 'attendance_register':
        return _generate_attendance_csv(report_data)
    elif report_type == 'audit_trail':
        return _generate_audit_csv(report_data)
    else:
        return _generate_analytics_csv(report_data)

