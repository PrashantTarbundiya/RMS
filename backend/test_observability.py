import os
import sys
import json
import unittest
from unittest.mock import patch, MagicMock

from flask import Flask, jsonify, g
from observability import init_observability, get_system_health, StructuredJsonFormatter

class TestObservability(unittest.TestCase):

    def setUp(self):
        self.app = Flask(__name__)
        init_observability(self.app)
        
        # Add a route that deliberately triggers an unhandled exception
        @self.app.route('/test-crash')
        def test_crash():
            raise RuntimeError("Deliberate Test Exception for Error Tracking")

        @self.app.route('/test-normal')
        def test_normal():
            return jsonify({'status': 'ok'})

        self.client = self.app.test_client()

    def test_structured_log_formatter(self):
        formatter = StructuredJsonFormatter()
        log_record = unittest.mock.MagicMock()
        log_record.levelname = 'INFO'
        log_record.name = 'rms-api'
        log_record.getMessage.return_value = 'Test log message'
        log_record.exc_info = None

        formatted = formatter.format(log_record)
        parsed = json.loads(formatted)
        
        self.assertEqual(parsed['level'], 'INFO')
        self.assertEqual(parsed['message'], 'Test log message')
        self.assertIn('timestamp', parsed)

    def test_unhandled_exception_captured_with_context(self):
        # Trigger the crash route
        response = self.client.get('/test-crash', headers={'X-Request-ID': 'req_test_12345'})
        
        self.assertEqual(response.status_code, 500)
        data = response.get_json()
        self.assertEqual(data['error'], 'Internal Server Error')
        self.assertEqual(data['request_id'], 'req_test_12345')
        self.assertIn('X-Request-ID', response.headers)
        self.assertEqual(response.headers['X-Request-ID'], 'req_test_12345')

    def test_structured_log_has_request_id_and_org_id(self):
        response = self.client.get('/test-normal')
        self.assertEqual(response.status_code, 200)
        self.assertIn('X-Request-ID', response.headers)
        self.assertTrue(response.headers['X-Request-ID'].startswith('req_'))

    def test_internal_health_view_normal(self):
        response = self.client.get('/api/internal/health')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('status', data)
        self.assertIn('checks', data)
        self.assertIn('memory', data['checks'])
        self.assertIn('disk', data['checks'])

    @patch('database.db.get_db_session')
    @patch('database.db.is_db_available', return_value=True)
    def test_internal_health_degraded_when_db_fails(self, mock_is_db, mock_session):
        # Simulate DB connection failure / exception
        mock_session.side_effect = Exception("DB Connection Refused")
        
        health_data = get_system_health()
        self.assertEqual(health_data['status'], 'degraded')
        self.assertIn('error: DB Connection Refused', health_data['checks']['database']['status'])

if __name__ == '__main__':
    unittest.main()
