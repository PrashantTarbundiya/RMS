"""
Report Filter Validation Module — AuraPass™ Enterprise
Enforces strict date range integrity, tenant-scoped department validation,
and export parameter validation.
"""

from datetime import datetime, date, time, timedelta, timezone
import re
import logging

logger = logging.getLogger('aurapass.reporting.validators')

class ReportValidationError(ValueError):
    """Raised when export filters or parameters fail validation."""
    def __init__(self, message, field=None, code='INVALID_FILTER'):
        super().__init__(message)
        self.message = message
        self.field = field
        self.code = code

    def to_dict(self):
        return {
            'error': self.message,
            'field': self.field,
            'code': self.code,
            'status': 'error'
        }


def parse_and_validate_dates(start_str=None, end_str=None, period=None, allow_all_time=True, **kwargs):
    """
    Validates and normalizes date ranges with strict business rules.
    Supports kwargs start_date_str, end_date_str, and auto-detects period if passed as first arg.

    Rules:
    1. Period takes precedence if supplied ('daily', 'today', 'yesterday', 'past7days', 'monthly', 'yearly', 'all').
    2. If neither period nor custom dates are provided:
       - If allow_all_time is True: returns (None, None, 'All-Time Historical')
       - Else: raises ReportValidationError
    3. If custom dates are provided:
       - BOTH start_date and end_date must be provided.
       - start_date <= end_date.
       - End date boundary is set to 23:59:59.999999 (inclusive day).
       - Invalid strings raise ReportValidationError.

    Returns:
        (datetime_start or None, datetime_end or None, period_label: str)
    """
    # Handle keyword aliases
    if 'start_date_str' in kwargs:
        start_str = kwargs['start_date_str']
    if 'end_date_str' in kwargs:
        end_str = kwargs['end_date_str']

    # Auto-detect if period was passed as first positional arg
    PERIOD_NAMES = ('today', 'daily', 'yesterday', 'past7days', '7d', 'week', 'monthly',
                    'current_month', 'this_month', 'yearly', 'current_year', 'annual', 'all', 'all_time')
    if start_str and (start_str.lower().strip() in PERIOD_NAMES) and not period:
        period = start_str
        start_str = None
    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)

    normalized_period = (period or '').lower().strip()

    if normalized_period in ('today', 'daily'):
        return today_start, today_end, f"Daily Register ({today_start.strftime('%Y-%m-%d')})"

    elif normalized_period == 'yesterday':
        y_start = today_start - timedelta(days=1)
        y_end = today_end - timedelta(days=1)
        return y_start, y_end, f"Yesterday ({y_start.strftime('%Y-%m-%d')})"

    elif normalized_period in ('past7days', '7d', 'week'):
        week_start = today_start - timedelta(days=6)
        return week_start, today_end, f"Past 7 Days ({week_start.strftime('%Y-%m-%d')} to {today_start.strftime('%Y-%m-%d')})"

    elif normalized_period in ('monthly', 'current_month', 'this_month'):
        month_start = today_start.replace(day=1)
        return month_start, today_end, f"Monthly Reconciliation ({month_start.strftime('%Y-%m-01')} to {today_start.strftime('%Y-%m-%d')})"

    elif normalized_period in ('yearly', 'current_year', 'annual'):
        year_start = today_start.replace(month=1, day=1)
        return year_start, today_end, f"Annual Audit ({year_start.strftime('%Y-01-01')} to {today_start.strftime('%Y-%m-%d')})"

    elif normalized_period in ('all', 'all_time'):
        return None, None, f"All-Time Historical (Through {today_start.strftime('%Y-%m-%d')})"

    # Custom date parsing
    clean_start = (start_str or '').strip()
    clean_end = (end_str or '').strip()

    if clean_start and not clean_end:
        raise ReportValidationError(
            "Please select an end date for the custom report range.",
            field="end_date",
            code="MISSING_END_DATE"
        )

    if clean_end and not clean_start:
        raise ReportValidationError(
            "Please select a start date for the custom report range.",
            field="start_date",
            code="MISSING_START_DATE"
        )

    if not clean_start and not clean_end:
        if allow_all_time:
            return None, None, f"All-Time Historical (Through {today_start.strftime('%Y-%m-%d')})"
        raise ReportValidationError(
            "Please select a date range or standard period.",
            field="date_range",
            code="MISSING_DATE_RANGE"
        )

    # Parse both custom dates
    try:
        if 'T' in clean_start:
            dt_start = datetime.fromisoformat(clean_start)
        else:
            d = date.fromisoformat(clean_start)
            dt_start = datetime.combine(d, time.min)
    except (ValueError, TypeError):
        raise ReportValidationError(
            f"Invalid start date format: '{clean_start}'. Expected YYYY-MM-DD.",
            field="start_date",
            code="INVALID_DATE_FORMAT"
        )

    try:
        if 'T' in clean_end:
            dt_end = datetime.fromisoformat(clean_end)
        else:
            d = date.fromisoformat(clean_end)
            dt_end = datetime.combine(d, time.max)
    except (ValueError, TypeError):
        raise ReportValidationError(
            f"Invalid end date format: '{clean_end}'. Expected YYYY-MM-DD.",
            field="end_date",
            code="INVALID_DATE_FORMAT"
        )

    if dt_start > dt_end:
        raise ReportValidationError(
            f"End date ({dt_end.strftime('%Y-%m-%d')}) cannot be earlier than start date ({dt_start.strftime('%Y-%m-%d')}).",
            field="end_date",
            code="INVALID_DATE_RANGE_ORDER"
        )

    label = f"{dt_start.strftime('%Y-%m-%d')} to {dt_end.strftime('%Y-%m-%d')}"
    return dt_start, dt_end, label


def validate_department(department_name=None, org_id=None, db_session=None, **kwargs):
    """
    Validates that a department belongs to the authenticated organization.
    Accepts (department_name, org_id), (org_id, department_name), or with db_session.
    Returns the validated department name, or raises ReportValidationError.
    """
    if 'org_id' in kwargs and not org_id:
        org_id = kwargs['org_id']

    # Auto-detect swapped arguments: if first argument looks like org_id
    if department_name and isinstance(department_name, str) and (
        department_name.startswith('org-') or (len(department_name) == 36 and '-' in department_name)
    ):
        actual_org_id = department_name
        actual_dept = org_id
        org_id = actual_org_id
        department_name = actual_dept

    if not department_name:
        return None

    clean_dept = str(department_name).strip()
    if clean_dept.lower() in ('', 'all', 'all departments', 'all_departments', 'none', 'null', 'undefined'):
        return None

    if clean_dept.lower() in ('unassigned', '_unassigned'):
        return '_unassigned'

    from database.db import is_db_available, get_db_session
    if not is_db_available():
        return clean_dept

    def _check(db):
        from database.models import Employee
        emp = db.query(Employee).filter_by(org_id=org_id, department=clean_dept).first()
        if emp:
            return clean_dept
        emp_ci = db.query(Employee).filter(
            Employee.org_id == org_id,
            Employee.department.ilike(clean_dept)
        ).first()
        if emp_ci and emp_ci.department:
            return emp_ci.department
        return clean_dept

    if db_session is not None:
        return _check(db_session)
    else:
        with get_db_session() as db:
            if db is None:
                return clean_dept
            return _check(db)


def validate_export_format(format_str):
    """Ensures requested format is one of pdf, xlsx, csv, json."""
    fmt = (format_str or 'pdf').lower().strip()
    if fmt in ('pdf', 'xlsx', 'csv', 'json'):
        return fmt
    raise ReportValidationError(
        f"Unsupported export format '{format_str}'. Supported formats: pdf, xlsx, csv, json.",
        field="format",
        code="UNSUPPORTED_FORMAT"
    )


def validate_work_start_time(hour, minute):
    """Validates shift start hour (0-23) and minute (0-59)."""
    try:
        h = int(hour) if hour is not None else 9
        m = int(minute) if minute is not None else 0
    except (ValueError, TypeError):
        raise ReportValidationError(
            "Shift start time must contain valid integers.",
            field="work_start_time",
            code="INVALID_TIME"
        )

    if not (0 <= h <= 23) or not (0 <= m <= 59):
        raise ReportValidationError(
            f"Invalid shift start time {h:02d}:{m:02d}. Hour must be 0-23 and minute 0-59.",
            field="work_start_time",
            code="TIME_OUT_OF_RANGE"
        )
    return h, m

