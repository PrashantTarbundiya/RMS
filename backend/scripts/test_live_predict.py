import sys, os, urllib.request, json
from dotenv import load_dotenv
load_dotenv('backend/.env')
sys.path.insert(0, os.path.abspath('backend'))
from auth import create_access_token

token = create_access_token(user_id='local-admin-1', org_id='default-org', role='org_admin')

def test_api_predict(img_path, expected_name):
    boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    with open(img_path, 'rb') as f:
        img_bytes = f.read()
    
    parts = []
    parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="test.jpg"\r\nContent-Type: image/jpeg\r\n\r\n'.encode('utf-8'))
    parts.append(img_bytes)
    parts.append(f'\r\n--{boundary}\r\nContent-Disposition: form-data; name="test_mode"\r\n\r\ntrue\r\n'.encode('utf-8'))
    parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="single_focus"\r\n\r\ntrue\r\n'.encode('utf-8'))
    parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="kiosk_mode"\r\n\r\ntrue\r\n'.encode('utf-8'))
    parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="threshold"\r\n\r\n0.70\r\n'.encode('utf-8'))
    parts.append(f'--{boundary}--\r\n'.encode('utf-8'))

    body = b''.join(parts)
    req = urllib.request.Request(
        'http://127.0.0.1:5000/api/predict',
        data=body,
        headers={
            'Authorization': 'Bearer ' + token,
            'Content-Type': f'multipart/form-data; boundary={boundary}'
        }
    )
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read().decode('utf-8'))
        results = data.get('results', [])
        if results:
            ens = results[0].get('ensemble', {})
            print(f'Expected: {expected_name:15} -> Server: {ens.get("label"):15} | conf: {ens.get("confidence")} | is_confirmed: {ens.get("is_confirmed")} | display: {ens.get("display")}')
        else:
            print(f'Expected: {expected_name:15} -> No faces returned: {data.get("message")}')
    except Exception as e:
        print(f'Expected: {expected_name:15} -> Error: {e}')

if __name__ == '__main__':
    test_api_predict('dataset_cleaned/vatsal_vadgama/frontal/vatsal_vadgama_frontal_001.jpg', 'vatsal_vadgama')
    test_api_predict('dataset_cleaned/shivam_petkar/frontal/shivam_petkar_frontal_001.jpg', 'shivam_petkar')

