import jwt
import argparse
from datetime import datetime, timedelta, timezone

# Must match LICENSE_SECRET in license.py
LICENSE_SECRET = 'rms-super-secret-license-key-for-offline'

def generate_license(org_id, max_employees, valid_days):
    payload = {
        'org_id': org_id,
        'max_employees': max_employees,
        'exp': datetime.now(timezone.utc) + timedelta(days=valid_days),
        'iat': datetime.now(timezone.utc),
        'type': 'offline_appliance'
    }
    
    token = jwt.encode(payload, LICENSE_SECRET, algorithm='HS256')
    return token

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Generate an offline license key for RMS Face AI.')
    parser.add_argument('--org_id', required=True, help='Organization ID (UUID)')
    parser.add_argument('--max_employees', type=int, default=100, help='Max employees allowed')
    parser.add_argument('--days', type=int, default=365, help='Number of days the license is valid')
    
    args = parser.parse_args()
    
    key = generate_license(args.org_id, args.max_employees, args.days)
    print(f"\n--- GENERATED LICENSE KEY ---")
    print(f"Org ID: {args.org_id}")
    print(f"Max Employees: {args.max_employees}")
    print(f"Valid For: {args.days} days")
    print("\nCopy the following string into a 'license.key' file on the edge appliance:\n")
    print(key)
    print("\n-----------------------------\n")
