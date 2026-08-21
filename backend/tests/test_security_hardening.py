"""
test_security_hardening.py — Unit tests for Phase 10: Broader Security Hardening.

Tests SSO/OAuth2 configuration, API key rotation with grace period,
and encryption at rest for encodings.pickle.
"""

import sys
import os
import json
import pickle
import tempfile
import shutil
from datetime import datetime, timedelta, timezone

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
print("BROADER SECURITY HARDENING — UNIT TEST SUITE")
print("=" * 60)
print()

# ── Test 1: Module Import ──
print("── 1. Module Import ──")
try:
    from security_hardening import (
        get_sso_config,
        build_sso_auth_url,
        validate_sso_callback,
        OIDC_PROVIDERS,
        rotate_api_key,
        validate_grace_period_key,
        cleanup_expired_grace_keys,
        generate_org_encryption_key,
        derive_key_from_passphrase,
        encrypt_encodings,
        decrypt_encodings,
        encrypt_encodings_file,
        decrypt_encodings_file,
        is_file_encrypted,
    )
    test("All security functions importable", True)
except Exception as e:
    test("All security functions importable", False, str(e))


# ── Test 2: OIDC Provider Registry ──
print("── 2. OIDC Provider Registry ──")
test("Google provider registered", 'google' in OIDC_PROVIDERS)
test("Microsoft provider registered", 'microsoft' in OIDC_PROVIDERS)
test("Okta provider registered", 'okta' in OIDC_PROVIDERS)
test("Google has discovery URL", 'discovery_url' in OIDC_PROVIDERS['google'])
test("Microsoft has discovery URL", 'discovery_url' in OIDC_PROVIDERS['microsoft'])
test("Okta has URL template", 'discovery_url_template' in OIDC_PROVIDERS['okta'])


# ── Test 3: SSO Config — Not Configured ──
print("── 3. SSO Config — Not Configured ──")
# Clear env vars to ensure SSO is not configured
old_env = {}
for key in ['SSO_PROVIDER', 'SSO_CLIENT_ID', 'SSO_CLIENT_SECRET']:
    old_env[key] = os.environ.pop(key, None)

config = get_sso_config()
test("Returns None when not configured", config is None)


# ── Test 4: SSO Config — Google ──
print("── 4. SSO Config — Google ──")
os.environ['SSO_PROVIDER'] = 'google'
os.environ['SSO_CLIENT_ID'] = 'test-client-id.apps.googleusercontent.com'
os.environ['SSO_CLIENT_SECRET'] = 'test-secret'
os.environ['SSO_REDIRECT_URI'] = 'https://app.example.com/api/auth/sso/callback'

config = get_sso_config()
test("Config returns dict", config is not None)
test("Provider is google", config.get('provider') == 'google')
test("Has client_id", config.get('client_id') == 'test-client-id.apps.googleusercontent.com')
test("Has redirect_uri", config.get('redirect_uri') == 'https://app.example.com/api/auth/sso/callback')
test("Has discovery URL", 'accounts.google.com' in config.get('discovery_url', ''))
test("Display name is Google Workspace", config.get('display_name') == 'Google Workspace')


# ── Test 5: SSO Auth URL Builder ──
print("── 5. SSO Auth URL Builder ──")
auth_url, state = build_sso_auth_url(config, state='test-state-123')
test("Auth URL contains Google endpoint", 'accounts.google.com' in auth_url)
test("Auth URL has client_id", 'client_id=' in auth_url)
test("Auth URL has redirect_uri", 'redirect_uri=' in auth_url)
test("Auth URL has scope openid", 'openid' in auth_url)
test("State returned correctly", state == 'test-state-123')
test("Auth URL has state", 'state=test-state-123' in auth_url)

# Auto-generated state
_, auto_state = build_sso_auth_url(config)
test("Auto-generated state is non-empty", len(auto_state) > 10)


# ── Test 6: SSO Config — Microsoft ──
print("── 6. SSO Config — Microsoft ──")
os.environ['SSO_PROVIDER'] = 'microsoft'
config_ms = get_sso_config()
test("Microsoft config works", config_ms is not None)
test("Microsoft provider correct", config_ms.get('provider') == 'microsoft')
test("Microsoft has login.microsoftonline.com", 'microsoftonline' in config_ms.get('discovery_url', ''))

auth_url_ms, _ = build_sso_auth_url(config_ms)
test("Microsoft auth URL correct", 'microsoftonline' in auth_url_ms)


# ── Test 7: SSO Config — Okta ──
print("── 7. SSO Config — Okta ──")
os.environ['SSO_PROVIDER'] = 'okta'
os.environ['SSO_OKTA_DOMAIN'] = 'myorg.okta.com'
config_okta = get_sso_config()
test("Okta config works", config_okta is not None)
test("Okta discovery URL uses domain", 'myorg.okta.com' in config_okta.get('discovery_url', ''))

# Restore env
for key, val in old_env.items():
    if val is not None:
        os.environ[key] = val
    elif key in os.environ:
        del os.environ[key]
for key in ['SSO_PROVIDER', 'SSO_CLIENT_ID', 'SSO_CLIENT_SECRET', 'SSO_REDIRECT_URI', 'SSO_OKTA_DOMAIN']:
    os.environ.pop(key, None)


# ── Test 8: SSO Callback — State Mismatch ──
print("── 8. SSO Callback — State Mismatch ──")
os.environ['SSO_PROVIDER'] = 'google'
os.environ['SSO_CLIENT_ID'] = 'test'
os.environ['SSO_CLIENT_SECRET'] = 'test'
os.environ['SSO_REDIRECT_URI'] = 'https://test.com/callback'

config = get_sso_config()
success, info, error = validate_sso_callback(config, 'code123', 'expected-state', 'wrong-state')
test("State mismatch detected", success == False)
test("Error mentions CSRF", 'CSRF' in (error or '').upper() or 'state' in (error or '').lower())

for key in ['SSO_PROVIDER', 'SSO_CLIENT_ID', 'SSO_CLIENT_SECRET', 'SSO_REDIRECT_URI']:
    os.environ.pop(key, None)


# ── Test 9: SSO Callback — Missing Code ──
print("── 9. SSO Callback — Missing Code ──")
os.environ['SSO_PROVIDER'] = 'google'
os.environ['SSO_CLIENT_ID'] = 'test'
os.environ['SSO_CLIENT_SECRET'] = 'test'
os.environ['SSO_REDIRECT_URI'] = 'https://test.com/callback'

config = get_sso_config()
success, info, error = validate_sso_callback(config, None, 'state', 'state')
test("Missing code detected", success == False)
test("Error mentions code", 'code' in (error or '').lower())

for key in ['SSO_PROVIDER', 'SSO_CLIENT_ID', 'SSO_CLIENT_SECRET', 'SSO_REDIRECT_URI']:
    os.environ.pop(key, None)


# ── Test 10: User Normalization ──
print("── 10. User Normalization ──")
from security_hardening import _normalize_sso_user

google_user = _normalize_sso_user('google', {
    'email': 'alice@example.com', 'name': 'Alice', 'sub': 'g-123',
    'picture': 'https://photo.url', 'email_verified': True,
})
test("Google user has email", google_user['email'] == 'alice@example.com')
test("Google user has name", google_user['name'] == 'Alice')
test("Google user has provider_id", google_user['provider_id'] == 'g-123')
test("Google user has provider", google_user['provider'] == 'google')

ms_user = _normalize_sso_user('microsoft', {
    'displayName': 'Bob', 'mail': 'bob@example.com', 'id': 'ms-456',
})
test("Microsoft user email from mail field", ms_user['email'] == 'bob@example.com')
test("Microsoft user name from displayName", ms_user['name'] == 'Bob')

okta_user = _normalize_sso_user('okta', {
    'email': 'carol@example.com', 'name': 'Carol', 'sub': 'ok-789',
})
test("Okta user normalized", okta_user['email'] == 'carol@example.com')


# ── Test 11: API Key Rotation — No DB ──
print("── 11. API Key Rotation — No DB ──")
success, result, error = rotate_api_key('fake-camera-id', 24)
test("Rotation fails without DB", success == False)
test("Error mentions database", 'database' in (error or '').lower() or 'not' in (error or '').lower())


# ── Test 12: Grace Period Key Validation ──
print("── 12. Grace Period Key Validation ──")
# Set up a test grace file
test_dir = os.path.join(os.path.dirname(__file__), 'data')
os.makedirs(test_dir, exist_ok=True)
grace_file = os.path.join(test_dir, 'api_key_grace.json')

# Write a test entry — one valid, one expired
test_grace = {
    'valid-old-key': {
        'camera_id': 'cam-001',
        'org_id': 'org-001',
        'expires_at': (datetime.now(timezone.utc) + timedelta(hours=12)).isoformat(),
        'replaced_by': 'new-key-001',
    },
    'expired-old-key': {
        'camera_id': 'cam-002',
        'org_id': 'org-002',
        'expires_at': (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat(),
        'replaced_by': 'new-key-002',
    },
}

with open(grace_file, 'w') as f:
    json.dump(test_grace, f)

result = validate_grace_period_key('valid-old-key')
test("Valid grace key found", result is not None)
test("Grace key has camera_id", result.get('camera_id') == 'cam-001')
test("Grace key marked as grace_period", result.get('grace_period') == True)

result_expired = validate_grace_period_key('expired-old-key')
test("Expired grace key rejected", result_expired is None)

result_unknown = validate_grace_period_key('unknown-key')
test("Unknown key returns None", result_unknown is None)


# ── Test 13: Cleanup Expired Grace Keys ──
print("── 13. Cleanup Expired Grace Keys ──")
# Re-write with an expired entry
with open(grace_file, 'w') as f:
    json.dump(test_grace, f)

removed = cleanup_expired_grace_keys()
test("Expired keys cleaned up", removed >= 1)

# Verify the valid one remains
with open(grace_file, 'r') as f:
    remaining = json.load(f)
test("Valid key still present", 'valid-old-key' in remaining)
test("Expired key removed", 'expired-old-key' not in remaining)

# Cleanup
os.remove(grace_file)


# ── Test 14: Encryption Key Generation ──
print("── 14. Encryption Key Generation ──")
key = generate_org_encryption_key()
test("Key is 32 bytes", len(key) == 32)
test("Key is bytes", isinstance(key, bytes))

key2 = generate_org_encryption_key()
test("Two keys are different", key != key2)


# ── Test 15: Key Derivation from Passphrase ──
print("── 15. Key Derivation ──")
key1, salt1 = derive_key_from_passphrase('my-secret-passphrase')
test("Derived key is 32 bytes", len(key1) == 32)
test("Salt is 16 bytes", len(salt1) == 16)

# Same passphrase + same salt = same key
key1b, _ = derive_key_from_passphrase('my-secret-passphrase', salt1)
test("Same passphrase+salt = same key", key1 == key1b)

# Different passphrase = different key
key2, _ = derive_key_from_passphrase('different-passphrase', salt1)
test("Different passphrase = different key", key1 != key2)


# ── Test 16: Encrypt/Decrypt Round-Trip (XOR Fallback) ──
print("── 16. Encrypt/Decrypt — XOR Fallback ──")
test_data = pickle.dumps({'names': ['Alice', 'Bob'], 'encodings': [[1, 2, 3], [4, 5, 6]]})
key = generate_org_encryption_key()

encrypted = encrypt_encodings(test_data, key)
test("Encrypted data starts with RMSE or RMSX", encrypted[:4] in (b'RMSE', b'RMSX'))
test("Encrypted differs from plaintext", encrypted != test_data)
test("Encrypted is larger", len(encrypted) > len(test_data))

decrypted = decrypt_encodings(encrypted, key)
test("Decrypted matches original", decrypted == test_data)

# Verify the decrypted data is valid pickle
unpickled = pickle.loads(decrypted)
test("Unpickled has names", unpickled['names'] == ['Alice', 'Bob'])
test("Unpickled has encodings", unpickled['encodings'] == [[1, 2, 3], [4, 5, 6]])


# ── Test 17: Wrong Key Fails ──
print("── 17. Wrong Key Fails ──")
wrong_key = generate_org_encryption_key()
try:
    decrypt_encodings(encrypted, wrong_key)
    test("Wrong key fails decryption", False, "Should have raised exception")
except Exception as e:
    test("Wrong key fails decryption", True)
    test("Error mentions mismatch or decrypt", 'checksum' in str(e).lower() or 'decrypt' in str(e).lower() or 'tag' in str(e).lower())


# ── Test 18: File Encryption Round-Trip ──
print("── 18. File Encryption Round-Trip ──")
# Create a temp encodings file
test_dir_tmp = tempfile.mkdtemp()
input_file = os.path.join(test_dir_tmp, 'encodings.pickle')
encrypted_file = os.path.join(test_dir_tmp, 'encodings.encrypted')

with open(input_file, 'wb') as f:
    pickle.dump({'names': ['Test'], 'encodings': [[1, 0, 0]]}, f)

key = generate_org_encryption_key()
success, stats, error = encrypt_encodings_file(input_file, encrypted_file, key)
test("File encryption succeeds", success)
test("Stats has input_size", 'input_size' in stats)
test("Stats has encrypted_size", 'encrypted_size' in stats)
test("Encrypted file exists", os.path.exists(encrypted_file))

success_d, data, error_d = decrypt_encodings_file(encrypted_file, key)
test("File decryption succeeds", success_d)
test("Decrypted data has names", data.get('names') == ['Test'])
test("Decrypted data has encodings", data.get('encodings') == [[1, 0, 0]])


# ── Test 19: is_file_encrypted ──
print("── 19. is_file_encrypted Detection ──")
test("Encrypted file detected", is_file_encrypted(encrypted_file))
test("Plaintext file not detected", not is_file_encrypted(input_file))
test("Non-existent file returns False", not is_file_encrypted('/nonexistent'))

# Cleanup
shutil.rmtree(test_dir_tmp)


# ── Test 20: Encrypt Missing File ──
print("── 20. Error Handling ──")
success, stats, error = encrypt_encodings_file('/nonexistent/encodings.pickle', '/tmp/out', key)
test("Missing file fails", success == False)
test("Error mentions not found", 'not found' in (error or '').lower())

# Too short data
try:
    decrypt_encodings(b'short', key)
    test("Too-short data fails", False)
except ValueError as e:
    test("Too-short data fails", True)


print()
print("=" * 60)
total = passed + failed
if failed == 0:
    print(f"ALL TESTS PASSED: {passed}/{total}")
else:
    print(f"TESTS: {passed}/{total} passed, {failed} FAILED")
print("=" * 60)
print()
