import urllib3
urllib3.disable_warnings()
import requests
import json
import sys

DOMAIN = "https://13-60-225-165.sslip.io"

print("==================================================")
print("  AuraPass Enterprise Live Production Verification")
print("  Target:", DOMAIN)
print("==================================================")

# 1. Ping
try:
    p = requests.get(f"{DOMAIN}/api/ping", verify=False, timeout=15)
    print("1. PING Status:", p.status_code, p.json() if p.ok else p.text)
except Exception as e:
    print("1. PING Error:", e)

# 2. Login Super Admin
s = requests.Session()
token = None
try:
    login_res = s.post(f"{DOMAIN}/api/auth/login", json={
        "email": "vatsalvadgama04@gmail.com",
        "password": "Admin@12345"
    }, verify=False, timeout=15)
    print("2. LOGIN Status:", login_res.status_code)
    if login_res.ok:
        data = login_res.json()
        token = data.get("access_token")
        user_info = data.get("user", {})
        print(f"   Super Admin Login SUCCESS! Email: {user_info.get('email')} | Role: {user_info.get('role')}")
    else:
        print("   Login Failed:", login_res.text)
except Exception as e:
    print("2. LOGIN Error:", e)

# 3. Test Admin Overview, Financials, Organizations, Tickets
if token:
    headers = {"Authorization": f"Bearer {token}"}
    
    # Overview
    try:
        ov_res = s.get(f"{DOMAIN}/api/admin/overview", headers=headers, verify=False, timeout=15)
        print("3. ADMIN OVERVIEW Status:", ov_res.status_code)
        if ov_res.ok:
            metrics = ov_res.json().get("metrics", {})
            print(f"   Metrics: Orgs={metrics.get('organizations_count')}, Staff={metrics.get('employees_count')}, Cameras={metrics.get('cameras_count')}, MRR=INR {metrics.get('estimated_mrr_inr')}")
    except Exception as e:
        print("   ADMIN OVERVIEW Error:", e)

    # Financials
    try:
        fin_res = s.get(f"{DOMAIN}/api/admin/financials", headers=headers, verify=False, timeout=15)
        print("4. ADMIN FINANCIALS Status:", fin_res.status_code)
        if fin_res.ok:
            summary = fin_res.json().get("summary", {})
            print(f"   Financials: MRR=INR {summary.get('mrr_inr')}, ARR=INR {summary.get('arr_inr')}, Profit=INR {summary.get('deemed_gross_profit_inr')} ({summary.get('profit_margin_pct')}%), Pipeline=INR {summary.get('pipeline_deemed_inr')}")
    except Exception as e:
        print("   ADMIN FINANCIALS Error:", e)

    # Organizations
    try:
        orgs_res = s.get(f"{DOMAIN}/api/admin/organizations", headers=headers, verify=False, timeout=15)
        print("5. ADMIN ORGANIZATIONS Status:", orgs_res.status_code)
        if orgs_res.ok:
            orgs = orgs_res.json().get("organizations", [])
            print(f"   Found {len(orgs)} organizations:")
            for o in orgs:
                print(f"     - {o.get('name')} ({o.get('slug')}) | Plan: {o.get('plan_tier')} | Staff: {o.get('employee_count')}")
    except Exception as e:
        print("   ADMIN ORGANIZATIONS Error:", e)

    # Support Tickets
    try:
        tix_res = s.get(f"{DOMAIN}/api/admin/support/tickets", headers=headers, verify=False, timeout=15)
        print("6. ADMIN SUPPORT CASES Status:", tix_res.status_code)
        if tix_res.ok:
            tix = tix_res.json().get("tickets", [])
            print(f"   Found {len(tix)} engineering support cases:")
            for t in tix:
                print(f"     - #{t.get('ticket_code')}: {t.get('name')} ({t.get('organization')}) - Status: {t.get('status')}")
    except Exception as e:
        print("   ADMIN TICKETS Error:", e)

# 7. Check Frontend HTML title & tags
try:
    html_res = requests.get(DOMAIN, verify=False, timeout=15)
    print("7. FRONTEND Status:", html_res.status_code)
    has_aurapass = "AuraPass" in html_res.text
    print(f"   AuraPass Branding Verified in HTML: {has_aurapass}")
except Exception as e:
    print("7. FRONTEND Error:", e)

# 8. Verify Non-SuperAdmin Lockdown (vatsalvadgama02@gmail.com MUST be blocked from /api/admin/*)
try:
    login2_res = s.post(f"{DOMAIN}/api/auth/login", json={
        "email": "vatsalvadgama02@gmail.com",
        "password": "Admin@12345"
    }, verify=False, timeout=15)
    if login2_res.ok:
        token2 = login2_res.json().get("access_token")
        u2 = login2_res.json().get("user", {})
        print(f"8. NON-SUPERADMIN TEST ({u2.get('email')}, Role: {u2.get('role')}):")
        block_res = s.get(f"{DOMAIN}/api/admin/overview", headers={"Authorization": f"Bearer {token2}"}, verify=False, timeout=15)
        print(f"   Access to /api/admin/overview: Status {block_res.status_code} (Expected: 403 Forbidden)")
        if block_res.status_code == 403:
            print("   CONFIRMED: Non-superadmin is strictly blocked from Admin API with 403 Forbidden!")
        else:
            print("   WARNING: Non-superadmin was NOT blocked! Status:", block_res.status_code)
    else:
        print("8. User vatsalvadgama02 login status:", login2_res.status_code)
except Exception as e:
    print("8. Non-superadmin test error:", e)

print("==================================================")
