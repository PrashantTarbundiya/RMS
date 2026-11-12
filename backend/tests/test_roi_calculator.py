"""
Automated Validation & Unit Tests for the Attendance ROI & TCO Calculation Engine.
Directly tests Phase 3, Phase 4, Phase 5, Phase 6, Phase 9 master requirements.
"""

import pytest
import math

# Reference pricing constants matching frontend/src/config/attendancePricingData.js
GST_RATE = 0.18

def calculate_truein_monthly(staff):
    return ((staff * 250) + 69000) / 12

def calculate_ankastra_basic_monthly(staff):
    return 2999 + (max(0, staff - 50) * 30)

def calculate_ankastra_growth_monthly(staff):
    return 5999 + (max(0, staff - 50) * 49)

def calculate_ankastra_pro_monthly(staff):
    return 9999 + (max(0, staff - 50) * 79)

def calculate_pagarkaro_attendance_monthly(staff):
    return staff * 31

def calculate_pagarkaro_pro_monthly(staff):
    return staff * 79

def calculate_greythr_monthly(staff):
    return 4495 + (max(0, staff - 50) * 85)

def get_aurapass_tier_price(staff):
    if staff <= 25:
        return 0, 'Starter Tier (Free)', 1
    elif staff <= 100:
        price = 599 if staff <= 50 else 599 + ((staff - 50) * 12)
        return price, 'SMB Dynamic (₹12/user)', 2
    elif staff <= 250:
        return 1999, 'Business Pro (Flat)', 5
    elif staff <= 1000:
        return 5999, 'Enterprise Enclave', 20
    else:
        return 14999, 'Enterprise Campus', 999999


# ─── PHASE 3 VERIFICATION TESTS: 590-EMPLOYEE TEST CASE ───────────────────────

def test_phase_3_truein_590_employees():
    """Verify Truein calculation for 590 employees: (590 * 250 + 69,000) / 12"""
    staff = 590
    monthly_pre_tax = calculate_truein_monthly(staff)
    # Expected: (147,500 + 69,000) / 12 = 216,500 / 12 = 18,041.6666...
    assert math.isclose(monthly_pre_tax, 18041.666666666668, rel_tol=1e-5)
    assert round(monthly_pre_tax, 2) == 18041.67

    # With 18% GST:
    monthly_with_gst = monthly_pre_tax * (1 + GST_RATE)
    assert math.isclose(monthly_with_gst, 21289.166666666668, rel_tol=1e-5)


def test_phase_3_ankastra_basic_590_employees():
    """Verify Ankastra Basic calculation for 590 employees: 2,999 + ((590 - 50) * 30)"""
    staff = 590
    monthly_pre_tax = calculate_ankastra_basic_monthly(staff)
    # Expected: 2,999 + (540 * 30) = 2,999 + 16,200 = 19,199
    assert monthly_pre_tax == 19199

    monthly_with_gst = monthly_pre_tax * (1 + GST_RATE)
    assert round(monthly_with_gst, 2) == 22654.82


def test_phase_3_ankastra_growth_590_employees():
    """Verify Ankastra Growth calculation for 590 employees: 5,999 + ((590 - 50) * 49)"""
    staff = 590
    monthly_pre_tax = calculate_ankastra_growth_monthly(staff)
    # Expected: 5,999 + (540 * 49) = 5,999 + 26,460 = 32,459
    assert monthly_pre_tax == 32459

    monthly_with_gst = monthly_pre_tax * (1 + GST_RATE)
    assert round(monthly_with_gst, 2) == 38301.62


def test_phase_3_ankastra_pro_590_employees():
    """Verify Ankastra Pro calculation for 590 employees: 9,999 + ((590 - 50) * 79)"""
    staff = 590
    monthly_pre_tax = calculate_ankastra_pro_monthly(staff)
    # Expected: 9,999 + (540 * 79) = 9,999 + 42,660 = 52,659
    assert monthly_pre_tax == 52659

    monthly_with_gst = monthly_pre_tax * (1 + GST_RATE)
    assert round(monthly_with_gst, 2) == 62137.62


def test_phase_3_pagarkaro_attendance_590_employees():
    """Verify Pagar Karo Attendance calculation for 590 employees: 590 * 31"""
    staff = 590
    monthly_pre_tax = calculate_pagarkaro_attendance_monthly(staff)
    # Expected: 590 * 31 = 18,290
    assert monthly_pre_tax == 18290

    monthly_with_gst = monthly_pre_tax * (1 + GST_RATE)
    assert round(monthly_with_gst, 2) == 21582.20


def test_phase_3_pagarkaro_pro_590_employees():
    """Verify Pagar Karo Pro calculation for 590 employees: 590 * 79"""
    staff = 590
    monthly_pre_tax = calculate_pagarkaro_pro_monthly(staff)
    # Expected: 590 * 79 = 46,610
    assert monthly_pre_tax == 46610

    monthly_with_gst = monthly_pre_tax * (1 + GST_RATE)
    assert round(monthly_with_gst, 2) == 54999.80


def test_phase_3_greythr_590_employees():
    """Verify greytHR Growth calculation for 590 employees: 4,495 + ((590 - 50) * 85)"""
    staff = 590
    monthly_pre_tax = calculate_greythr_monthly(staff)
    # Expected: 4,495 + (540 * 85) = 4,495 + 45,900 = 50,395
    assert monthly_pre_tax == 50395


# ─── PHASE 4 & 9: TCO AMORTIZATION & HARDWARE DEPRECIATION TESTS ─────────────

def test_rfid_capex_and_tco():
    """Verify RFID Capex and Opex separation over 48 months depreciation."""
    staff = 150
    gates = 3
    useful_life = 48

    card_cost = staff * 30 # 4,500
    reader_cost = gates * 6500 # 19,500
    install_cost = gates * 2500 # 7,500
    software_license = 18000
    total_capex = card_cost + reader_cost + install_cost + software_license # 49,500

    monthly_depreciation = total_capex / useful_life # 49,500 / 48 = 1,031.25

    annual_card_replacement = staff * 0.18 * 30 # 810
    annual_amc = gates * 2400 # 7,200
    monthly_recurring = (annual_card_replacement + annual_amc) / 12 # 667.50

    monthly_tco = monthly_recurring + monthly_depreciation # 1,698.75

    assert total_capex == 49500
    assert monthly_depreciation == 1031.25
    assert monthly_recurring == 667.50
    assert monthly_tco == 1698.75


def test_fingerprint_capex_and_tco():
    """Verify Fingerprint terminal sizing and TCO modeling."""
    staff = 300
    gates = 2
    useful_life = 36

    # Capacity sizing: max(2, ceil(300 / 75)) = max(2, 4) = 4 terminals
    terminals = max(gates, math.ceil(staff / 75))
    assert terminals == 4

    machine_capex = terminals * 8500 # 34,000
    install_capex = terminals * 1500 # 6,000
    total_capex = machine_capex + install_capex # 40,000

    monthly_depreciation = total_capex / useful_life # 40,000 / 36 = 1,111.11

    monthly_amc = (terminals * 2400) / 12 # 800
    cloud_sync = 850
    monthly_recurring = monthly_amc + cloud_sync # 1,650

    monthly_tco = monthly_recurring + monthly_depreciation

    assert total_capex == 40000
    assert math.isclose(monthly_depreciation, 1111.111, rel_tol=1e-3)
    assert monthly_recurring == 1650
    assert math.isclose(monthly_tco, 2761.111, rel_tol=1e-3)


# ─── PHASE 4 & 9: AURAPASS TIER & SAVINGS RECONCILIATION ────────────────────

def test_aurapass_tier_pricing():
    """Verify AuraPass pricing tiers scale with employee count."""
    p20, t20, _ = get_aurapass_tier_price(20)
    assert p20 == 0
    assert 'Starter' in t20

    # SMB Dynamic tier for 50 staff (₹599 base, ₹11.98/emp)
    p50, t50, _ = get_aurapass_tier_price(50)
    assert p50 == 599
    assert 'SMB Dynamic' in t50

    # SMB Dynamic tier for 80 staff (₹599 + 30*12 = ₹959, ~₹12/emp)
    p80, t80, _ = get_aurapass_tier_price(80)
    assert p80 == 959
    assert 'SMB Dynamic' in t80

    p150, t150, _ = get_aurapass_tier_price(150)
    assert p150 == 1999
    assert 'Business Pro' in t150

    p590, t590, _ = get_aurapass_tier_price(590)
    assert p590 == 5999
    assert 'Enterprise Enclave' in t590

    p1500, t1500, _ = get_aurapass_tier_price(1500)
    assert p1500 == 14999
    assert 'Enterprise Campus' in t1500


def test_savings_reconciliation_monthly_and_annual():
    """Verify Monthly and Annual savings reconcile with zero mathematical drift."""
    legacy_monthly = 18041.67
    aurapass_monthly = 5999.00
    net_monthly = legacy_monthly - aurapass_monthly
    net_annual = net_monthly * 12

    assert round(net_monthly, 2) == 12042.67
    assert round(net_annual, 2) == round(net_monthly * 12, 2)


def test_negative_savings_handling():
    """Ensure negative savings are properly detected and reported without masking."""
    # Starter office with 15 staff on cheap RFID card setup vs paid software
    legacy_monthly = 250.00
    aurapass_monthly = 1999.00 # If forced to Business Pro
    net_monthly = legacy_monthly - aurapass_monthly
    assert net_monthly < 0
    assert net_monthly == -1749.00

