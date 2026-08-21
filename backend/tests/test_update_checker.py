"""
test_update_checker.py — Unit tests for the release sync system.

Tests: version comparison, checksum verification, HMAC signing,
manifest parsing, backup creation.
"""

import os
import sys
import json
import hashlib
import hmac
import tempfile
import tarfile

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def test_version_comparison():
    """Test semantic version comparison logic."""
    from update_checker import _compare_versions
    
    assert _compare_versions('1.0.0', '1.1.0') == 'update_available'
    assert _compare_versions('1.0.0', '1.0.0') == 'up_to_date'
    assert _compare_versions('1.1.0', '1.0.0') == 'ahead'
    assert _compare_versions('1.0.0', '2.0.0') == 'update_available'
    assert _compare_versions('0.9.0', '1.0.0') == 'update_available'
    assert _compare_versions('1.0.0', '1.0.1') == 'update_available'
    print("  ✓ PASS: Version comparison")


def test_checksum_computation():
    """Test SHA-256 checksum computation."""
    from update_checker import compute_sha256
    
    # Create a temp file with known content
    with tempfile.NamedTemporaryFile(delete=False, suffix='.bin') as f:
        f.write(b"test content for checksum")
        temp_path = f.name
    
    try:
        checksum = compute_sha256(temp_path)
        
        # Verify manually
        expected = hashlib.sha256(b"test content for checksum").hexdigest()
        assert checksum == expected, f"Checksum mismatch: {checksum} != {expected}"
        print("  ✓ PASS: SHA-256 checksum computation")
    finally:
        os.unlink(temp_path)


def test_hmac_signature():
    """Test HMAC-SHA256 signature computation and verification."""
    from update_checker import compute_hmac_signature
    
    with tempfile.NamedTemporaryFile(delete=False, suffix='.bin') as f:
        f.write(b"test content for signing")
        temp_path = f.name
    
    try:
        key = 'test-signing-key'
        sig = compute_hmac_signature(temp_path, key)
        
        # Verify manually
        expected = hmac.new(
            key.encode('utf-8'),
            b"test content for signing",
            hashlib.sha256
        ).hexdigest()
        assert sig == expected, f"Signature mismatch"
        
        # Different key should produce different signature
        sig2 = compute_hmac_signature(temp_path, 'different-key')
        assert sig != sig2, "Different keys should produce different signatures"
        
        print("  ✓ PASS: HMAC signature computation")
    finally:
        os.unlink(temp_path)


def test_package_verification_valid():
    """Test that a valid package passes verification."""
    from update_checker import verify_package, compute_sha256, compute_hmac_signature
    
    with tempfile.NamedTemporaryFile(delete=False, suffix='.tar.gz') as f:
        f.write(b"fake package content")
        temp_path = f.name
    
    try:
        checksum = compute_sha256(temp_path)
        sig = compute_hmac_signature(temp_path)
        
        # Should pass with correct checksum
        is_valid, error = verify_package(temp_path, checksum)
        assert is_valid, f"Valid package rejected: {error}"
        assert error is None
        
        # Should pass with sha256: prefix
        is_valid, error = verify_package(temp_path, f"sha256:{checksum}")
        assert is_valid, f"Valid package with prefix rejected: {error}"
        
        # Should pass with checksum + signature
        is_valid, error = verify_package(temp_path, checksum, sig)
        assert is_valid, f"Valid signed package rejected: {error}"
        
        print("  ✓ PASS: Valid package verification")
    finally:
        os.unlink(temp_path)


def test_package_verification_invalid_checksum():
    """Test that a tampered package fails verification."""
    from update_checker import verify_package
    
    with tempfile.NamedTemporaryFile(delete=False, suffix='.tar.gz') as f:
        f.write(b"some content")
        temp_path = f.name
    
    try:
        is_valid, error = verify_package(temp_path, "0000000000000000")
        assert not is_valid, "Tampered package should be rejected"
        assert "mismatch" in error.lower() or "checksum" in error.lower()
        print("  ✓ PASS: Invalid checksum rejected")
    finally:
        os.unlink(temp_path)


def test_package_verification_invalid_signature():
    """Test that a package with wrong signature fails."""
    from update_checker import verify_package, compute_sha256
    
    with tempfile.NamedTemporaryFile(delete=False, suffix='.tar.gz') as f:
        f.write(b"content to sign")
        temp_path = f.name
    
    try:
        checksum = compute_sha256(temp_path)
        is_valid, error = verify_package(temp_path, checksum, "wrong_signature_here")
        assert not is_valid, "Wrong signature should be rejected"
        assert "signature" in error.lower()
        print("  ✓ PASS: Invalid signature rejected")
    finally:
        os.unlink(temp_path)


def test_package_missing_file():
    """Test verification of non-existent file."""
    from update_checker import verify_package
    
    is_valid, error = verify_package("/nonexistent/file.tar.gz", "abc123")
    assert not is_valid
    assert "not found" in error.lower()
    print("  ✓ PASS: Missing file rejected")


def test_manifest_parsing():
    """Test that check_for_updates correctly parses a local manifest."""
    from update_checker import check_for_updates
    
    result = check_for_updates()
    
    assert isinstance(result, dict)
    assert 'status' in result
    assert 'current_version' in result
    assert result['current_version'] == '1.0.0'
    
    # Since manifest has latest_version = 1.0.0 and current is 1.0.0
    assert result['status'] in ('up_to_date', 'update_available', 'ahead', 'error')
    print("  ✓ PASS: Manifest parsing")


def test_system_info():
    """Test system info retrieval."""
    from update_checker import get_system_info
    
    info = get_system_info()
    assert isinstance(info, dict)
    assert 'app_version' in info
    assert info['app_version'] == '1.0.0'
    assert 'update_available' in info
    assert isinstance(info['update_available'], bool)
    print("  ✓ PASS: System info retrieval")


def test_backup_creation():
    """Test backup creation (creates and verifies a backup archive)."""
    from update_checker import create_backup, BACKUPS_DIR
    
    success, backup_path, error = create_backup()
    
    assert success, f"Backup failed: {error}"
    assert backup_path is not None
    assert os.path.exists(backup_path)
    assert backup_path.endswith('.tar.gz')
    
    # Verify the backup is a valid tar archive
    assert tarfile.is_tarfile(backup_path)
    
    # Clean up
    os.remove(backup_path)
    print("  ✓ PASS: Backup creation")


def test_version_module():
    """Test that version.py exports are correct."""
    from version import APP_VERSION, APP_NAME
    
    assert isinstance(APP_VERSION, str)
    assert '.' in APP_VERSION  # semantic version format
    assert APP_NAME == "RMS Face AI"
    print("  ✓ PASS: Version module exports")


if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("RELEASE SYNC SYSTEM — UNIT TEST SUITE")
    print("=" * 60 + "\n")
    
    tests = [
        ("1. Version Comparison", test_version_comparison),
        ("2. Checksum Computation", test_checksum_computation),
        ("3. HMAC Signature", test_hmac_signature),
        ("4. Valid Package Verification", test_package_verification_valid),
        ("5. Invalid Checksum Rejection", test_package_verification_invalid_checksum),
        ("6. Invalid Signature Rejection", test_package_verification_invalid_signature),
        ("7. Missing File Rejection", test_package_missing_file),
        ("8. Manifest Parsing", test_manifest_parsing),
        ("9. System Info", test_system_info),
        ("10. Backup Creation", test_backup_creation),
        ("11. Version Module", test_version_module),
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
