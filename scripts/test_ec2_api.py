import urllib3
urllib3.disable_warnings()
import requests

s = requests.Session()
res = s.post('https://13-60-225-165.sslip.io/api/auth/login', json={'email': 'admin@rms.local', 'password': 'admin12345'}, verify=False)
data = res.json()
token = data.get('access_token')
headers = {'Authorization': f'Bearer {token}'}

h_res = s.get('https://13-60-225-165.sslip.io/api/history', headers=headers, verify=False)
records = h_res.json()
print(f"History total records: {len(records)}")
for r in records[:10]:
    print(f"  - Label: {r.get('label')}, Conf: {r.get('confidence')}, Time: {r.get('timestamp')}")

has_va = any(r.get('label', '').lower() == 'va' for r in records)
print(f"Is unverified 'Va' record present?: {has_va}")
