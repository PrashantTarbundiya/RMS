"""
notifications.py — Notification & Alerting Engine for RMS Face AI.

Provides:
  - Alert triggers: unknown face, camera offline, model stale, DB unreachable
  - Delivery channels: SMTP email (baseline), webhook (Slack/Teams)
  - Daily attendance summary email
  - Deduplication: each alert fires only once per incident window
  - Notification preferences: per-user, per-org opt-out

Configuration via env vars:
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM
  WEBHOOK_URL (optional, Slack/Teams incoming webhook)
"""

import os
import json
import logging
import smtplib
import hashlib
import threading
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone, timedelta
from collections import defaultdict

logger = logging.getLogger('rms-notifications')

# ─── SMTP Configuration ────────────────────────────────────────────

SMTP_HOST = os.environ.get('SMTP_HOST', '')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))
SMTP_USER = os.environ.get('SMTP_USER', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
SMTP_FROM = os.environ.get('SMTP_FROM', 'noreply@rms-faceai.local')
SMTP_USE_TLS = os.environ.get('SMTP_USE_TLS', 'true').lower() == 'true'

# Webhook URL for Slack/Teams (optional)
WEBHOOK_URL = os.environ.get('WEBHOOK_URL', '')


def is_email_configured():
    """Check if SMTP is configured for sending emails."""
    return bool(SMTP_HOST and SMTP_USER and SMTP_PASSWORD)


# ─── Alert Deduplication ────────────────────────────────────────────

# In-memory dedup store: { alert_key: last_fired_at }
# Prevents duplicate spam for the same incident
_alert_dedup = {}
_dedup_lock = threading.Lock()

# Default cooldown: don't fire the same alert more than once per hour
ALERT_COOLDOWN_SECONDS = int(os.environ.get('ALERT_COOLDOWN_SECONDS', '3600'))


def _should_fire_alert(alert_key):
    """
    Check if an alert should fire based on deduplication rules.
    Returns True if the alert hasn't fired recently (within cooldown).
    """
    now = datetime.now(timezone.utc)
    with _dedup_lock:
        last_fired = _alert_dedup.get(alert_key)
        if last_fired and (now - last_fired).total_seconds() < ALERT_COOLDOWN_SECONDS:
            return False
        _alert_dedup[alert_key] = now
        return True


def _clear_stale_dedup():
    """Remove dedup entries older than 2x cooldown to prevent unbounded growth."""
    now = datetime.now(timezone.utc)
    cutoff = timedelta(seconds=ALERT_COOLDOWN_SECONDS * 2)
    with _dedup_lock:
        stale_keys = [
            k for k, v in _alert_dedup.items()
            if (now - v) > cutoff
        ]
        for k in stale_keys:
            del _alert_dedup[k]


# ─── Email Sending ──────────────────────────────────────────────────

def send_email(to_addresses, subject, html_body, text_body=None):
    """
    Send an email via SMTP.

    Args:
        to_addresses: List of email strings, or a single email string.
        subject: Email subject line.
        html_body: HTML content.
        text_body: Optional plain-text fallback.

    Returns:
        (success: bool, error: str|None)
    """
    if not is_email_configured():
        logger.warning("SMTP not configured — email not sent")
        return False, "SMTP not configured"

    if isinstance(to_addresses, str):
        to_addresses = [to_addresses]

    to_addresses = [addr for addr in to_addresses if addr and '@' in addr]
    if not to_addresses:
        return False, "No valid email addresses"

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = SMTP_FROM
    msg['To'] = ', '.join(to_addresses)

    if text_body:
        msg.attach(MIMEText(text_body, 'plain', 'utf-8'))
    msg.attach(MIMEText(html_body, 'html', 'utf-8'))

    try:
        if SMTP_USE_TLS:
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)
            server.ehlo()
            server.starttls()
        else:
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)

        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_FROM, to_addresses, msg.as_string())
        server.quit()

        logger.info(f"Email sent: '{subject}' → {to_addresses}")
        return True, None

    except smtplib.SMTPAuthenticationError:
        err = "SMTP authentication failed — check credentials"
        logger.error(err)
        return False, err
    except smtplib.SMTPConnectError:
        err = f"Cannot connect to SMTP server {SMTP_HOST}:{SMTP_PORT}"
        logger.error(err)
        return False, err
    except Exception as e:
        err = f"Email delivery failed: {str(e)}"
        logger.error(err)
        return False, err


# ─── Webhook Sending ────────────────────────────────────────────────

def send_webhook(message, webhook_url=None):
    """
    Send a notification via webhook (Slack/Teams compatible).

    Args:
        message: The notification text.
        webhook_url: Override URL; falls back to env var WEBHOOK_URL.

    Returns:
        (success: bool, error: str|None)
    """
    url = webhook_url or WEBHOOK_URL
    if not url:
        return False, "No webhook URL configured"

    try:
        import urllib.request
        import urllib.error

        # Slack-compatible payload
        payload = json.dumps({'text': message}).encode('utf-8')
        req = urllib.request.Request(
            url,
            data=payload,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            if resp.status in (200, 201, 204):
                logger.info(f"Webhook sent: {message[:80]}...")
                return True, None
            else:
                return False, f"Webhook returned status {resp.status}"

    except Exception as e:
        err = f"Webhook delivery failed: {str(e)}"
        logger.error(err)
        return False, err


# ─── Notification Preferences ───────────────────────────────────────

# Default preferences — can be overridden per-user in the DB
DEFAULT_PREFERENCES = {
    'unknown_face_alert': True,
    'camera_offline_alert': True,
    'model_stale_alert': True,
    'db_unreachable_alert': True,
    'daily_summary': True,
    'channel_email': True,
    'channel_webhook': False,
}


def get_user_preferences(user_id, org_id):
    """
    Get notification preferences for a user.
    Falls back to org defaults, then system defaults.
    """
    from database.db import is_db_available, get_db_session

    prefs = dict(DEFAULT_PREFERENCES)

    if not is_db_available():
        return prefs

    try:
        from database.models import NotificationPreference
        with get_db_session() as db:
            user_pref = db.query(NotificationPreference).filter_by(
                user_id=user_id
            ).first()

            if user_pref and user_pref.preferences:
                stored = json.loads(user_pref.preferences) if isinstance(
                    user_pref.preferences, str
                ) else user_pref.preferences
                prefs.update(stored)

    except Exception as e:
        logger.debug(f"Using default preferences (DB lookup failed: {e})")

    return prefs


def save_user_preferences(user_id, org_id, preferences):
    """Save notification preferences for a user."""
    from database.db import is_db_available, get_db_session

    if not is_db_available():
        return False, "Database not available"

    try:
        from database.models import NotificationPreference
        with get_db_session() as db:
            existing = db.query(NotificationPreference).filter_by(
                user_id=user_id
            ).first()

            if existing:
                existing.preferences = json.dumps(preferences)
                existing.updated_at = datetime.now(timezone.utc)
            else:
                db.add(NotificationPreference(
                    user_id=user_id,
                    org_id=org_id,
                    preferences=json.dumps(preferences),
                ))
            db.commit()
            return True, None

    except Exception as e:
        logger.error(f"Failed to save preferences: {e}")
        return False, str(e)


# ─── Alert Triggers ─────────────────────────────────────────────────

def fire_unknown_face_alert(org_id, camera_id, camera_name, count=1):
    """
    Alert: Unknown/uncertain face detected repeatedly at a camera.
    Fires only once per camera per cooldown window.
    """
    alert_key = f"unknown_face_{org_id}_{camera_id}"
    if not _should_fire_alert(alert_key):
        return  # Already alerted recently

    subject = f"⚠️ Unknown Face Alert — {camera_name}"
    message = (
        f"An unknown or uncertain face was detected {count} time(s) "
        f"at camera \"{camera_name}\". This may indicate an unauthorized "
        f"access attempt or an employee who hasn't been enrolled."
    )

    _deliver_alert(org_id, 'unknown_face_alert', subject, message)


def fire_camera_offline_alert(org_id, camera_id, camera_name, last_seen=None):
    """
    Alert: Camera has gone offline (no heartbeat/predict requests).
    """
    alert_key = f"camera_offline_{org_id}_{camera_id}"
    if not _should_fire_alert(alert_key):
        return

    last_seen_str = last_seen.strftime('%Y-%m-%d %H:%M UTC') if last_seen else 'unknown'
    subject = f"🔴 Camera Offline — {camera_name}"
    message = (
        f"Camera \"{camera_name}\" appears to be offline. "
        f"Last seen: {last_seen_str}. "
        f"Please check the device's network connection and power."
    )

    _deliver_alert(org_id, 'camera_offline_alert', subject, message)


def fire_model_stale_alert(org_id, days_since_training):
    """
    Alert: SOTA model hasn't been retrained for too long.
    """
    alert_key = f"model_stale_{org_id}"
    if not _should_fire_alert(alert_key):
        return

    subject = "🧠 Model Training Overdue"
    message = (
        f"Your recognition model hasn't been retrained in {days_since_training} days. "
        f"Recognition accuracy may degrade over time. "
        f"Consider retraining with the latest enrolled employee images."
    )

    _deliver_alert(org_id, 'model_stale_alert', subject, message)


def fire_db_unreachable_alert(org_id=None):
    """
    Alert: Database connection lost.
    """
    alert_key = f"db_unreachable_{org_id or 'system'}"
    if not _should_fire_alert(alert_key):
        return

    subject = "🔴 Database Connection Lost"
    message = (
        "The PostgreSQL database is unreachable. "
        "Attendance logging and user management will be unavailable. "
        "The system will continue operating in degraded mode with local storage."
    )

    _deliver_alert(org_id, 'db_unreachable_alert', subject, message)


# ─── Alert Delivery (Internal) ──────────────────────────────────────

def _deliver_alert(org_id, alert_type, subject, message):
    """
    Deliver an alert to all eligible recipients in the org.
    Respects per-user notification preferences.
    """
    recipients = _get_alert_recipients(org_id, alert_type)

    html_body = _build_alert_email_html(subject, message)

    # Email delivery
    email_recipients = [r['email'] for r in recipients if r.get('channel_email')]
    if email_recipients:
        # Send async to not block the request thread
        thread = threading.Thread(
            target=send_email,
            args=(email_recipients, subject, html_body, message),
            daemon=True,
        )
        thread.start()

    # Webhook delivery
    webhook_recipients = [r for r in recipients if r.get('channel_webhook')]
    if webhook_recipients:
        thread = threading.Thread(
            target=send_webhook,
            args=(f"*{subject}*\n{message}",),
            daemon=True,
        )
        thread.start()

    logger.info(
        f"Alert fired: {alert_type} → "
        f"{len(email_recipients)} email, {len(webhook_recipients)} webhook"
    )


def _get_alert_recipients(org_id, alert_type):
    """
    Get list of users who should receive this alert type.
    Only org_admin and manager roles receive alerts.
    """
    from database.db import is_db_available, get_db_session

    if not is_db_available() or not org_id:
        return []

    try:
        from database.models import User
        with get_db_session() as db:
            users = db.query(User).filter_by(org_id=org_id, is_active=True).all()

            recipients = []
            for user in users:
                if user.role.value not in ('org_admin', 'manager', 'platform_owner'):
                    continue

                prefs = get_user_preferences(user.id, org_id)

                # Check if user wants this alert type
                if not prefs.get(alert_type, True):
                    continue

                recipients.append({
                    'user_id': user.id,
                    'email': user.email,
                    'name': user.name,
                    'channel_email': prefs.get('channel_email', True),
                    'channel_webhook': prefs.get('channel_webhook', False),
                })

            return recipients

    except Exception as e:
        logger.error(f"Failed to get alert recipients: {e}")
        return []


# ─── Daily Attendance Summary ───────────────────────────────────────

def generate_daily_summary(org_id, date=None):
    """
    Generate and send a daily attendance summary email.

    Includes: who checked in, total count, by-department breakdown.
    Sent to org_admin and manager roles.

    Args:
        org_id: Organization ID.
        date: The date to summarize (defaults to yesterday).

    Returns:
        (success: bool, summary_data: dict, error: str|None)
    """
    from database.db import is_db_available, get_db_session

    if not is_db_available():
        return False, {}, "Database not available"

    if date is None:
        date = (datetime.now(timezone.utc) - timedelta(days=1)).date()

    try:
        from database.models import AttendanceLog, Employee, Organization
        from sqlalchemy import func

        with get_db_session() as db:
            org = db.query(Organization).filter_by(id=org_id).first()
            org_name = org.name if org else 'Unknown'

            # Get all attendance logs for the date
            day_start = datetime.combine(date, datetime.min.time()).replace(tzinfo=timezone.utc)
            day_end = day_start + timedelta(days=1)

            logs = db.query(AttendanceLog).filter(
                AttendanceLog.org_id == org_id,
                AttendanceLog.checkin_time >= day_start,
                AttendanceLog.checkin_time < day_end,
            ).all()

            # Get all active employees
            total_employees = db.query(func.count(Employee.id)).filter_by(
                org_id=org_id, status='active'
            ).scalar() or 0

            # Unique employees who checked in
            checked_in_names = set()
            checked_in_details = []
            for log in logs:
                label = log.prediction_label or 'Unknown'
                if label != 'Unknown' and log.is_confirmed:
                    checked_in_names.add(label)
                    checked_in_details.append({
                        'name': label,
                        'time': log.checkin_time.strftime('%H:%M'),
                        'confidence': round(log.confidence or 0, 2),
                    })

            # Remove duplicate entries per person (keep earliest)
            seen = set()
            unique_details = []
            for d in sorted(checked_in_details, key=lambda x: x['time']):
                if d['name'] not in seen:
                    seen.add(d['name'])
                    unique_details.append(d)

            present_count = len(checked_in_names)
            absent_count = max(0, total_employees - present_count)

            summary_data = {
                'date': date.isoformat(),
                'org_name': org_name,
                'total_employees': total_employees,
                'present_count': present_count,
                'absent_count': absent_count,
                'attendance_rate': round(
                    (present_count / total_employees * 100) if total_employees else 0, 1
                ),
                'total_logs': len(logs),
                'checked_in': unique_details,
                'unknown_count': sum(
                    1 for log in logs if log.prediction_label == 'Unknown'
                ),
            }

            # Build and send email
            subject = f"📊 Daily Attendance Summary — {org_name} — {date.strftime('%B %d, %Y')}"
            html_body = _build_daily_summary_html(summary_data)
            text_body = _build_daily_summary_text(summary_data)

            recipients = _get_alert_recipients(org_id, 'daily_summary')
            email_addrs = [r['email'] for r in recipients if r.get('channel_email')]

            if email_addrs:
                send_email(email_addrs, subject, html_body, text_body)

            return True, summary_data, None

    except Exception as e:
        logger.error(f"Daily summary error: {e}", exc_info=True)
        return False, {}, str(e)


# ─── Email HTML Templates ───────────────────────────────────────────

def _build_alert_email_html(title, message):
    """Build a clean alert email HTML template."""
    return f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #0F1011; border: 1px solid #23252A; border-radius: 12px;
                    padding: 24px; color: #E0E0E0;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                <h2 style="margin: 0; font-size: 18px; color: #FFFFFF;">{title}</h2>
            </div>
            <p style="font-size: 14px; line-height: 1.6; color: #B0B0B0; margin: 0 0 16px 0;">
                {message}
            </p>
            <div style="border-top: 1px solid #23252A; padding-top: 12px; margin-top: 16px;
                        font-size: 12px; color: #666;">
                RMS Face AI — Automated Alert
            </div>
        </div>
    </div>
    """


def _build_daily_summary_html(data):
    """Build the daily attendance summary email HTML."""
    rows_html = ''
    for entry in data.get('checked_in', [])[:50]:  # Cap at 50 rows
        rows_html += f"""
        <tr style="border-bottom: 1px solid #23252A;">
            <td style="padding: 8px 12px; font-size: 13px; color: #E0E0E0;">{entry['name']}</td>
            <td style="padding: 8px 12px; font-size: 13px; color: #B0B0B0;">{entry['time']}</td>
            <td style="padding: 8px 12px; font-size: 13px; color: #4ade80;">{entry['confidence']}</td>
        </tr>
        """

    return f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 700px; margin: 0 auto; padding: 20px;">
        <div style="background: #0F1011; border: 1px solid #23252A; border-radius: 12px;
                    padding: 24px; color: #E0E0E0;">

            <h2 style="margin: 0 0 4px 0; font-size: 20px; color: #FFFFFF;">
                📊 Daily Attendance Summary
            </h2>
            <p style="margin: 0 0 20px 0; font-size: 13px; color: #888;">
                {data['org_name']} — {data['date']}
            </p>

            <!-- Stats Cards -->
            <div style="display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 120px; background: #181A1F; border: 1px solid #23252A;
                            border-radius: 8px; padding: 12px; text-align: center;">
                    <div style="font-size: 24px; font-weight: 700; color: #4ade80;">{data['present_count']}</div>
                    <div style="font-size: 11px; color: #888;">Present</div>
                </div>
                <div style="flex: 1; min-width: 120px; background: #181A1F; border: 1px solid #23252A;
                            border-radius: 8px; padding: 12px; text-align: center;">
                    <div style="font-size: 24px; font-weight: 700; color: #f87171;">{data['absent_count']}</div>
                    <div style="font-size: 11px; color: #888;">Absent</div>
                </div>
                <div style="flex: 1; min-width: 120px; background: #181A1F; border: 1px solid #23252A;
                            border-radius: 8px; padding: 12px; text-align: center;">
                    <div style="font-size: 24px; font-weight: 700; color: #60a5fa;">{data['attendance_rate']}%</div>
                    <div style="font-size: 11px; color: #888;">Rate</div>
                </div>
            </div>

            <!-- Attendance Table -->
            <table style="width: 100%; border-collapse: collapse; background: #181A1F;
                          border-radius: 8px; overflow: hidden;">
                <thead>
                    <tr style="border-bottom: 1px solid #333;">
                        <th style="padding: 10px 12px; text-align: left; font-size: 11px;
                                   color: #888; text-transform: uppercase;">Employee</th>
                        <th style="padding: 10px 12px; text-align: left; font-size: 11px;
                                   color: #888; text-transform: uppercase;">Check-in</th>
                        <th style="padding: 10px 12px; text-align: left; font-size: 11px;
                                   color: #888; text-transform: uppercase;">Confidence</th>
                    </tr>
                </thead>
                <tbody>
                    {rows_html if rows_html else '<tr><td colspan="3" style="padding: 16px; text-align: center; color: #666;">No confirmed check-ins recorded.</td></tr>'}
                </tbody>
            </table>

            {f'<p style="margin-top: 12px; font-size: 12px; color: #f59e0b;">⚠️ {data["unknown_count"]} unknown face detection(s) recorded.</p>' if data.get('unknown_count') else ''}

            <div style="border-top: 1px solid #23252A; padding-top: 12px; margin-top: 20px;
                        font-size: 12px; color: #666;">
                RMS Face AI — Daily Summary &bull; {data['total_logs']} total log entries
            </div>
        </div>
    </div>
    """


def _build_daily_summary_text(data):
    """Plain-text fallback for the daily summary."""
    lines = [
        f"Daily Attendance Summary — {data['org_name']} — {data['date']}",
        f"",
        f"Present: {data['present_count']} / {data['total_employees']}",
        f"Absent: {data['absent_count']}",
        f"Rate: {data['attendance_rate']}%",
        f"",
        f"Check-ins:",
    ]
    for entry in data.get('checked_in', [])[:50]:
        lines.append(f"  {entry['name']} — {entry['time']} (confidence: {entry['confidence']})")

    if data.get('unknown_count'):
        lines.append(f"\n⚠️ {data['unknown_count']} unknown face detection(s)")

    return '\n'.join(lines)


# ─── Periodic Cleanup ───────────────────────────────────────────────

def cleanup_dedup_cache():
    """Called periodically to prevent unbounded memory growth."""
    _clear_stale_dedup()
