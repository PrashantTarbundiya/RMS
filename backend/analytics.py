"""
analytics.py — Advanced Analytics & Reporting Engine for RMS Face AI.

Provides:
  1. Department-level attendance aggregation
  2. Late-arrival trend analysis (configurable work start time)
  3. Attendance heatmap data (by hour/day-of-week)
  4. Employee attendance streaks and patterns
  5. Exportable report data (JSON structure for PDF rendering)
"""

import os
import json
import logging
from datetime import datetime, timezone, timedelta, time
from collections import defaultdict

logger = logging.getLogger('rms-analytics')


def get_department_breakdown(org_id, start_date=None, end_date=None):
    """
    Aggregate attendance by department.

    Returns:
        {
            'departments': [
                {
                    'name': 'Engineering',
                    'total_employees': 15,
                    'avg_attendance_rate': 92.3,
                    'total_checkins': 280,
                    'avg_confidence': 0.87,
                }
            ],
            'unassigned': { ... }  # employees with no department
        }
    """
    from database.db import is_db_available, get_db_session
    if not is_db_available():
        return {'departments': [], 'unassigned': None, 'error': 'Database not available'}

    try:
        from database.models import Employee, AttendanceLog
        from sqlalchemy import func

        with get_db_session() as db:
            # Get all employees grouped by department
            employees = db.query(Employee).filter_by(org_id=org_id, status='active').all()

            dept_map = defaultdict(list)
            for emp in employees:
                dept = emp.department or '_unassigned'
                dept_map[dept].append(emp)

            # Build date filter
            log_query = db.query(AttendanceLog).filter_by(org_id=org_id)
            if start_date:
                log_query = log_query.filter(AttendanceLog.checkin_time >= start_date)
            if end_date:
                log_query = log_query.filter(AttendanceLog.checkin_time <= end_date)

            logs = log_query.all()

            # Map employee_id to department
            emp_dept = {}
            for emp in employees:
                emp_dept[emp.id] = emp.department or '_unassigned'

            # Count checkins by department
            dept_checkins = defaultdict(int)
            dept_confidences = defaultdict(list)
            dept_unique_days = defaultdict(set)
            for log in logs:
                if log.is_confirmed and log.employee_id:
                    dept = emp_dept.get(log.employee_id, '_unassigned')
                    dept_checkins[dept] += 1
                    if log.confidence:
                        dept_confidences[dept].append(log.confidence)
                    if log.checkin_time:
                        dept_unique_days[dept].add(log.checkin_time.date())

            # Calculate rates
            results = []
            unassigned = None
            for dept_name, emp_list in sorted(dept_map.items()):
                total_emp = len(emp_list)
                total_days = len(dept_unique_days.get(dept_name, set())) or 1
                total_checkins = dept_checkins.get(dept_name, 0)
                confs = dept_confidences.get(dept_name, [])

                entry = {
                    'name': dept_name if dept_name != '_unassigned' else 'Unassigned',
                    'total_employees': total_emp,
                    'total_checkins': total_checkins,
                    'avg_attendance_rate': round(
                        (total_checkins / (total_emp * total_days) * 100)
                        if total_emp > 0 else 0, 1
                    ),
                    'avg_confidence': round(sum(confs) / len(confs), 3) if confs else 0,
                    'working_days': total_days,
                }

                if dept_name == '_unassigned':
                    unassigned = entry
                else:
                    results.append(entry)

            return {
                'departments': results,
                'unassigned': unassigned,
                'total_departments': len(results),
            }

    except Exception as e:
        logger.error(f"Department breakdown error: {e}", exc_info=True)
        return {'departments': [], 'error': str(e)}


def get_late_arrival_trends(org_id, work_start_hour=9, work_start_minute=0,
                            start_date=None, end_date=None):
    """
    Analyze late arrival patterns.

    Args:
        org_id: Organization ID
        work_start_hour/minute: Expected work start time (default 9:00 AM)
        start_date/end_date: Date range filter

    Returns:
        {
            'total_checkins': 500,
            'late_count': 45,
            'late_rate': 9.0,
            'by_day_of_week': [{'day': 'Monday', 'late_count': 12, 'total': 100}, ...],
            'top_late_employees': [{'name': 'Alice', 'late_count': 8, 'avg_minutes_late': 22}, ...],
            'trend_by_week': [{'week': '2026-W01', 'late_count': 5, 'total': 50}, ...],
        }
    """
    from database.db import is_db_available, get_db_session
    if not is_db_available():
        return {'error': 'Database not available'}

    try:
        from database.models import AttendanceLog, Employee

        work_start = time(work_start_hour, work_start_minute)

        with get_db_session() as db:
            query = db.query(AttendanceLog).filter_by(org_id=org_id)
            if start_date:
                query = query.filter(AttendanceLog.checkin_time >= start_date)
            if end_date:
                query = query.filter(AttendanceLog.checkin_time <= end_date)

            logs = query.filter(AttendanceLog.is_confirmed == True).all()

            # Deduplicate: keep only first check-in per employee per day
            first_checkins = {}
            for log in logs:
                if not log.employee_id or not log.checkin_time:
                    continue
                day_key = (log.employee_id, log.checkin_time.date())
                if day_key not in first_checkins or log.checkin_time < first_checkins[day_key].checkin_time:
                    first_checkins[day_key] = log

            total = len(first_checkins)
            late_logs = []
            day_of_week_stats = defaultdict(lambda: {'late': 0, 'total': 0})
            employee_late = defaultdict(lambda: {'count': 0, 'total_minutes': 0})
            week_stats = defaultdict(lambda: {'late': 0, 'total': 0})

            for (emp_id, day), log in first_checkins.items():
                checkin = log.checkin_time
                checkin_time_only = checkin.time()
                is_late = checkin_time_only > work_start

                dow = checkin.strftime('%A')
                week = checkin.strftime('%G-W%V')

                day_of_week_stats[dow]['total'] += 1
                week_stats[week]['total'] += 1

                if is_late:
                    minutes_late = (
                        (checkin.hour * 60 + checkin.minute) -
                        (work_start_hour * 60 + work_start_minute)
                    )
                    late_logs.append(log)
                    day_of_week_stats[dow]['late'] += 1
                    week_stats[week]['late'] += 1
                    employee_late[emp_id]['count'] += 1
                    employee_late[emp_id]['total_minutes'] += minutes_late

            # Resolve employee names
            emp_ids = list(employee_late.keys())
            emp_names = {}
            if emp_ids:
                emps = db.query(Employee).filter(Employee.id.in_(emp_ids)).all()
                emp_names = {e.id: e.name for e in emps}

            # Build top late employees
            top_late = sorted(employee_late.items(), key=lambda x: x[1]['count'], reverse=True)[:10]
            top_late_list = [{
                'name': emp_names.get(emp_id, 'Unknown'),
                'late_count': data['count'],
                'avg_minutes_late': round(data['total_minutes'] / data['count']) if data['count'] else 0,
            } for emp_id, data in top_late]

            # Day of week ordering
            day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            dow_list = [{
                'day': d,
                'late_count': day_of_week_stats[d]['late'],
                'total': day_of_week_stats[d]['total'],
                'late_rate': round(
                    day_of_week_stats[d]['late'] / day_of_week_stats[d]['total'] * 100
                    if day_of_week_stats[d]['total'] else 0, 1
                ),
            } for d in day_order if day_of_week_stats[d]['total'] > 0]

            # Weekly trend
            trend = sorted([{
                'week': w,
                'late_count': s['late'],
                'total': s['total'],
                'late_rate': round(s['late'] / s['total'] * 100 if s['total'] else 0, 1),
            } for w, s in week_stats.items()], key=lambda x: x['week'])

            return {
                'work_start': f"{work_start_hour:02d}:{work_start_minute:02d}",
                'total_checkins': total,
                'late_count': len(late_logs),
                'late_rate': round(len(late_logs) / total * 100 if total else 0, 1),
                'by_day_of_week': dow_list,
                'top_late_employees': top_late_list,
                'trend_by_week': trend[-12:],  # Last 12 weeks
            }

    except Exception as e:
        logger.error(f"Late arrival analysis error: {e}", exc_info=True)
        return {'error': str(e)}


def get_attendance_heatmap(org_id, start_date=None, end_date=None):
    """
    Generate attendance heatmap data (hour × day-of-week).

    Returns:
        {
            'heatmap': [[count, ...], ...]  # 7 rows (days) × 24 cols (hours)
            'peak_hour': 9,
            'peak_day': 'Monday',
        }
    """
    from database.db import is_db_available, get_db_session
    if not is_db_available():
        return {'error': 'Database not available'}

    try:
        from database.models import AttendanceLog

        with get_db_session() as db:
            query = db.query(AttendanceLog).filter_by(
                org_id=org_id, is_confirmed=True
            )
            if start_date:
                query = query.filter(AttendanceLog.checkin_time >= start_date)
            if end_date:
                query = query.filter(AttendanceLog.checkin_time <= end_date)

            logs = query.all()

            # 7 days × 24 hours grid
            grid = [[0] * 24 for _ in range(7)]
            for log in logs:
                if log.checkin_time:
                    dow = log.checkin_time.weekday()  # 0=Mon
                    hour = log.checkin_time.hour
                    grid[dow][hour] += 1

            # Find peak
            peak_val = 0
            peak_hour = 0
            peak_day_idx = 0
            for d in range(7):
                for h in range(24):
                    if grid[d][h] > peak_val:
                        peak_val = grid[d][h]
                        peak_hour = h
                        peak_day_idx = d

            day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

            return {
                'heatmap': grid,
                'days': day_names,
                'peak_hour': peak_hour,
                'peak_day': day_names[peak_day_idx],
                'peak_count': peak_val,
                'total_logs': len(logs),
            }

    except Exception as e:
        logger.error(f"Heatmap error: {e}", exc_info=True)
        return {'error': str(e)}


def generate_report_data(org_id, start_date=None, end_date=None,
                          work_start_hour=9, work_start_minute=0):
    """
    Generate comprehensive report data for PDF export.

    Combines all analytics into a single structured output.
    """
    from database.db import is_db_available, get_db_session

    report = {
        'generated_at': datetime.now(timezone.utc).isoformat(),
        'org_id': org_id,
        'org_name': None,
        'date_range': {
            'start': start_date.isoformat() if start_date else None,
            'end': end_date.isoformat() if end_date else None,
        },
        'overview': {},
        'department_breakdown': {},
        'late_arrival_analysis': {},
        'heatmap': {},
    }

    if is_db_available():
        try:
            from database.models import Organization, Employee, AttendanceLog
            from sqlalchemy import func

            with get_db_session() as db:
                org = db.query(Organization).filter_by(id=org_id).first()
                report['org_name'] = org.name if org else 'Unknown'

                # Overview stats
                total_emp = db.query(func.count(Employee.id)).filter_by(
                    org_id=org_id, status='active'
                ).scalar() or 0

                log_query = db.query(AttendanceLog).filter_by(org_id=org_id)
                if start_date:
                    log_query = log_query.filter(AttendanceLog.checkin_time >= start_date)
                if end_date:
                    log_query = log_query.filter(AttendanceLog.checkin_time <= end_date)

                total_logs = log_query.count()
                confirmed_logs = log_query.filter_by(is_confirmed=True).count()

                report['overview'] = {
                    'total_employees': total_emp,
                    'total_attendance_logs': total_logs,
                    'confirmed_logs': confirmed_logs,
                    'recognition_rate': round(
                        confirmed_logs / total_logs * 100 if total_logs else 0, 1
                    ),
                }

        except Exception as e:
            report['overview']['error'] = str(e)

    # Add sub-reports
    report['department_breakdown'] = get_department_breakdown(org_id, start_date, end_date)
    report['late_arrival_analysis'] = get_late_arrival_trends(
        org_id, work_start_hour, work_start_minute, start_date, end_date
    )
    report['heatmap'] = get_attendance_heatmap(org_id, start_date, end_date)

    return report
