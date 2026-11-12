"""
AuraPass™ Enterprise — Global Export Architecture Automated Verification Suite
Validates filter boundaries, mathematical invariant reconciliation,
anti-injection defenses, and multi-format compilation across PDF, XLSX, CSV, and JSON.
"""

import sys
import os
import io
import csv
import json
import unittest
from datetime import datetime, date, timedelta, timezone

# Add backend directory to sys.path
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from reports.validators import (
    parse_and_validate_dates,
    validate_department,
    validate_export_format,
    validate_work_start_time,
    ReportValidationError
)
from reports.generators import (
    generate_pdf_report,
    generate_excel_report,
    generate_csv_report,
    generate_json_report,
)
from reports.generators.pdf_generator import generate_legal_pdf
import openpyxl


class TestReportValidators(unittest.TestCase):
    """Verifies strict parameter and date boundary validation."""

    def test_standard_periods(self):
        # Daily
        s, e, label = parse_and_validate_dates('daily')
        self.assertEqual(s.date(), datetime.now().date())
        self.assertEqual(e.hour, 23)
        self.assertEqual(e.minute, 59)
        self.assertEqual(e.second, 59)

        # Yesterday
        s, e, label = parse_and_validate_dates('yesterday')
        expected_y = (datetime.now() - timedelta(days=1)).date()
        self.assertEqual(s.date(), expected_y)
        self.assertEqual(e.date(), expected_y)

        # Past 7 Days
        s, e, label = parse_and_validate_dates('past7days')
        self.assertTrue(s < e)
        self.assertEqual((e.date() - s.date()).days, 6)

        # Monthly
        s, e, label = parse_and_validate_dates('monthly')
        self.assertEqual(s.day, 1)

        # All time
        s, e, label = parse_and_validate_dates('all')
        self.assertIsNone(s)
        self.assertIsNone(e)

    def test_custom_range_validation(self):
        # Valid range
        s, e, label = parse_and_validate_dates(
            start_date_str='2026-11-01',
            end_date_str='2026-11-05'
        )
        self.assertEqual(s.date(), date(2026, 11, 1))
        self.assertEqual(e.date(), date(2026, 11, 5))
        self.assertEqual(e.hour, 23)
        self.assertEqual(e.minute, 59)
        self.assertEqual(e.second, 59)

        # Missing end date
        with self.assertRaises(ReportValidationError) as ctx:
            parse_and_validate_dates(start_date_str='2026-11-01')
        self.assertEqual(ctx.exception.field, 'end_date')

        # Inverted range: start > end
        with self.assertRaises(ReportValidationError) as ctx:
            parse_and_validate_dates(
                start_date_str='2026-11-10',
                end_date_str='2026-11-01'
            )
        self.assertIn(ctx.exception.field, ('end_date', 'date_range'))

    def test_format_validation(self):
        self.assertEqual(validate_export_format('PDF'), 'pdf')
        self.assertEqual(validate_export_format('xlsx'), 'xlsx')
        self.assertEqual(validate_export_format('CSV'), 'csv')
        self.assertEqual(validate_export_format('json'), 'json')

        with self.assertRaises(ReportValidationError):
            validate_export_format('docx')

    def test_work_start_time_validation(self):
        h, m = validate_work_start_time(9, 30)
        self.assertEqual((h, m), (9, 30))

        h, m = validate_work_start_time("10", "15")
        self.assertEqual((h, m), (10, 15))

        # Out of bounds
        with self.assertRaises(ReportValidationError):
            validate_work_start_time(25, 0)
        with self.assertRaises(ReportValidationError):
            validate_work_start_time(9, 70)


class TestCanonicalReportGenerators(unittest.TestCase):
    """Verifies that all 4 formats correctly synthesize data and enforce security invariants."""

    def setUp(self):
        # Canonical test dataset satisfying all mathematical invariants
        self.canonical_analytics = {
            'metadata': {
                'report_id': 'AP-ANL-20261106-TEST01',
                'report_type': 'executive_analytics',
                'product_name': 'AuraPass™ Enterprise',
                'generated_at': '2026-11-06T12:00:00Z',
                'generated_at_human': '2026-11-06 12:00:00 UTC',
                'org_id': 'test-org-01',
                'org_name': 'Acme Biometrics Global',
                'period_label': 'Past 7 Days (2026-10-31 to 2026-11-06)',
                'applied_filters': {
                    'department': 'All Departments',
                    'work_start_time': '09:00',
                }
            },
            'overview': {
                'total_employees': 25,
                'total_attendance_logs': 120,
                'confirmed_logs': 114,
                'unconfirmed_logs': 6,
                'recognition_rate': 95.0,
                'unique_attendees': 24,
            },
            'department_breakdown': {
                'departments': [
                    {
                        'name': 'Engineering',
                        'employee_count': 15,
                        'checkin_count': 75,
                        'attendance_rate': 96.0,
                        'avg_confidence': 98.4,
                    },
                    {
                        'name': 'Operations',
                        'employee_count': 10,
                        'checkin_count': 45,
                        'attendance_rate': 92.0,
                        'avg_confidence': 97.1,
                    }
                ],
                'unassigned': None,
                'total_departments': 2,
            },
            'late_arrival_analysis': {
                'work_start': '09:00',
                'total_checkins_analyzed': 114,
                'late_count': 8,
                'late_percentage': 7.0,
                'avg_delay_minutes': 14.5,
                'by_day_of_week': [],
                'top_late_employees': [
                    {'name': 'Alex Mercer', 'department': 'Engineering', 'late_count': 3, 'total_delay_minutes': 45.0},
                    {'name': 'Sarah Connor', 'department': 'Operations', 'late_count': 2, 'total_delay_minutes': 28.0},
                ],
                'trend_by_week': [],
            },
            'heatmap': {'heatmap': [], 'peak_day': 'Monday', 'peak_hour': 9, 'peak_value': 32}
        }

        self.canonical_attendance = {
            'metadata': {
                'report_id': 'AP-ATT-20261106-TEST02',
                'report_type': 'attendance_register',
                'product_name': 'AuraPass™ Enterprise',
                'generated_at_human': '2026-11-06 12:00:00 UTC',
                'org_name': 'Acme Biometrics Global',
                'period_label': 'Daily Register (2026-11-06)',
            },
            'summary': {
                'total_records': 3,
                'confirmed_records': 3,
                'unmatched_records': 0,
                'confirmed_percentage': 100.0,
                'unique_identities': 2,
            },
            'records': [
                {
                    'index': 1,
                    'log_id': 'log-001',
                    'timestamp_human': '2026-11-06 08:55:12',
                    'employee_code': 'EMP-101',
                    'name': 'Alex Mercer',
                    'department': 'Engineering',
                    'camera_name': 'Lane 01 (Turnstile A)',
                    'confidence_pct': 99.2,
                    'status': 'CONFIRMED'
                },
                {
                    'index': 2,
                    'log_id': 'log-002',
                    'timestamp_human': '2026-11-06 09:12:45',
                    'employee_code': 'EMP-102',
                    'name': 'Sarah Connor',
                    'department': 'Operations',
                    'camera_name': 'Lane 02 (Main Gate)',
                    'confidence_pct': 98.7,
                    'status': 'CONFIRMED'
                },
                {
                    'index': 3,
                    'log_id': 'log-003',
                    'timestamp_human': '2026-11-06 09:15:00',
                    'employee_code': '=1+1', # Dangerous formula injection candidate
                    'name': '@DangerousName',
                    'department': '+Fin',
                    'camera_name': '-Lane03',
                    'confidence_pct': 88.5,
                    'status': 'CONFIRMED'
                }
            ]
        }

    def test_pdf_compilation(self):
        # 1. Executive Analytics PDF
        pdf_bytes = generate_pdf_report(self.canonical_analytics)
        self.assertIsInstance(pdf_bytes, bytes)
        self.assertTrue(len(pdf_bytes) > 2000)
        self.assertTrue(pdf_bytes.startswith(b'%PDF-'))

        # 2. Attendance Register Landscape PDF
        att_pdf_bytes = generate_pdf_report(self.canonical_attendance)
        self.assertIsInstance(att_pdf_bytes, bytes)
        self.assertTrue(len(att_pdf_bytes) > 2000)
        self.assertTrue(att_pdf_bytes.startswith(b'%PDF-'))

        # 3. Legal Document PDF (Terms & Privacy)
        terms_pdf = generate_legal_pdf(doc_type='terms', org_name='Acme Biometrics Global')
        self.assertTrue(terms_pdf.startswith(b'%PDF-'))

        privacy_pdf = generate_legal_pdf(doc_type='privacy', org_name='Acme Biometrics Global')
        self.assertTrue(privacy_pdf.startswith(b'%PDF-'))

    def test_excel_multi_tab_workbook(self):
        xlsx_bytes = generate_excel_report(self.canonical_analytics)
        self.assertIsInstance(xlsx_bytes, bytes)
        self.assertTrue(len(xlsx_bytes) > 1000)

        # Parse with openpyxl to verify workbook structure
        wb = openpyxl.load_workbook(io.BytesIO(xlsx_bytes))
        expected_sheets = ["Executive Summary", "Department Breakdown", "Late Arrivals"]
        self.assertEqual(wb.sheetnames, expected_sheets)

        # Verify Executive Summary sheet contents
        ws_sum = wb["Executive Summary"]
        self.assertIn("AuraPass™ Enterprise Platform", ws_sum['B2'].value)
        self.assertIn("AP-ANL-20261106-TEST01", ws_sum['C6'].value)

        # Verify Department sheet
        ws_dept = wb["Department Breakdown"]
        self.assertEqual(ws_dept['A1'].value, "Department Name")
        self.assertEqual(ws_dept['A2'].value, "Engineering")
        self.assertEqual(ws_dept['C2'].value, 75)

    def test_csv_rfc4180_and_injection_defense(self):
        # Generate attendance CSV with formula injection strings
        csv_bytes = generate_csv_report(self.canonical_attendance)
        self.assertIsInstance(csv_bytes, bytes)

        # Verify UTF-8 BOM
        self.assertTrue(csv_bytes.startswith(b'\xef\xbb\xbf'))

        # Decode and parse with standard CSV reader
        csv_text = csv_bytes.decode('utf-8-sig')
        reader = list(csv.reader(io.StringIO(csv_text)))
        self.assertEqual(len(reader), 4) # 1 header + 3 data rows

        # Verify that cells starting with '=', '@', '+', '-' have been sanitized with leading quote
        row3 = reader[3]
        emp_code = row3[3]
        emp_name = row3[4]
        dept = row3[5]
        cam = row3[6]

        self.assertTrue(emp_code.startswith("'="), f"Expected '=1+1' to be sanitized to ''=1+1', got {emp_code}")
        self.assertTrue(emp_name.startswith("'@"), f"Expected '@DangerousName' to be sanitized, got {emp_name}")
        self.assertTrue(dept.startswith("'+"), f"Expected '+Fin' to be sanitized, got {dept}")
        self.assertTrue(cam.startswith("'-"), f"Expected '-Lane03' to be sanitized, got {cam}")

    def test_json_schema_v2_and_deterministic_checksum(self):
        json_bytes = generate_json_report(self.canonical_analytics)
        self.assertIsInstance(json_bytes, bytes)

        data = json.loads(json_bytes.decode('utf-8'))
        self.assertEqual(data['metadata']['schema_version'], "2.0")
        self.assertIn('integrity_checksum_sha256', data['metadata'])
        self.assertEqual(len(data['metadata']['integrity_checksum_sha256']), 64)

        # Verify mathematical consistency
        ov = data['overview']
        self.assertEqual(ov['confirmed_logs'] + ov['unconfirmed_logs'], ov['total_attendance_logs'])
        self.assertEqual(ov['recognition_rate'], 95.0)

        # Verify late analysis metrics
        late = data['late_arrival_analysis']
        self.assertEqual(late['total_checkins_analyzed'], 114)
        self.assertEqual(late['late_count'], 8)
        self.assertGreater(late['total_checkins_analyzed'], 0)


if __name__ == '__main__':
    unittest.main()
