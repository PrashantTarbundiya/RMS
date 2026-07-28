import sys
import os
import datetime
from analytics import generate_pdf_report

print("Testing PDF Generation with Large Volume (100+ Employees)...")

# Mock large dataset in memory test
from unittest.mock import patch, MagicMock

# Create 120 mock employees across 5 departments
departments = ['Engineering', 'Human Resources', 'Sales', 'Marketing', 'Operations']
mock_depts = []
for i, d in enumerate(departments):
    mock_depts.append({
        'name': d,
        'total_employees': 24,
        'total_checkins': 1420 + i*150,
        'avg_attendance_rate': 91.5 + i,
        'avg_confidence': 0.88 + i*0.01,
    })

mock_report_data = {
    'org_id': 'org_large_test',
    'org_name': 'Global Tech Enterprise Corp',
    'generated_at': datetime.datetime.now().isoformat(),
    'overview': {
        'total_employees': 120,
        'total_attendance_logs': 7840,
        'confirmed_logs': 7520,
        'recognition_rate': 95.9,
    },
    'department_breakdown': {
        'departments': mock_depts
    },
    'late_arrival_analysis': {
        'total_logs': 7840,
        'late_count': 342,
        'late_percentage': 4.36,
        'avg_delay_minutes': 14.2
    }
}

with patch('analytics.generate_report_data', return_value=mock_report_data):
    pdf_bytes = generate_pdf_report('org_large_test', start_date=datetime.datetime(2026, 1, 1), end_date=datetime.datetime(2026, 7, 25))

print(f"Successfully generated PDF report ({len(pdf_bytes)} bytes)")
with open('large_test_report.pdf', 'wb') as f:
    f.write(pdf_bytes)

print("Saved large_test_report.pdf successfully.")
