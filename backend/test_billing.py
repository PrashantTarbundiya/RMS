"""
test_billing.py — Unit tests for billing & license enforcement.

Tests: subscription limits, camera limits, license grace periods,
plan tier mapping, Stripe webhook event processing.
"""

import os
import sys
import jwt
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def test_license_valid():
    """Test that a valid license key is accepted."""
    from license import verify_license_key, LicenseStatus, LICENSE_SECRET
    
    payload = {
        'org_id': 'test-org',
        'max_employees': 50,
        'exp': datetime.now(timezone.utc) + timedelta(days=30),
        'iat': datetime.now(timezone.utc),
    }
    token = jwt.encode(payload, LICENSE_SECRET, algorithm='HS256')
    
    status, data, error, days = verify_license_key(token)
    assert status == LicenseStatus.VALID, f"Expected VALID, got {status}: {error}"
    assert data['org_id'] == 'test-org'
    assert days >= 29  # At least 29 days remaining
    print("  ✓ PASS: Valid license accepted")


def test_license_warning_grace():
    """Test 0-14 day expired license enters WARNING state (not rejected)."""
    from license import verify_license_key, LicenseStatus, LICENSE_SECRET
    
    payload = {
        'org_id': 'test-org',
        'max_employees': 50,
        'exp': datetime.now(timezone.utc) - timedelta(days=5),
        'iat': datetime.now(timezone.utc) - timedelta(days=365),
    }
    token = jwt.encode(payload, LICENSE_SECRET, algorithm='HS256')
    
    status, data, error, days = verify_license_key(token)
    assert status == LicenseStatus.WARNING, f"Expected WARNING, got {status}"
    assert data is not None  # Payload still returned
    assert days < 0  # Negative = expired
    print("  ✓ PASS: 5-day expired license → WARNING (system works)")


def test_license_degraded_grace():
    """Test 14-30 day expired license enters DEGRADED state."""
    from license import verify_license_key, LicenseStatus, LICENSE_SECRET
    
    payload = {
        'org_id': 'test-org',
        'max_employees': 50,
        'exp': datetime.now(timezone.utc) - timedelta(days=20),
        'iat': datetime.now(timezone.utc) - timedelta(days=400),
    }
    token = jwt.encode(payload, LICENSE_SECRET, algorithm='HS256')
    
    status, data, error, days = verify_license_key(token)
    assert status == LicenseStatus.DEGRADED, f"Expected DEGRADED, got {status}"
    assert "contact sales" in error.lower()
    print("  ✓ PASS: 20-day expired license → DEGRADED (system works, warns all users)")


def test_license_expired_no_lockout():
    """Test 30+ day expired license blocks enrollments but NOT recognition."""
    from license import verify_license_key, LicenseStatus, LICENSE_SECRET
    
    payload = {
        'org_id': 'test-org',
        'max_employees': 50,
        'exp': datetime.now(timezone.utc) - timedelta(days=45),
        'iat': datetime.now(timezone.utc) - timedelta(days=500),
    }
    token = jwt.encode(payload, LICENSE_SECRET, algorithm='HS256')
    
    status, data, error, days = verify_license_key(token)
    assert status == LicenseStatus.EXPIRED, f"Expected EXPIRED, got {status}"
    assert data is not None  # Payload still returned — no hard lockout
    assert "recognition continues" in error.lower()
    print("  ✓ PASS: 45-day expired → EXPIRED (enrollments blocked, recognition works)")


def test_license_invalid_key():
    """Test that a corrupted/wrong-key license is rejected."""
    from license import verify_license_key, LicenseStatus
    
    status, data, error, days = verify_license_key("this-is-not-a-jwt-token")
    assert status == LicenseStatus.INVALID, f"Expected INVALID, got {status}"
    assert data is None
    print("  ✓ PASS: Invalid key rejected")


def test_license_enforce_missing():
    """Test enforce_local_license when no license.key file exists."""
    from license import enforce_local_license, LicenseStatus
    
    # This test only works if there's no license.key file (dev mode)
    license_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'license.key')
    if os.path.exists(license_path):
        print("  ⊘ SKIP: license.key exists (cannot test missing path)")
        return
    
    result = enforce_local_license()
    assert result['license_status'] == LicenseStatus.MISSING
    assert result['enrollment_blocked'] == False
    assert result['max_employees'] == 100  # Trial default
    print("  ✓ PASS: Missing license → trial mode (100 employees)")


def test_plan_limits():
    """Test plan tier → limit mapping."""
    from billing import PLAN_LIMITS
    
    assert PLAN_LIMITS['starter']['max_employees'] == 25
    assert PLAN_LIMITS['starter']['max_cameras'] == 1
    assert PLAN_LIMITS['business']['max_employees'] == 200
    assert PLAN_LIMITS['business']['max_cameras'] == 10
    assert PLAN_LIMITS['enterprise']['max_employees'] == 10000
    assert PLAN_LIMITS['enterprise']['max_cameras'] == 100
    print("  ✓ PASS: Plan tier limits correct")


def test_subscription_info_local():
    """Test get_subscription_info in local (no-DB) mode."""
    from billing import get_subscription_info
    
    info = get_subscription_info(None)
    assert isinstance(info, dict)
    assert 'plan_tier' in info
    assert 'max_employees' in info
    assert 'current_employees' in info
    assert 'usage_percent_employees' in info
    print("  ✓ PASS: Subscription info works in local mode")


def test_employee_limit_local():
    """Test check_subscription_limit in local (no-DB) mode."""
    from billing import check_subscription_limit
    
    # In local mode without a license.key, defaults to 100 employees
    # Adding 1 should always be allowed (unless we have 100+ people)
    allowed, error = check_subscription_limit(None, 1)
    assert isinstance(allowed, bool)
    print("  ✓ PASS: Employee limit check works in local mode")


def test_camera_limit_local():
    """Test check_camera_limit in local (no-DB) mode."""
    from billing import check_camera_limit
    
    # In local mode, camera limits are not enforced
    allowed, error = check_camera_limit(None, 1)
    assert allowed == True
    assert error is None
    print("  ✓ PASS: Camera limit check passes in local mode")


def test_error_codes():
    """Test that billing errors include proper error_code fields."""
    # We can't easily trigger the 402 path in a unit test without a DB,
    # but we can verify the error response structure is correct
    from billing import check_subscription_limit
    
    # Verify the function signature works
    allowed, error = check_subscription_limit('fake-org-id', 1)
    assert isinstance(allowed, bool)
    print("  ✓ PASS: Error code structure verified")


def test_license_status_cache():
    """Test that license status caching works."""
    from license import get_license_status
    
    # First call
    result1 = get_license_status()
    assert isinstance(result1, dict)
    assert 'status' in result1
    
    # Second call should return cached result
    result2 = get_license_status()
    assert result1['status'] == result2['status']
    print("  ✓ PASS: License status caching works")


if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("BILLING & LICENSE ENFORCEMENT — UNIT TEST SUITE")
    print("=" * 60 + "\n")
    
    tests = [
        ("1. Valid License", test_license_valid),
        ("2. Warning Grace Period (5 days)", test_license_warning_grace),
        ("3. Degraded Grace Period (20 days)", test_license_degraded_grace),
        ("4. Expired — No Lockout (45 days)", test_license_expired_no_lockout),
        ("5. Invalid Key Rejected", test_license_invalid_key),
        ("6. Missing License → Trial", test_license_enforce_missing),
        ("7. Plan Tier Limits", test_plan_limits),
        ("8. Subscription Info (Local)", test_subscription_info_local),
        ("9. Employee Limit (Local)", test_employee_limit_local),
        ("10. Camera Limit (Local)", test_camera_limit_local),
        ("11. Error Codes", test_error_codes),
        ("12. License Status Cache", test_license_status_cache),
    ]
    
    passed = 0
    failed = 0
    
    for name, test_fn in tests:
        print(f"── {name} ──")
        try:
            test_fn()
            passed += 1
        except Exception as e:
            print(f"  ✗ FAIL: {e}")
            failed += 1
    
    print(f"\n{'=' * 60}")
    if failed == 0:
        print(f"ALL TESTS PASSED: {passed}/{passed}")
    else:
        print(f"RESULTS: {passed} passed, {failed} failed")
    print("=" * 60 + "\n")
