"""
AuraPass™ Enterprise — Global Reporting & Export Architecture
Canonical report data models, filter validators, and format-specific document generators.
"""

from .validators import (
    ReportValidationError,
    parse_and_validate_dates,
    validate_department,
    validate_export_format,
    validate_work_start_time
)
from .data_service import (
    get_canonical_analytics_data,
    get_canonical_attendance_register_data,
    get_canonical_audit_trail_data
)
from .generators.pdf_generator import generate_pdf_report
from .generators.excel_generator import generate_excel_report
from .generators.csv_generator import generate_csv_report
from .generators.json_generator import generate_json_report

__all__ = [
    'ReportValidationError',
    'parse_and_validate_dates',
    'validate_department',
    'validate_export_format',
    'validate_work_start_time',
    'get_canonical_analytics_data',
    'get_canonical_attendance_register_data',
    'get_canonical_audit_trail_data',
    'generate_pdf_report',
    'generate_excel_report',
    'generate_csv_report',
    'generate_json_report',
]

