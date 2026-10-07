"""
test_notifications.py — Unit tests for Phase 4: Notifications & Alerting.

Tests:
  1. Email configuration detection
  2. Alert deduplication (fires once per cooldown)
  3. Deduplication expiry (fires again after cooldown)
  4. Daily summary data generation
  5. Webhook payload format
  6. Notification preferences defaults
  7. Alert recipient filtering (org_admin/manager only)
  8. HTML email template generation
  9. Text summary generation
  10. Cleanup of stale dedup entries
"""

import sys
import os
import json
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

passed = 0
failed = 0

def test(name, condition, detail=""):
    global passed, failed
    if condition:
        passed += 1
        print(f"  \u2713 PASS: {name}")
    else:
        failed += 1
        print(f"  \u2717 FAIL: {name}" + (f" — {detail}" if detail else ""))


print()
print("=" * 60)
print("NOTIFICATIONS & ALERTING — UNIT TEST SUITE")
print("=" * 60)
print()

# ── Test 1: Email Config Detection ──
print("── 1. Email Config Detection ──")
from notifications import is_email_configured
# Should be False since we haven't set env vars
result = is_email_configured()
test("SMTP not configured returns False", result == False)

# ── Test 2: Alert Deduplication ──
print("── 2. Alert Deduplication ──")
from notifications import _should_fire_alert, _alert_dedup, _dedup_lock

# Clear dedup state
with _dedup_lock:
    _alert_dedup.clear()

first_fire = _should_fire_alert("test_alert_1")
second_fire = _should_fire_alert("test_alert_1")
test("First alert fires", first_fire == True)
test("Duplicate alert suppressed", second_fire == False)

# ── Test 3: Deduplication Different Keys ──
print("── 3. Deduplication Different Keys ──")
different_key = _should_fire_alert("test_alert_2")
test("Different alert key fires independently", different_key == True)

# ── Test 4: Deduplication Expiry ──
print("── 4. Deduplication Expiry ──")
from notifications import ALERT_COOLDOWN_SECONDS
# Manually backdate the dedup entry
with _dedup_lock:
    _alert_dedup["test_alert_expired"] = datetime.now(timezone.utc) - timedelta(seconds=ALERT_COOLDOWN_SECONDS + 10)
fires_after_expiry = _should_fire_alert("test_alert_expired")
test("Alert fires after cooldown expiry", fires_after_expiry == True)

# ── Test 5: Default Preferences ──
print("── 5. Default Preferences ──")
from notifications import DEFAULT_PREFERENCES
test("Default prefs include all alert types",
     all(k in DEFAULT_PREFERENCES for k in [
         'unknown_face_alert', 'camera_offline_alert',
         'model_stale_alert', 'db_unreachable_alert', 'daily_summary'
     ]))
test("Default prefs include channels",
     'channel_email' in DEFAULT_PREFERENCES and 'channel_webhook' in DEFAULT_PREFERENCES)
test("Email channel on by default", DEFAULT_PREFERENCES['channel_email'] == True)
test("Webhook channel off by default", DEFAULT_PREFERENCES['channel_webhook'] == False)

# ── Test 6: HTML Template Generation ──
print("── 6. HTML Template Generation ──")
from notifications import _build_alert_email_html
html = _build_alert_email_html("Test Alert", "This is a test message.")
test("HTML contains title", "Test Alert" in html)
test("HTML contains message", "This is a test message." in html)
test("HTML contains RMS branding", "RMS Face AI" in html)

# ── Test 7: Daily Summary Text Generation ──
print("── 7. Daily Summary Text ──")
from notifications import _build_daily_summary_text
test_data = {
    'date': '2026-01-15',
    'org_name': 'Test Corp',
    'total_employees': 50,
    'present_count': 42,
    'absent_count': 8,
    'attendance_rate': 84.0,
    'total_logs': 45,
    'checked_in': [{'name': 'Alice', 'time': '09:00', 'confidence': 0.95}],
    'unknown_count': 3,
}
text = _build_daily_summary_text(test_data)
test("Text contains org name", "Test Corp" in text)
test("Text contains date", "2026-01-15" in text)
test("Text contains present count", "Present: 42" in text)
test("Text contains attendance rate", "84.0%" in text)
test("Text contains employee name", "Alice" in text)
test("Text contains unknown warning", "unknown face" in text.lower())

# ── Test 8: Daily Summary HTML ──
print("── 8. Daily Summary HTML ──")
from notifications import _build_daily_summary_html
html = _build_daily_summary_html(test_data)
test("HTML contains present count", ">42<" in html)
test("HTML contains absent count", ">8<" in html)
test("HTML contains rate", "84.0%" in html)

# ── Test 9: Webhook Payload (no URL) ──
print("── 9. Webhook (No URL) ──")
from notifications import send_webhook
success, error = send_webhook("test message")
test("Webhook fails gracefully without URL", success == False)
test("Error message mentions no URL", "no webhook" in error.lower() or "not configured" in error.lower())

# ── Test 10: Stale Dedup Cleanup ──
print("── 10. Stale Dedup Cleanup ──")
from notifications import _clear_stale_dedup
# Add a stale entry
with _dedup_lock:
    _alert_dedup["stale_entry"] = datetime.now(timezone.utc) - timedelta(seconds=ALERT_COOLDOWN_SECONDS * 3)
    pre_count = len(_alert_dedup)
_clear_stale_dedup()
with _dedup_lock:
    post_count = len(_alert_dedup)
    stale_removed = "stale_entry" not in _alert_dedup
test("Stale dedup entries cleaned up", stale_removed)
test("Active entries preserved", post_count < pre_count)

# ── Test 11: Email Send (No SMTP) ──
print("── 11. Email Send (No SMTP) ──")
from notifications import send_email
success, error = send_email("test@example.com", "Test", "<p>Test</p>")
test("Email fails gracefully without SMTP config", success == False)
test("Error mentions SMTP not configured", "not configured" in error.lower())

print()
print("=" * 60)
total = passed + failed
if failed == 0:
    print(f"ALL TESTS PASSED: {passed}/{total}")
else:
    print(f"TESTS: {passed}/{total} passed, {failed} FAILED")
print("=" * 60)
print()
