import os
import sys
import unittest
from unittest.mock import patch, MagicMock

from security_hardening import (
    get_sso_config,
    build_sso_auth_url,
    validate_sso_callback,
    _normalize_sso_user
)

class TestSSOIntegration(unittest.TestCase):

    def setUp(self):
        os.environ['SSO_PROVIDER'] = 'google'
        os.environ['SSO_CLIENT_ID'] = 'test-client-id.apps.googleusercontent.com'
        os.environ['SSO_CLIENT_SECRET'] = 'test-client-secret'
        os.environ['SSO_REDIRECT_URI'] = 'https://rms.example.com/api/auth/sso/callback'

    def test_sso_auth_url_generation(self):
        config = get_sso_config()
        self.assertIsNotNone(config)
        
        auth_url, state = build_sso_auth_url(config)
        self.assertIn("accounts.google.com", auth_url)
        self.assertIn("client_id=test-client-id", auth_url)
        self.assertIn(state, auth_url)

    @patch('requests.post')
    @patch('requests.get')
    def test_sso_callback_success_path(self, mock_get, mock_post):
        config = get_sso_config()
        state = 'valid-csrf-state-123'
        
        # Mock token response
        mock_token_resp = MagicMock()
        mock_token_resp.status_code = 200
        mock_token_resp.json.return_value = {'access_token': 'mock-access-token'}
        mock_post.return_value = mock_token_resp
        
        # Mock userinfo response
        mock_user_resp = MagicMock()
        mock_user_resp.status_code = 200
        mock_user_resp.json.return_value = {
            'sub': 'google-user-12345',
            'email': 'john.doe@company.com',
            'name': 'John Doe',
            'picture': 'https://google.com/photo.jpg',
            'email_verified': True
        }
        mock_get.return_value = mock_user_resp
        
        success, user_info, err = validate_sso_callback(
            config=config,
            code='valid-auth-code-xyz',
            expected_state=state,
            received_state=state
        )
        
        self.assertTrue(success)
        self.assertIsNone(err)
        self.assertEqual(user_info['email'], 'john.doe@company.com')
        self.assertEqual(user_info['provider'], 'google')

    def test_sso_callback_failure_csrf_mismatch(self):
        config = get_sso_config()
        success, user_info, err = validate_sso_callback(
            config=config,
            code='valid-auth-code-xyz',
            expected_state='expected-state-123',
            received_state='attacker-state-456'
        )
        
        self.assertFalse(success)
        self.assertIn('State mismatch', err)

    def test_sso_callback_failure_denied_or_cancelled(self):
        config = get_sso_config()
        state = 'valid-state-123'
        
        # When user clicks 'Cancel' or 'Deny' on IdP consent screen, code is None/empty
        success, user_info, err = validate_sso_callback(
            config=config,
            code='',
            expected_state=state,
            received_state=state
        )
        
        self.assertFalse(success)
        self.assertIn('Missing authorization code', err)

    @patch('requests.post')
    def test_sso_callback_failure_invalid_code(self, mock_post):
        config = get_sso_config()
        state = 'valid-state-123'
        
        # Mock failed token exchange
        mock_resp = MagicMock()
        mock_resp.status_code = 400
        mock_resp.text = '{"error": "invalid_grant"}'
        mock_post.return_value = mock_resp
        
        success, user_info, err = validate_sso_callback(
            config=config,
            code='invalid-code',
            expected_state=state,
            received_state=state
        )
        
        self.assertFalse(success)
        self.assertIn('Token exchange failed', err)

if __name__ == '__main__':
    unittest.main()
