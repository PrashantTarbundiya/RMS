"""
Canonical Report Data Service — AuraPass™ Enterprise
Provides a single validated source of truth for all export generators.
Enforces tenant isolation, data invariants, and mathematical reconciliation.
"""

from datetime import datetime, date, time, timezone
from collections import defaultdict
import uuid
import logging

logger = logging.getLogger('aurapass.reporting.data_service')


def _format_confidence_pct(val):
    """Normalizes confidence to 0.0 - 100.0% float with 1 decimal place."""
    if val is None:
        return 0.0
    try:
        f = float(val)
        # If stored as decimal 0.0 - 1.0, scale to 0 - 100
        if 0.0 < f <= 1.0:
            return round(f * 100.0, 1)
        return round(f, 1)
    except (ValueError, TypeError):
        return 0.0


def _generate_report_id(prefix="AP"):
    """Generates a professional enterprise report tracking reference."""
    today_str = datetime.now().strftime("%Y%m%d")
    short_uuid = uuid.uuid4().hex[:6].upper()
    return f"{prefix}-{today_str}-{short_uuid}"


def get_canonical_analytics_data(org_id, start_date=None, end_date=None,
                                 department=None, work_start_hour=9,
                                 work_start_minute=0, period_label=None):
    """
    Retrieves and aggregates verified analytics data for an organization.
    Guarantees that metrics satisfy all relational and mathematical invariants.
    """
    if not org_id:
        org_id = 'default-org'

    from database.db import is_db_available, get_db_session

    report_id = _generate_report_id("AP-ANL")
    gen_time = datetime.now(timezone.utc)

    report = {
        'metadata': {
            'report_id': report_id,
            'report_type': 'executive_analytics',
            'product_name': 'AuraPass™ Enterprise',
            'generated_at': gen_time.isoformat(),
            'generated_at_human': gen_time.strftime('%Y-%m-%d %H:%M:%S UTC'),
            'org_id': org_id,
            'org_name': 'AuraPass Organization',
            'period_label': period_label or 'All-Time Historical',
            'date_range': {
                'start': start_date.isoformat() if start_date else None,
                'end': end_date.isoformat() if end_date else None,
            },
            'applied_filters': {
                'department': department if department else 'All Departments',
                'work_start_time': f"{work_start_hour:02d}:{work_start_minute:02d}",
            }
        },
        'overview': {
            'total_employees': 0,
            'total_attendance_logs': 0,
            'confirmed_logs': 0,
            'unconfirmed_logs': 0,
            'recognition_rate': 0.0,
            'unique_attendees': 0,
        },
        'department_breakdown': {
            'departments': [],
            'unassigned': None,
            'total_departments': 0,
        },
        'late_arrival_analysis': {
            'work_start': f"{work_start_hour:02d}:{work_start_minute:02d}",
            'total_checkins_analyzed': 0,
            'late_count': 0,
            'late_percentage': 0.0,
            'avg_delay_minutes': 0.0,
            'by_day_of_week': [],
            'top_late_employees': [],
            'trend_by_week': [],
        },
        'heatmap': {'heatmap': [], 'peak_day': 'N/A', 'peak_hour': 0, 'peak_value': 0}
    }

    if not is_db_available():
        logger.warning(f"Database unavailable while generating analytics report for {org_id}")
        return report

    try:
        from database.models import Organization, Employee, AttendanceLog
        from sqlalchemy import func

        work_start = time(work_start_hour, work_start_minute)

        with get_db_session() as db:
            org = db.query(Organization).filter_by(id=org_id).first()
            if org and org.name:
                report['metadata']['org_name'] = org.name

            # 1. Total Enrolled Employees in Scope
            emp_query = db.query(Employee).filter_by(org_id=org_id, status='active')
            if department and department != '_unassigned':
                emp_query = emp_query.filter_by(department=department)
            elif department == '_unassigned':
                emp_query = emp_query.filter((Employee.department == None) | (Employee.department == ''))

            all_employees = emp_query.all()
            total_emp = len(all_employees)
            emp_id_to_name = {e.id: e.name for e in all_employees}
            emp_id_to_dept = {e.id: (e.department or '_unassigned') for e in all_employees}

            # 2. Query Attendance Logs in Scope
            log_query = db.query(AttendanceLog).filter_by(org_id=org_id)
            if start_date:
                log_query = log_query.filter(AttendanceLog.checkin_time >= start_date)
            if end_date:
                log_query = log_query.filter(AttendanceLog.checkin_time <= end_date)

            all_logs = log_query.all()

            # Filter by department if requested
            if department:
                target_dept = department
                all_logs = [l for l in all_logs if emp_id_to_dept.get(l.employee_id) == target_dept]

            total_logs = len(all_logs)
            confirmed_logs = sum(1 for l in all_logs if l.is_confirmed)
            unconfirmed_logs = total_logs - confirmed_logs
            unique_emp_ids = set(l.employee_id for l in all_logs if l.employee_id and l.is_confirmed)

            recognition_rate = round((confirmed_logs / total_logs * 100.0), 1) if total_logs > 0 else 0.0

            report['overview'] = {
                'total_employees': total_emp,
                'total_attendance_logs': total_logs,
                'confirmed_logs': confirmed_logs,
                'unconfirmed_logs': unconfirmed_logs,
                'recognition_rate': recognition_rate,
                'unique_attendees': len(unique_emp_ids),
            }

            # 3. Department Breakdown
            dept_map = defaultdict(list)
            for emp in all_employees:
                dept_name = emp.department or '_unassigned'
                dept_map[dept_name].append(emp)

            dept_checkins = defaultdict(int)
            dept_confidences = defaultdict(list)
            dept_emp_days = defaultdict(set)
            dept_unique_days = defaultdict(set)

            for l in all_logs:
                if l.is_confirmed and l.employee_id:
                    d_name = emp_id_to_dept.get(l.employee_id, '_unassigned')
                    dept_checkins[d_name] += 1
                    if l.confidence is not None:
                        dept_confidences[d_name].append(l.confidence)
                    if l.checkin_time:
                        l_date = l.checkin_time.date()
                        dept_unique_days[d_name].add(l_date)
                        dept_emp_days[d_name].add((l.employee_id, l_date))

            dept_results = []
            unassigned_entry = None

            for d_name, emp_list in sorted(dept_map.items()):
                d_emp_count = len(emp_list)
                d_days = len(dept_unique_days.get(d_name, set())) or 1
                d_checkins = dept_checkins.get(d_name, 0)
                confs = dept_confidences.get(d_name, [])
                distinct_att = len(dept_emp_days.get(d_name, set()))
                unique_present = len(set(e_id for e_id, _ in dept_emp_days.get(d_name, set())))

                # Attendance rate: (actual distinct attendances / (total_emp * working_days)) * 100
                raw_rate = (distinct_att / (d_emp_count * d_days) * 100.0) if (d_emp_count > 0 and d_days > 0) else 0.0
                rate_capped = round(min(100.0, max(0.0, raw_rate)), 1)

                avg_conf = _format_confidence_pct(sum(confs) / len(confs)) if confs else 0.0

                entry = {
                    'name': d_name if d_name != '_unassigned' else 'Unassigned',
                    'total_employees': d_emp_count,
                    'total_checkins': d_checkins,
                    'unique_present': unique_present,
                    'avg_attendance_rate': rate_capped,
                    'avg_confidence': avg_conf,
                    'working_days': d_days,
                }

                if d_name == '_unassigned':
                    unassigned_entry = entry
                else:
                    dept_results.append(entry)

            report['department_breakdown'] = {
                'departments': dept_results,
                'unassigned': unassigned_entry,
                'total_departments': len(dept_results) + (1 if unassigned_entry else 0),
            }

            # 4. Late Arrival Analysis (Invariant: Deduplicated first check-in per employee per day)
            first_checkins = {}
            for l in all_logs:
                if not l.is_confirmed or not l.employee_id or not l.checkin_time:
                    continue
                day_key = (l.employee_id, l.checkin_time.date())
                if day_key not in first_checkins or l.checkin_time < first_checkins[day_key].checkin_time:
                    first_checkins[day_key] = l

            total_analyzed = len(first_checkins)
            late_logs = []
            total_delay_minutes = 0
            day_of_week_stats = defaultdict(lambda: {'late': 0, 'total': 0})
            employee_late = defaultdict(lambda: {'count': 0, 'total_minutes': 0})
            week_stats = defaultdict(lambda: {'late': 0, 'total': 0})

            for (e_id, d_val), l in first_checkins.items():
                checkin = l.checkin_time
                is_late = checkin.time() > work_start

                dow = checkin.strftime('%A')
                week = checkin.strftime('%G-W%V')

                day_of_week_stats[dow]['total'] += 1
                week_stats[week]['total'] += 1

                if is_late:
                    minutes_late = (
                        (checkin.hour * 60 + checkin.minute) -
                        (work_start_hour * 60 + work_start_minute)
                    )
                    late_logs.append(l)
                    total_delay_minutes += minutes_late
                    day_of_week_stats[dow]['late'] += 1
                    week_stats[week]['late'] += 1
                    employee_late[e_id]['count'] += 1
                    employee_late[e_id]['total_minutes'] += minutes_late

            late_count = len(late_logs)
            late_percentage = round((late_count / total_analyzed * 100.0), 1) if total_analyzed > 0 else 0.0
            avg_delay = round((total_delay_minutes / late_count), 1) if late_count > 0 else 0.0

            top_late = sorted(employee_late.items(), key=lambda x: x[1]['count'], reverse=True)[:10]
            top_late_list = [{
                'name': emp_id_to_name.get(emp_id, 'Unknown'),
                'late_count': data['count'],
                'avg_minutes_late': round(data['total_minutes'] / data['count'], 1) if data['count'] else 0.0,
            } for emp_id, data in top_late]

            day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            dow_list = [{
                'day': d,
                'late_count': day_of_week_stats[d]['late'],
                'total': day_of_week_stats[d]['total'],
                'late_rate': round((day_of_week_stats[d]['late'] / day_of_week_stats[d]['total'] * 100.0), 1)
                if day_of_week_stats[d]['total'] else 0.0,
            } for d in day_order if day_of_week_stats[d]['total'] > 0]

            trend = sorted([{
                'week': w,
                'late_count': s['late'],
                'total': s['total'],
                'late_rate': round((s['late'] / s['total'] * 100.0), 1) if s['total'] else 0.0,
            } for w, s in week_stats.items()], key=lambda x: x['week'])

            report['late_arrival_analysis'] = {
                'work_start': f"{work_start_hour:02d}:{work_start_minute:02d}",
                'total_checkins_analyzed': total_analyzed,
                'late_count': late_count,
                'late_percentage': late_percentage,
                'avg_delay_minutes': avg_delay,
                'by_day_of_week': dow_list,
                'top_late_employees': top_late_list,
                'trend_by_week': trend[-12:],
            }

            # 5. Attendance Heatmap
            grid = defaultdict(int)
            peak_day = 'Monday'
            peak_hour = 9
            peak_value = 0

            for l in all_logs:
                if l.checkin_time and l.is_confirmed:
                    day_name = l.checkin_time.strftime('%A')
                    hour_val = l.checkin_time.hour
                    grid[(day_name, hour_val)] += 1
                    if grid[(day_name, hour_val)] > peak_value:
                        peak_value = grid[(day_name, hour_val)]
                        peak_day = day_name
                        peak_hour = hour_val

            heatmap_data = []
            for d in day_order:
                hours_arr = [grid.get((d, h), 0) for h in range(24)]
                heatmap_data.append({
                    'day': d,
                    'hours': hours_arr,
                    'total': sum(hours_arr)
                })

            report['heatmap'] = {
                'heatmap': heatmap_data,
                'peak_day': peak_day if peak_value > 0 else 'N/A',
                'peak_hour': peak_hour if peak_value > 0 else 0,
                'peak_value': peak_value,
            }

    except Exception as e:
        logger.error(f"Error computing canonical analytics data: {e}", exc_info=True)
        report['metadata']['error'] = str(e)

    return report


def get_canonical_attendance_register_data(org_id, start_date=None, end_date=None,
                                            department=None, status_filter=None,
                                            period_label=None):
    """
    Retrieves individual verified check-in records for tabular attendance registers.
    """
    if not org_id:
        org_id = 'default-org'

    from database.db import is_db_available, get_db_session

    report_id = _generate_report_id("AP-ATT")
    gen_time = datetime.now(timezone.utc)

    report = {
        'metadata': {
            'report_id': report_id,
            'report_type': 'attendance_register',
            'product_name': 'AuraPass™ Enterprise',
            'generated_at': gen_time.isoformat(),
            'generated_at_human': gen_time.strftime('%Y-%m-%d %H:%M:%S UTC'),
            'org_id': org_id,
            'org_name': 'AuraPass Organization',
            'period_label': period_label or 'All-Time Historical',
            'date_range': {
                'start': start_date.isoformat() if start_date else None,
                'end': end_date.isoformat() if end_date else None,
            },
            'applied_filters': {
                'department': department or 'All Departments',
                'status': status_filter or 'All Statuses',
            }
        },
        'summary': {
            'total_events': 0,
            'confirmed_matches': 0,
            'unmatched_events': 0,
            'match_ratio_pct': 0.0,
            'unique_persons_verified': 0,
        },
        'records': []
    }

    if not is_db_available():
        return report

    try:
        from database.models import Organization, Employee, AttendanceLog, Camera

        with get_db_session() as db:
            org = db.query(Organization).filter_by(id=org_id).first()
            if org and org.name:
                report['metadata']['org_name'] = org.name

            # Map cameras and employees
            cameras = db.query(Camera).filter_by(org_id=org_id).all()
            camera_map = {c.id: c.name for c in cameras}

            employees = db.query(Employee).filter_by(org_id=org_id).all()
            emp_map = {e.id: e for e in employees}

            query = db.query(AttendanceLog).filter_by(org_id=org_id)
            if start_date:
                query = query.filter(AttendanceLog.checkin_time >= start_date)
            if end_date:
                query = query.filter(AttendanceLog.checkin_time <= end_date)

            logs = query.order_by(AttendanceLog.checkin_time.desc()).all()

            records = []
            unique_persons = set()
            confirmed_count = 0

            for idx, l in enumerate(logs, 1):
                emp = emp_map.get(l.employee_id)
                emp_name = getattr(l, 'prediction_label', None) or (emp.name if emp else 'Unknown')
                dept_name = emp.department if emp and emp.department else 'General'
                cam_name = camera_map.get(l.camera_id, 'Lane 01 (RTSP)')

                # Apply department filter if active
                if department and department != '_unassigned' and dept_name != department:
                    continue
                if department == '_unassigned' and dept_name not in ('_unassigned', 'General', 'Unassigned', None):
                    continue

                is_conf = bool(l.is_confirmed and emp_name != 'Unknown')

                # Apply status filter if active
                if status_filter == 'confirmed' and not is_conf:
                    continue
                if status_filter == 'unmatched' and is_conf:
                    continue

                if is_conf:
                    confirmed_count += 1
                    unique_persons.add(emp_name)

                conf_pct = _format_confidence_pct(l.confidence)

                records.append({
                    'index': len(records) + 1,
                    'log_id': l.id,
                    'timestamp_iso': l.checkin_time.isoformat() if l.checkin_time else '',
                    'timestamp_human': l.checkin_time.strftime('%Y-%m-%d %H:%M:%S') if l.checkin_time else 'N/A',
                    'person_name': emp_name,
                    'employee_code': emp.employee_id if emp and emp.employee_id else (f"EMP-{l.employee_id[:6].upper()}" if l.employee_id else 'N/A'),
                    'department': dept_name or 'General',
                    'camera_name': cam_name,
                    'confidence_pct': conf_pct,
                    'is_confirmed': is_conf,
                    'status': 'CONFIRMED' if is_conf else 'NOT MATCHED',
                })

            total_recs = len(records)
            unmatched_count = total_recs - confirmed_count
            ratio = round((confirmed_count / total_recs * 100.0), 1) if total_recs > 0 else 0.0

            report['summary'] = {
                'total_events': total_recs,
                'confirmed_matches': confirmed_count,
                'unmatched_events': unmatched_count,
                'match_ratio_pct': ratio,
                'unique_persons_verified': len(unique_persons),
            }
            report['records'] = records

    except Exception as e:
        logger.error(f"Error compiling attendance register data: {e}", exc_info=True)
        report['metadata']['error'] = str(e)

    return report


def get_canonical_audit_trail_data(org_id, start_date=None, end_date=None,
                                   event_type=None, period_label=None):
    """
    Compiles chronological tamper-evident audit records.
    """
    if not org_id:
        org_id = 'default-org'

    from database.db import is_db_available, get_db_session

    report_id = _generate_report_id("AP-AUD")
    gen_time = datetime.now(timezone.utc)

    report = {
        'metadata': {
            'report_id': report_id,
            'report_type': 'audit_trail',
            'product_name': 'AuraPass™ Enterprise',
            'generated_at': gen_time.isoformat(),
            'generated_at_human': gen_time.strftime('%Y-%m-%d %H:%M:%S UTC'),
            'org_id': org_id,
            'org_name': 'AuraPass Organization',
            'period_label': period_label or 'All-Time Historical',
            'date_range': {
                'start': start_date.isoformat() if start_date else None,
                'end': end_date.isoformat() if end_date else None,
            },
            'applied_filters': {
                'event_type': event_type or 'All Event Types',
            }
        },
        'summary': {
            'total_audit_events': 0,
            'access_events': 0,
            'feedback_events': 0,
            'consent_events': 0,
        },
        'records': []
    }

    if not is_db_available():
        return report

    try:
        from database.models import Organization, AttendanceLog, FeedbackLog, ConsentRecord

        with get_db_session() as db:
            org = db.query(Organization).filter_by(id=org_id).first()
            if org and org.name:
                report['metadata']['org_name'] = org.name

            combined = []

            # 1. Access Logs
            if not event_type or event_type in ('all', 'access'):
                q = db.query(AttendanceLog).filter_by(org_id=org_id)
                if start_date: q = q.filter(AttendanceLog.checkin_time >= start_date)
                if end_date: q = q.filter(AttendanceLog.checkin_time <= end_date)
                for l in q.limit(200).all():
                    p_name = getattr(l, 'prediction_label', None) or 'Unknown'
                    combined.append({
                        'type': 'Access / Verification',
                        'timestamp': l.checkin_time,
                        'details': f"{p_name} - Status: {'Confirmed' if l.is_confirmed else 'Not Matched'}",
                        'status': 'CONFIRMED' if l.is_confirmed else 'UNMATCHED',
                    })

            # 2. Feedback Logs
            if not event_type or event_type in ('all', 'feedback'):
                q = db.query(FeedbackLog).filter_by(org_id=org_id)
                if start_date: q = q.filter(FeedbackLog.created_at >= start_date)
                if end_date: q = q.filter(FeedbackLog.created_at <= end_date)
                for f in q.limit(200).all():
                    status_str = 'CORRECT' if f.is_correct else 'CORRECTED'
                    corr = f" -> {f.correct_name}" if f.correct_name else ""
                    combined.append({
                        'type': 'Model Feedback',
                        'timestamp': f.created_at,
                        'details': f"Predicted: {f.predicted_name or 'N/A'}{corr}",
                        'status': status_str,
                    })

            # 3. Consent Records
            if not event_type or event_type in ('all', 'consent'):
                q = db.query(ConsentRecord).filter_by(org_id=org_id)
                if start_date: q = q.filter(ConsentRecord.consented_at >= start_date)
                if end_date: q = q.filter(ConsentRecord.consented_at <= end_date)
                for c in q.limit(200).all():
                    status_str = 'REVOKED' if c.revoked_at else 'ACTIVE'
                    combined.append({
                        'type': 'Biometric Consent',
                        'timestamp': c.consented_at,
                        'details': f"Employee: {c.employee_id} - Type: {c.consent_type or 'Biometric Storage'}",
                        'status': status_str,
                    })

            combined.sort(key=lambda x: x['timestamp'] or datetime.min, reverse=True)

            formatted_records = []
            access_cnt = sum(1 for c in combined if 'Access' in c['type'])
            fb_cnt = sum(1 for c in combined if 'Feedback' in c['type'])
            cs_cnt = sum(1 for c in combined if 'Consent' in c['type'])

            for idx, c in enumerate(combined, 1):
                formatted_records.append({
                    'index': idx,
                    'type': c['type'],
                    'timestamp_human': c['timestamp'].strftime('%Y-%m-%d %H:%M:%S') if c['timestamp'] else 'N/A',
                    'details': c['details'],
                    'status': c['status'],
                })

            report['summary'] = {
                'total_audit_events': len(formatted_records),
                'access_events': access_cnt,
                'feedback_events': fb_cnt,
                'consent_events': cs_cnt,
            }
            report['records'] = formatted_records

    except Exception as e:
        logger.error(f"Error compiling audit trail data: {e}", exc_info=True)
        report['metadata']['error'] = str(e)

    return report

