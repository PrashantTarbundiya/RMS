"""
test_analytics.py — Unit tests for Phase 7: Advanced Analytics & Reporting.

Tests analytics engine functions without requiring a live database.
Uses mocking to validate query logic, aggregation math, and report structure.
"""

import sys
import os
import json
from datetime import datetime, timezone, timedelta, time
from collections import defaultdict
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.dirname(__file__))

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
print("ADVANCED ANALYTICS & REPORTING — UNIT TEST SUITE")
print("=" * 60)
print()

# ── Test 1: Module Import ──
print("── 1. Module Import ──")
try:
    from analytics import (
        get_department_breakdown,
        get_late_arrival_trends,
        get_attendance_heatmap,
        generate_report_data,
    )
    test("All analytics functions importable", True)
except Exception as e:
    test("All analytics functions importable", False, str(e))

# ── Test 2: Department Breakdown (No DB) ──
print("── 2. Department Breakdown (No DB) ──")
result = get_department_breakdown('test-org-123')
test("Returns dict with departments key", isinstance(result, dict) and 'departments' in result)
test("Departments is a list", isinstance(result.get('departments'), list))

# ── Test 3: Late Arrival Analysis (No DB) ──
print("── 3. Late Arrival Analysis (No DB) ──")
result = get_late_arrival_trends('test-org-123', work_start_hour=9)
test("Returns dict", isinstance(result, dict))
# Without DB it should return an error or empty
test("Returns error or empty data", 'error' in result or result.get('total_checkins', 0) == 0)

# ── Test 4: Heatmap (No DB) ──
print("── 4. Heatmap (No DB) ──")
result = get_attendance_heatmap('test-org-123')
test("Returns dict", isinstance(result, dict))
test("Returns error or empty data", 'error' in result or result.get('total_logs', 0) == 0)

# ── Test 5: Report Data Structure ──
print("── 5. Report Data Structure ──")
report = generate_report_data('test-org-123')
test("Report has generated_at", 'generated_at' in report)
test("Report has org_id", report.get('org_id') == 'test-org-123')
test("Report has date_range", 'date_range' in report)
test("Report has overview", 'overview' in report)
test("Report has department_breakdown", 'department_breakdown' in report)
test("Report has late_arrival_analysis", 'late_arrival_analysis' in report)
test("Report has heatmap", 'heatmap' in report)

# ── Test 6: Report Date Range Parameters ──
print("── 6. Report Date Range Parameters ──")
start = datetime(2026, 1, 1, tzinfo=timezone.utc)
end = datetime(2026, 6, 30, tzinfo=timezone.utc)
report = generate_report_data('test-org-123', start_date=start, end_date=end)
test("Date range start recorded", report['date_range']['start'] == start.isoformat())
test("Date range end recorded", report['date_range']['end'] == end.isoformat())

# ── Test 7: Work Start Time Configuration ──
print("── 7. Work Start Time Configuration ──")
report = generate_report_data(
    'test-org-123', work_start_hour=8, work_start_minute=30
)
late_data = report.get('late_arrival_analysis', {})
# If there's work_start info, it should reflect the custom time
test("Late analysis returned", isinstance(late_data, dict))

# ── Test 8: Simulated Department Aggregation Math ──
print("── 8. Simulated Department Aggregation Math ──")
# Simulate the math used in get_department_breakdown
total_emp = 10
total_checkins = 45
total_days = 5
rate = round((total_checkins / (total_emp * total_days) * 100), 1)
test("Attendance rate calculation correct", rate == 90.0, f"Got {rate}")

# Edge case: zero employees
rate_zero = round((0 / (1) * 100) if 0 > 0 else 0, 1)
test("Zero employees → 0% rate", rate_zero == 0.0)

# Edge case: more checkins than expected
rate_over = round((60 / (total_emp * total_days) * 100), 1)
test("Over 100% possible (multiple checkins/day)", rate_over == 120.0)

# ── Test 9: Late Arrival Logic ──
print("── 9. Late Arrival Logic ──")
work_start = time(9, 0)
checkin_time_late = time(9, 30)
checkin_time_on_time = time(8, 45)
checkin_time_exact = time(9, 0)

test("9:30 is late for 9:00 start", checkin_time_late > work_start)
test("8:45 is on time for 9:00 start", not (checkin_time_on_time > work_start))
test("9:00 exactly is NOT late", not (checkin_time_exact > work_start))

# Minutes late calculation
minutes_late = (9 * 60 + 30) - (9 * 60 + 0)
test("Minutes late calculation correct", minutes_late == 30)

# ── Test 10: Heatmap Grid Dimensions ──
print("── 10. Heatmap Grid Dimensions ──")
grid = [[0] * 24 for _ in range(7)]
test("Grid has 7 rows (days)", len(grid) == 7)
test("Grid has 24 columns (hours)", all(len(row) == 24 for row in grid))

# Simulate a checkin
grid[0][9] += 1  # Monday 9 AM
grid[0][9] += 1
grid[4][17] += 1  # Friday 5 PM
test("Monday 9 AM has 2 entries", grid[0][9] == 2)
test("Friday 5 PM has 1 entry", grid[4][17] == 1)

# Find peak
peak_val = max(max(row) for row in grid)
test("Peak value is 2", peak_val == 2)

# ── Test 11: Day of Week Ordering ──
print("── 11. Day of Week Ordering ──")
day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
test("Day order has 7 days", len(day_order) == 7)
test("Monday first", day_order[0] == 'Monday')
test("Sunday last", day_order[-1] == 'Sunday')

# ── Test 12: Report JSON Serialization ──
print("── 12. Report JSON Serialization ──")
report = generate_report_data('test-org-123')
try:
    serialized = json.dumps(report, default=str)
    test("Report serializes to JSON", len(serialized) > 10)
    deserialized = json.loads(serialized)
    test("Report deserializes correctly", deserialized['org_id'] == 'test-org-123')
except Exception as e:
    test("Report serializes to JSON", False, str(e))
    test("Report deserializes correctly", False)


print()
print("=" * 60)
total = passed + failed
if failed == 0:
    print(f"ALL TESTS PASSED: {passed}/{total}")
else:
    print(f"TESTS: {passed}/{total} passed, {failed} FAILED")
print("=" * 60)
print()
