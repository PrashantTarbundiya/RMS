import urllib3
urllib3.disable_warnings()
import requests

s = requests.Session()
res = s.post('https://13-60-225-165.sslip.io/api/auth/login', json={'email': 'admin@rms.local', 'password': 'admin12345'}, verify=False)
data = res.json()
token = data.get('access_token')
headers = {'Authorization': f'Bearer {token}'}

dash_res = s.get('https://13-60-225-165.sslip.io/api/dashboard', headers=headers, verify=False)
dash_data = dash_res.json()
print("total_people:", dash_data.get("total_people"))
print("total_photos:", dash_data.get("total_photos"))
print("people list:", [p.get("name") for p in dash_data.get("people", [])[:15]])

