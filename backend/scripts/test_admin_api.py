import sys
sys.path.insert(0, 'backend')
from server import app
from database.db import init_database
from unittest.mock import patch

init_database()
with app.test_client() as c:
    with patch('auth.decode_token', return_value={'sub': 'c15a8367-8bf9-424c-9f7a-06ae9a3dea4c', 'org_id': 'f549fd90-1b8e-4848-8a8d-c7f0b50845b0', 'role': 'platform_owner', 'type': 'access'}):
        r1 = c.get('/api/admin/overview', headers={'Authorization': 'Bearer test-token'})
        print("Overview Status:", r1.status_code)
        if r1.status_code != 200:
            print("Overview Error:", r1.get_data(as_text=True))
        else:
            print("Overview Data:", r1.get_json())

        r2 = c.get('/api/admin/organizations', headers={'Authorization': 'Bearer test-token'})
        print("Orgs Status:", r2.status_code)
        if r2.status_code != 200:
            print("Orgs Error:", r2.get_data(as_text=True))
        else:
            print("Orgs Data Count:", len(r2.get_json().get('organizations', [])))

