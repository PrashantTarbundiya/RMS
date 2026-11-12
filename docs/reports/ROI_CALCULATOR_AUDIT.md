# AuraPass™ Enterprise — Comprehensive ROI Calculator Audit Report
**Document ID**: `ROI_CALCULATOR_AUDIT.md`  
**Date**: November 12, 2026  
**Author**: Senior Financial Modelling Engineer & SaaS Pricing Research Analyst  
**Scope**: Complete audit of `frontend/src/components/landing/RoiCalculator.jsx` and related pricing models

---

## 1. Executive Summary

The existing attendance ROI calculator in `frontend/src/components/landing/RoiCalculator.jsx` provides an interactive slider for prospective clients to evaluate estimated savings when switching from legacy systems (Plastic RFID badges, Fingerprint machines, or Cloud Facial Recognition SaaS) to AuraPass On-Premise.

While the visual aesthetic matches the dark-mode theme, a rigorous financial and algorithmic audit reveals **severe modeling inaccuracies, hardcoded assumptions, unsupported claims, and misleading cost structures**. Most notably:
1. **Capex / Opex Conflation**: One-time hardware expenses (RFID cards, biometric clocks, turnstiles) were improperly converted into artificial ongoing monthly subscription fees without an amortization schedule or depreciation life.
2. **Unsupported "100% Buddy-Punch Elimination"**: The calculator claimed "0.0% Buddy Punch Rate (100% eliminated)" with zero empirical backing, violating anti-spoofing presentation attack realities.
3. **Arbitrary Queue Calculations**: Queue-hour savings did not model peak-hour queuing dynamics, arrival distribution, or physical lane throughput, leading to inflated time-savings figures.
4. **Distorted AuraPass Commercial Pricing**: The calculator claimed AuraPass costs `₹1,999/mo flat` regardless of whether the company has 250 or 1,500 employees, directly contradicting the commercial pricing tiers published on the landing page (Starter: ₹0 for $\le 25$ staff; Business Pro: ₹1,999 for $\le 250$ staff; Enterprise: Custom for $>250$ staff).
5. **No GST Recognition**: All pricing in Indian B2B transactions attracts 18% Goods & Services Tax (GST). The calculator neither accounted for GST nor disclosed tax treatment.
6. **Lumping Payroll Leakage as "Net Direct Savings"**: The calculator added theoretical buddy-punch recovery directly into the headline "Net Monthly Savings", leading to unrealistic headline figures like "₹56.1 Lakhs/year saved" on an operational budget of only a few thousand rupees.

---

## 2. Line-by-Line Code Audit of `RoiCalculator.jsx`

| Line(s) | Code Element | Stated Value | Audit Finding & Flaw |
| :--- | :--- | :--- | :--- |
| **28** | `monthlyMaintenancePerStaff: 18` (RFID) | ₹18/month per employee | **Hardcoded Guess**. Claims `~₹200/yr for cards, ribbons, lanyards`. An RFID card costs ₹10 to ₹30 once. Annual replacement is 15-20% ($\approx ₹5-6/\text{year}$). Charging ₹18/month (₹216/year) every year for a plastic card that lasts 3-5 years is a 36x overcharge on maintenance. |
| **29** | `monthlyMaintenancePerGate: 1200` (RFID) | ₹1,200/month per gate | **Unsubstantiated Opex**. Represents ₹14,400/year per gate for reader AMC. Real AMC for standard RFID readers is ₹2,000–₹4,000/year. |
| **31** | `proxyLossRate: 0.007` (RFID) | 0.7% payroll leakage | **Assumed without evidence**. Assumes every firm loses 0.7% of gross payroll to coworker card swapping. |
| **37** | `monthlyMaintenancePerStaff: 28` (Fingerprint) | ₹28/month per employee | **Unsupported HR Labor Claim**. Labeled as "HR time fixing failed/missed thumb scans". For 500 staff, this assumes ₹14,000/month (nearly an entire junior HR salary) is spent purely re-logging thumbs. |
| **38** | `monthlyMaintenancePerGate: 2200` (Fingerprint) | ₹2,200/month per gate | **Inflated AMC**. Represents ₹26,400/year per terminal AMC. Standard standalone enterprise biometric clocks (eSSL, Realtime) cost ₹7,000 to purchase outright. An AMC of ₹26,400/yr exceeds the purchase price of 3 brand-new machines. |
| **46** | `monthlyMaintenancePerStaff: 45` (Cloud SaaS) | ₹45/user/month | **Flat Blanket Assumption**. Real Indian cloud attendance SaaS charges differ vastly: Truein charges ₹250/yr (₹20.83/mo) + ₹69k base; Ankastra charges ₹30 to ₹79/extra user; Pagar Karo charges ₹31/mo; greytHR charges ₹85/extra user. |
| **47** | `monthlyMaintenancePerGate: 1000` (Cloud SaaS) | ₹1,000/month per gate | **Ambiguous Hardware Cost**. Labeled as "tablet hardware & internet connection per gate". A tablet is a one-time capital purchase (₹8,000–₹12,000), not an endless ₹12,000/year subscription. |
| **60-66** | `queueHoursSaved` | Math formula using $6.5\text{s}$ vs $0.3\text{s}$ | **Deficient Queuing Model**. Multiplies total staff by $6.5\text{s}$ check-in duration. Completely ignores the number of gates/lanes! Whether an office has 1 gate or 10 gates, the queue duration calculated was identical. |
| **69-71** | `monthlyProxyRecoveredINR` | `staff * 22000 * proxyLossRate` | **Theoretical Value Conflated as Cash Savings**. Multiplies assumed ₹22,000 benchmark salary by proxy rate and adds it directly into "Estimated Net Savings". |
| **80** | `aurapassMonthlyINR` | `staffCount <= 25 ? 0 : 1999` | **Pricing Tier Violation**. Assumes AuraPass is ₹1,999 flat for 1,500 staff, whereas Business Pro is limited to 250 staff, and enterprise deployments require custom or higher tier licensing. |
| **86-87** | `netAnnualSavingsINR` | `netMonthlySavingsINR * 12` | **Distorted Metric Display**. Displays ₹56.1 Lakhs/year for 510 staff when actual software/hardware cash savings are under ₹1.5 Lakhs/year. |
| **333-334** | `Buddy Punch Rate: 0.0%` | "100% eliminated" | **Scientifically False & Legally Dangerous**. No biometric system can guarantee 0.0% fraud. Biometrics operate on probabilistic matching thresholds (FAR/FRR) and presentation attack detection (PAD) standards (ISO 30107-3). |

---

## 3. Specific Flaws Evaluated Against Master Requirements

### Flaw 1: Hardcoded Competitor Prices Without Sources
Competitor prices were not mapped to any real vendor, product tier, or catalog. They were arbitrary numbers chosen to make AuraPass's ₹1,999 fee look like a 95% reduction.

### Flaw 2: Conflation of Initial Hardware (Capex) and Recurring Software (Opex)
In traditional RFID and Fingerprint setups, the majority of expense is incurred up-front in Year 1:
- Buying readers: ₹5,000 to ₹35,000 each.
- Issuing cards: ₹10 to ₹30 each.
- Turnstiles / Cabling: ₹15,000 to ₹1,50,000.
By converting these capital investments into indefinite monthly operating fees without an amortization horizon (e.g. 36 or 48 months), the calculator heavily penalized legacy hardware over multi-year windows.

### Flaw 3: Inaccurate Queue Modeling
In physical queuing theory (Erlang-C / $M/M/c$ queue), queue length depends on the **arrival rate ($\lambda$) versus service rate ($\mu \cdot c$)**:
- If 500 employees arrive uniformly over 60 minutes at 3 gates, arrival rate is $8.33\text{ people/min}$. With an RFID scan time of 4 seconds ($15\text{ people/min/gate}$ or $45\text{ people/min}$ across 3 gates), the system is under-saturated and virtually no queue forms!
- Queues only build during peak arrival windows (e.g., 8:45 AM - 9:00 AM when 70% of staff arrive).
- The old formula simply computed $\text{Staff} \times \Delta t$, meaning it calculated *total transaction duration* rather than actual waiting delay.

### Flaw 4: Missing 18% GST Compliance
In India, SaaS software, AMC services, and biometric hardware are taxable at an 18% GST rate (SAC 997331 / HSN 8471). B2B buyers require either GST-exclusive quotes or clear input tax credit (ITC) disclosure.

### Flaw 5: AuraPass Pricing Inconsistency
On the landing page:
- **Starter**: ₹0 for up to 25 staff.
- **Business Pro**: ₹1,999/month for up to 250 staff, 8 cameras.
- **Enterprise**: Custom for $>250$ staff.
The calculator let the user drag the slider to 1,500 staff while keeping AuraPass at ₹1,999/month flat. For 1,500 staff, AuraPass requires an Enterprise license (modeled at ₹5,999–₹14,999/mo or dedicated node licensing).

---

## 4. Remediation Directives

1. **Centralize Pricing Data**: Build `frontend/src/config/attendancePricingData.js` with verifiable Indian vendor citations, plan tiers, and URLs.
2. **Dual Financial Modes**:
   - **Cash Recurring Opex**: Recurring software, AMC, and replacement cards only.
   - **Total Cost of Ownership (TCO)**: Recurring Opex + Amortized Hardware Capex over 36, 48, or 60 months.
3. **Queue Theory Grounding**: Implement peak arrival distribution ($\approx 65\%$ staff in 20-minute window) and terminal capacity modeling.
4. **Transparent Fraud Model**: Replace "100% eliminated" with configurable baseline proxy rates and conservative 75%–90% biometric risk reduction.
5. **Audited AuraPass Tier Scaling**: Scale AuraPass according to published tiers (Starter ₹0 $\le 25$; Business Pro ₹1,999 $\le 250$; Enterprise Enclave tiered $\ge 250$).

---
*Audit completed and approved for implementation.*

