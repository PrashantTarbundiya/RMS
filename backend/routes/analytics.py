from flask import Blueprint, jsonify, request
from sqlalchemy import func
from datetime import datetime, timedelta, timezone

from database.db import get_db_session
from database.models import AttendanceLog, Employee, AttendanceStatus
from middleware import require_auth, inject_org_id

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/api/analytics/overview', methods=['GET'])
@require_auth
@inject_org_id
def get_overview(org_id):
    """
    Returns high-level productivity analytics for the org (last 30 days).
    """
    try:
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        
        with get_db_session() as session:
            if session is None:
                return jsonify({'error': 'Database unavailable'}), 503
                
            # 1. Total unique employees checked in
            active_employees = session.query(func.count(func.distinct(AttendanceLog.employee_id)))\
                .filter(AttendanceLog.org_id == org_id,
                        AttendanceLog.checkin_time >= thirty_days_ago,
                        AttendanceLog.is_confirmed == True).scalar()
                        
            # 2. Total successful recognitions
            total_logs = session.query(func.count(AttendanceLog.id))\
                .filter(AttendanceLog.org_id == org_id,
                        AttendanceLog.checkin_time >= thirty_days_ago,
                        AttendanceLog.is_confirmed == True).scalar()
                        
            # 3. Spoofs blocked
            spoofs_blocked = session.query(func.count(AttendanceLog.id))\
                .filter(AttendanceLog.org_id == org_id,
                        AttendanceLog.checkin_time >= thirty_days_ago,
                        AttendanceLog.prediction_label == 'SPOOF DETECTED').scalar()
                        
            # 4. Department breakdown
            dept_counts = session.query(Employee.department, func.count(Employee.id))\
                .filter(Employee.org_id == org_id, Employee.department != None)\
                .group_by(Employee.department).all()
                
            return jsonify({
                'active_employees_30d': active_employees or 0,
                'total_recognitions_30d': total_logs or 0,
                'spoofs_blocked_30d': spoofs_blocked or 0,
                'department_distribution': {dept: count for dept, count in dept_counts}
            })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@analytics_bp.route('/api/analytics/daily_trend', methods=['GET'])
@require_auth
@inject_org_id
def get_daily_trend(org_id):
    """
    Returns the count of confirmed check-ins per day for the last 14 days.
    """
    try:
        fourteen_days_ago = datetime.now(timezone.utc) - timedelta(days=14)
        
        with get_db_session() as session:
            if session is None:
                return jsonify({'error': 'Database unavailable'}), 503
                
            # Cast checkin_time to DATE for grouping
            trend_query = session.query(
                func.date(AttendanceLog.checkin_time).label('day'),
                func.count(AttendanceLog.id).label('count')
            ).filter(
                AttendanceLog.org_id == org_id,
                AttendanceLog.checkin_time >= fourteen_days_ago,
                AttendanceLog.is_confirmed == True
            ).group_by(func.date(AttendanceLog.checkin_time)).order_by('day').all()
            
            trend = [{'date': str(day), 'checkins': count} for day, count in trend_query]
            
            return jsonify({'trend': trend})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
