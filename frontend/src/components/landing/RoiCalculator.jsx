import React, { useState, useMemo } from 'react';
import {
  Calculator,
  TrendingUp,
  Clock,
  ShieldCheck,
  CreditCard,
  Fingerprint,
  Cloud,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Download,
  Info,
  HelpCircle,
  AlertTriangle,
  Building2,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import Button from '../ui/marketing/Button';
import {
  ATTENDANCE_PRICING_CONFIG,
  GST_RATE
} from '../../config/attendancePricingData';
import {
  calculateAttendanceRoi,
  formatINR,
  formatShortINR
} from '../../utils/roiCalculatorEngine';

export default function RoiCalculator() {
  // ─── 1. Primary User Input States ───
  const [staffCount, setStaffCount] = useState(150);
  const [gateCount, setGateCount] = useState(2);
  const [systemCategory, setSystemCategory] = useState('rfid'); // 'rfid' | 'fingerprint' | 'cloud'
  const [competitorId, setCompetitorId] = useState('ankastra_growth');

  // ─── 2. Financial Modeling Toggles ───
  const [comparisonMode, setComparisonMode] = useState('tco'); // 'tco' (Capex+Opex) | 'cash_opex' (Recurring only)
  const [usefulLifeMonths, setUsefulLifeMonths] = useState(48); // 36 | 48 | 60 months
  const [includeGst, setIncludeGst] = useState(false); // Pre-tax vs 18% GST inclusive
  const [billingHorizon, setBillingHorizon] = useState('annual'); // 'annual' | 'monthly'

  // ─── 3. UI State ───
  const [showMethodology, setShowMethodology] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // ─── 4. Execute Real-Time ROI Calculation Engine ───
  const roi = useMemo(() => {
    return calculateAttendanceRoi({
      staffCount,
      gateCount,
      systemCategory,
      competitorId,
      comparisonMode,
      usefulLifeMonths,
      includeGst,
      proxyAttendanceRate: null, // use default benchmark for category
      avgMonthlySalaryINR: 22000,
      workDaysPerMonth: 22
    });
  }, [staffCount, gateCount, systemCategory, competitorId, comparisonMode, usefulLifeMonths, includeGst]);

  // Active cloud competitor metadata
  const activeCompetitor = useMemo(() => {
    return (
      ATTENDANCE_PRICING_CONFIG.cloud.competitors.find(c => c.id === competitorId) ||
      ATTENDANCE_PRICING_CONFIG.cloud.competitors[0]
    );
  }, [competitorId]);

  // Values based on active horizon (annual vs monthly)
  const displayedLegacyCost = billingHorizon === 'annual' ? roi.legacy.annualCost : roi.legacy.comparedMonthly;
  const displayedAuraCost = billingHorizon === 'annual' ? roi.aurapass.annualCost : roi.aurapass.comparedMonthly;
  const displayedSavings = billingHorizon === 'annual' ? roi.savings.netAnnualSavings : roi.savings.netMonthlySavings;
  const horizonLabel = billingHorizon === 'annual' ? '/ year' : '/ month';
  const alternativeSavingsLabel = billingHorizon === 'annual'
    ? `(~${formatShortINR(roi.savings.netMonthlySavings)} / mo)`
    : `(~${formatShortINR(roi.savings.netAnnualSavings)} / yr)`;

  // Generate downloadable JSON / TXT calculation audit sheet
  const handleDownloadSummary = () => {
    const summaryData = {
      timestamp: new Date().toISOString(),
      reportTitle: 'AuraPass Enterprise — Attendance TCO & ROI Audit Report',
      parameters: {
        staffCount,
        gateCount,
        systemCategory,
        competitorEvaluated: roi.legacy.displayName,
        comparisonMode: comparisonMode === 'tco' ? 'Total Cost of Ownership (Capex Amortized + Opex)' : 'Cash Operating Expense Only',
        usefulLifeMonths: comparisonMode === 'tco' ? `${usefulLifeMonths} Months` : 'N/A',
        taxTreatment: includeGst ? '18% GST Inclusive' : 'Pre-tax (Excluding 18% GST)',
        benchmarkMonthlySalary: '₹22,000 / employee'
      },
      legacySystemCost: {
        displayName: roi.legacy.displayName,
        confidenceLevel: roi.legacy.confidence,
        sourceCitation: roi.legacy.sourceLabel,
        sourceUrl: roi.legacy.sourceUrl,
        initialCapex: roi.legacy.initialCapex,
        monthlyRecurringOpex: roi.legacy.monthlyRecurring,
        monthlyDepreciation: roi.legacy.monthlyDepreciation,
        monthlyTco: roi.legacy.monthlyTco,
        annualCost: roi.legacy.annualCost,
        capexBreakdown: roi.legacy.capexBreakdown,
        opexBreakdown: roi.legacy.opexBreakdown
      },
      aurapassCost: {
        tierAssigned: roi.aurapass.tierName,
        monthlyBaseLicense: roi.aurapass.monthlyBase,
        includedCameras: roi.aurapass.tierName.includes('Enterprise') ? 20 : 5,
        extraGateCharges: roi.aurapass.extraGateMonthly,
        monthlyTco: roi.aurapass.monthlyTco,
        annualCost: roi.aurapass.annualCost
      },
      directSavingsReconciliation: {
        netMonthlySavingsINR: roi.savings.netMonthlySavings,
        netAnnualSavingsINR: roi.savings.netAnnualSavings,
        percentageCostReduction: `${roi.savings.savingsPercentage}%`
      },
      queuingProductivityMetrics: {
        peakWindow: '25 minutes (65% morning peak arrival)',
        legacyMonthlyQueuingHours: roi.queuing.legacyTotalHoursPerMonth,
        aurapassMonthlyQueuingHours: roi.queuing.auraTotalHoursPerMonth,
        queueHoursSavedPerMonth: roi.queuing.queueHoursSaved,
        estimatedProductivityValueINR: roi.queuing.laborProductivityRecoveredINR,
        bottleneckFlag: roi.queuing.hasBottleneck ? 'Peak queue congestion observed' : 'Adequate gate capacity'
      },
      fraudReductionMetrics: {
        baselineProxyAttendanceRate: `${roi.fraudPrevention.baselineProxyRate}%`,
        iso30107LivenessProtectionRate: `${roi.fraudPrevention.estimatedReductionPct}%`,
        monthlyPayrollLeakageRiskINR: roi.fraudPrevention.monthlyProxyLeakageINR,
        monthlyFraudPreventionRecoveredINR: roi.fraudPrevention.monthlyProxyRecoveredINR,
        annualFraudPreventionRecoveredINR: roi.fraudPrevention.annualProxyRecoveredINR
      },
      methodologyDisclosures: [
        'Hardware Capex amortized straight-line over specified horizon with zero salvage value.',
        '18% GST modeled at standard Indian SAC/HSN IT service code rates.',
        'Employee queue waiting time modeled using deterministic peak accumulation with failure retry rates.',
        'Fraud recovery numbers are operational projections and kept separate from direct software license savings.'
      ]
    };

    const blob = new Blob([JSON.stringify(summaryData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AuraPass_ROI_Calculation_${staffCount}Staff_${systemCategory}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <section id="roi" className="py-20 md:py-28 bg-[#0A0A0A] border-b border-[#262626] relative overflow-hidden">
      {/* Background illumination */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-emerald-500/5 blur-[160px] rounded-full pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111111] border border-[#262626] text-[11px] font-mono uppercase tracking-widest text-emerald-400 mb-3.5 shadow-sm">
            <Calculator size={13} className="text-emerald-400" />
            <span>AUDITED INDIAN ATTENDANCE TCO & ROI MODEL</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white font-display text-balance">
            Calculate your exact operational savings.
          </h2>

          <p className="mt-3.5 text-sm sm:text-base text-zinc-400 leading-relaxed text-balance">
            Real Indian market pricing, straight-line Capex depreciation, M/M/c peak queue modeling, and transparent GST compliance. No guessed numbers.
          </p>
        </div>

        {/* Main Interactive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* LEFT COLUMN: Configuration, Hardware & Parameters (7 Cols)     */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-7 bg-[#111111] border border-[#262626] rounded-2xl p-6 sm:p-8 space-y-7 shadow-xl">
            {/* Header Row: Step indicator & Currency */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#202020]">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
                1. Organization Parameters
              </span>

              <div className="flex items-center gap-2">
                {/* Currency Badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#161616] border border-emerald-500/30 text-xs font-mono text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>INR (₹) Standard</span>
                </div>

                {/* GST Tax Toggle Pill */}
                <button
                  type="button"
                  onClick={() => setIncludeGst(!includeGst)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors border cursor-pointer ${
                    includeGst
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-[#181818] text-zinc-400 border-[#2a2a2a] hover:text-zinc-200'
                  }`}
                  title="Toggle 18% Indian GST for IT & Biometric Services"
                >
                  {includeGst ? 'Incl. 18% GST' : 'Excl. GST'}
                </button>
              </div>
            </div>

            {/* Slider 1: Organization Staff Count */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="staff-slider" className="text-sm font-medium text-zinc-200 block">
                    Total Enrolled Employees
                  </label>
                  <span className="text-[11px] text-zinc-500 font-sans">
                    Headcount marking daily clock-in & clock-out
                  </span>
                </div>
                <span className="font-mono text-base font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/30">
                  {staffCount.toLocaleString('en-IN')} Staff
                </span>
              </div>

              <input
                id="staff-slider"
                type="range"
                min="20"
                max="1500"
                step="10"
                value={staffCount}
                onChange={(e) => setStaffCount(Number(e.target.value))}
                className="w-full h-2 bg-[#202020] rounded-lg appearance-none cursor-pointer accent-[#10B981]"
                aria-label="Total Enrolled Employees"
              />

              {/* Quick Preset Buttons */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[25, 100, 250, 500, 1000, 1500].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setStaffCount(preset)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                        staffCount === preset
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                          : 'bg-[#171717] text-zinc-500 border-[#262626] hover:text-zinc-300'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <span className="text-[11px] font-mono text-zinc-500">20 to 1,500</span>
              </div>
            </div>

            {/* Slider 2: Entrance Turnstiles & Kiosk Lanes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="gate-slider" className="text-sm font-medium text-zinc-200 block">
                    Entrance Gates & Turnstiles
                  </label>
                  <span className="text-[11px] text-zinc-500 font-sans">
                    Physical entrance choke points requiring attendance verification
                  </span>
                </div>
                <span className="font-mono text-base font-bold text-white bg-[#1A1A1A] px-3 py-1 rounded-lg border border-[#2E2E2E]">
                  {gateCount} {gateCount === 1 ? 'Gate' : 'Gates'}
                </span>
              </div>

              <input
                id="gate-slider"
                type="range"
                min="1"
                max="12"
                step="1"
                value={gateCount}
                onChange={(e) => setGateCount(Number(e.target.value))}
                className="w-full h-2 bg-[#202020] rounded-lg appearance-none cursor-pointer accent-[#10B981]"
                aria-label="Entrance Gates and Turnstiles"
              />

              {/* Quick Preset Buttons for Gates */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[1, 2, 4, 6, 8, 12].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setGateCount(preset)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                        gateCount === preset
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                          : 'bg-[#171717] text-zinc-500 border-[#262626] hover:text-zinc-300'
                      }`}
                    >
                      {preset} {preset === 1 ? 'Gate' : 'Gates'}
                    </button>
                  ))}
                </div>
                <span className="text-[11px] font-mono text-zinc-500">1 to 12 Gates</span>
              </div>
            </div>

            {/* Selector: Current Attendance System Category */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400 block">
                2. Current Attendance Infrastructure
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    id: 'rfid',
                    name: 'Plastic RFID Badges',
                    sub: 'Cards, Readers & Turnstiles',
                    icon: CreditCard
                  },
                  {
                    id: 'fingerprint',
                    name: 'Fingerprint Terminals',
                    sub: 'Wall Clocks & Sensor AMC',
                    icon: Fingerprint
                  },
                  {
                    id: 'cloud',
                    name: 'Cloud Facial SaaS',
                    sub: 'Per-User Monthly Seats',
                    icon: Cloud
                  }
                ].map((sys) => {
                  const Icon = sys.icon;
                  const isSelected = systemCategory === sys.id;
                  return (
                    <button
                      key={sys.id}
                      type="button"
                      onClick={() => setSystemCategory(sys.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#181818] border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.15)] text-white'
                          : 'bg-[#141414] border-[#262626] text-zinc-400 hover:border-[#383838] hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <Icon size={16} className={isSelected ? 'text-emerald-400' : 'text-zinc-500'} />
                        <span className="text-xs font-semibold">{sys.name}</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 leading-tight">
                        {sys.sub}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Sub-Selector for Cloud Facial Recognition Competitors */}
              {systemCategory === 'cloud' && (
                <div className="p-3.5 rounded-xl bg-[#161616] border border-[#2b2b2b] space-y-2 mt-3">
                  <div className="flex items-center justify-between text-xs text-zinc-300">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Layers size={13} className="text-emerald-400" />
                      Select Cloud Competitor Plan:
                    </span>
                    <a
                      href={activeCompetitor.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-mono text-emerald-400 hover:underline inline-flex items-center gap-1"
                    >
                      <span>{activeCompetitor.sourceLabel}</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {ATTENDANCE_PRICING_CONFIG.cloud.competitors.map((comp) => {
                      const isCompSelected = competitorId === comp.id;
                      return (
                        <button
                          key={comp.id}
                          type="button"
                          onClick={() => setCompetitorId(comp.id)}
                          className={`p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                            isCompSelected
                              ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-semibold'
                              : 'bg-[#191919] border-[#292929] text-zinc-400 hover:text-zinc-200 hover:bg-[#202020]'
                          }`}
                        >
                          <div className="text-[11px] truncate font-medium">{comp.name}</div>
                          <div className="text-[9px] text-zinc-500 truncate">{comp.tierName}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Verified Source Disclosure Box */}
              <div className="p-3 rounded-xl bg-[#141414] border border-[#222222] text-xs text-zinc-400 flex items-start gap-2.5">
                <Info size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="text-zinc-200 font-medium">
                    {roi.legacy.displayName}
                  </div>
                  <div className="text-[11px] text-zinc-500 flex items-center gap-2 flex-wrap">
                    <span>Evidence: <strong className="text-zinc-400">{roi.legacy.confidence}</strong></span>
                    <span>•</span>
                    <a
                      href={roi.legacy.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:underline inline-flex items-center gap-1"
                    >
                      <span>{roi.legacy.sourceLabel}</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Financial Modeling & Depreciation Controls */}
            <div className="space-y-3 pt-2 border-t border-[#202020]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
                  3. Financial Model & Horizon
                </span>

                {/* Horizon Switcher (Annual vs Monthly) */}
                <div className="flex items-center bg-[#181818] rounded-lg p-0.5 border border-[#2b2b2b]">
                  <button
                    type="button"
                    onClick={() => setBillingHorizon('annual')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                      billingHorizon === 'annual'
                        ? 'bg-emerald-500 text-black shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Annual Spend
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingHorizon('monthly')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                      billingHorizon === 'monthly'
                        ? 'bg-emerald-500 text-black shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Monthly Run-Rate
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* TCO vs Opex Toggle */}
                <div className="p-3 rounded-xl bg-[#141414] border border-[#242424] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-200">Accounting Basis:</span>
                    <span className="text-[10px] font-mono text-zinc-400 uppercase">
                      {comparisonMode === 'tco' ? 'TCO (Capex + Opex)' : 'Cash Opex Only'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setComparisonMode('tco')}
                      className={`py-1 px-2 rounded-lg text-[11px] font-medium border text-center transition-colors cursor-pointer ${
                        comparisonMode === 'tco'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-[#181818] text-zinc-400 border-[#2a2a2a] hover:text-zinc-200'
                      }`}
                      title="Includes upfront hardware purchase amortized straight-line"
                    >
                      TCO (Capex+Opex)
                    </button>
                    <button
                      type="button"
                      onClick={() => setComparisonMode('cash_opex')}
                      className={`py-1 px-2 rounded-lg text-[11px] font-medium border text-center transition-colors cursor-pointer ${
                        comparisonMode === 'cash_opex'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-[#181818] text-zinc-400 border-[#2a2a2a] hover:text-zinc-200'
                      }`}
                      title="Only evaluates recurring monthly fees, cards & AMC"
                    >
                      Recurring Opex
                    </button>
                  </div>
                </div>

                {/* Useful Life Amortization Horizon (Active in TCO mode) */}
                <div className={`p-3 rounded-xl bg-[#141414] border border-[#242424] space-y-1.5 ${
                  comparisonMode !== 'tco' ? 'opacity-40 pointer-events-none' : ''
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-200">Hardware Depreciation:</span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {usefulLifeMonths} Months ({usefulLifeMonths / 12} Yrs)
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[36, 48, 60].map((months) => (
                      <button
                        key={months}
                        type="button"
                        onClick={() => setUsefulLifeMonths(months)}
                        className={`py-1 px-2 rounded-lg text-[11px] font-medium border text-center transition-colors cursor-pointer ${
                          usefulLifeMonths === months
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-[#181818] text-zinc-400 border-[#2a2a2a] hover:text-zinc-200'
                        }`}
                      >
                        {months / 12} Yrs
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* RIGHT COLUMN: Real-Time Results & Direct Spend Delta (5 Cols)   */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 bg-[#111111] border border-[#262626] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
            {/* Top Accent Strip */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

            {/* Savings Banner Header */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Sparkles size={13} />
                Audited Net Savings
              </span>
              <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold border ${
                roi.savings.isPositive
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                {roi.savings.isPositive
                  ? `${roi.savings.savingsPercentage}% COST REDUCTION`
                  : `+${formatShortINR(Math.abs(roi.savings.netMonthlySavings))}/mo`}
              </span>
            </div>

            {/* Big Hero Savings Number */}
            <div className="py-2">
              <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white font-mono">
                {formatINR(displayedSavings)}
                <span className="text-base font-sans font-normal text-zinc-400 block sm:inline sm:ml-2">
                  {horizonLabel} saved
                </span>
              </div>
              <div className="text-xs text-emerald-400/90 font-mono mt-1.5 flex items-center gap-1.5">
                <span>{alternativeSavingsLabel}</span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-400 font-sans">Direct software & badge expenditure</span>
              </div>
            </div>

            {/* Side-by-Side Cost Comparison Bar */}
            <div className="p-4 rounded-xl bg-[#161616] border border-[#262626] space-y-3.5">
              <div className="flex items-center justify-between text-xs font-medium text-zinc-300">
                <span>{billingHorizon === 'annual' ? 'Annualized Expenditure' : 'Monthly Run-Rate Spend'}:</span>
                <span className="text-[10px] font-mono text-zinc-500 uppercase">
                  {includeGst ? '18% GST Paid' : 'Pre-Tax'}
                </span>
              </div>

              {/* 1. Legacy System Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline text-xs text-zinc-400">
                  <span className="truncate pr-2 font-medium">
                    {roi.legacy.displayName}
                  </span>
                  <span className="font-mono font-semibold text-rose-400 shrink-0">
                    {formatINR(displayedLegacyCost)}
                    <span className="text-[10px] text-zinc-500 font-sans">{horizonLabel}</span>
                  </span>
                </div>
                <div className="h-2.5 w-full bg-[#262626] rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500/80 rounded-full w-full" />
                </div>
              </div>

              {/* 2. AuraPass On-Premise Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-emerald-400 font-semibold truncate pr-2">
                    AuraPass On-Premise ({roi.aurapass.tierName})
                  </span>
                  <span className="font-mono font-semibold text-emerald-400 shrink-0">
                    {displayedAuraCost === 0
                      ? '₹0 (Free Starter)'
                      : `${formatINR(displayedAuraCost)}${horizonLabel}`}
                  </span>
                </div>
                <div className="h-2.5 w-full bg-[#262626] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.max(
                        3,
                        Math.min(100, (displayedAuraCost / Math.max(1, displayedLegacyCost)) * 100)
                      )}%`
                    }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 pt-0.5">
                  <span>Included cameras: {staffCount <= 50 ? '3' : staffCount <= 250 ? '8' : '25'}</span>
                  <span>{staffCount <= 50 ? 'Max 600 punches/day' : staffCount <= 250 ? 'Max 3,000 punches/day' : 'Max 15,000 punches/day'}</span>
                </div>
              </div>
            </div>

            {/* Micro-Metrics: Operational Value Additions (Separated from Cash) */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Metric 1: Queue Hours Recovered */}
              <div className="p-3.5 rounded-xl bg-[#141414] border border-[#242424] space-y-1">
                <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                  <Clock size={13} className="text-emerald-400 shrink-0" />
                  <span className="truncate">Morning Queues</span>
                </div>
                <div className="text-xl font-bold font-mono text-white">
                  {roi.queuing.queueHoursSaved} hrs
                  <span className="text-[10px] text-zinc-500 font-sans block">saved / month</span>
                </div>
                <div className="text-[10px] text-emerald-400/80 font-mono leading-tight pt-0.5">
                  ~{formatShortINR(roi.queuing.laborProductivityRecoveredINR)} labor value
                </div>
              </div>

              {/* Metric 2: Fraud & Proxy Reduction */}
              <div className="p-3.5 rounded-xl bg-[#141414] border border-[#242424] space-y-1">
                <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                  <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
                  <span className="truncate">Proxy Reduction</span>
                </div>
                <div className="text-xl font-bold font-mono text-emerald-400">
                  {roi.fraudPrevention.estimatedReductionPct}%
                  <span className="text-[10px] text-zinc-500 font-sans block">ISO 30107 liveness</span>
                </div>
                <div className="text-[10px] text-zinc-400 font-mono leading-tight pt-0.5">
                  ~{formatShortINR(roi.fraudPrevention.monthlyProxyRecoveredINR)}/mo leakage saved
                </div>
              </div>
            </div>

            {/* Expandable Methodology & Evidence Accordion */}
            <div className="border border-[#262626] rounded-xl overflow-hidden bg-[#131313]">
              <button
                type="button"
                onClick={() => setShowMethodology(!showMethodology)}
                className="w-full px-4 py-2.5 flex items-center justify-between text-left text-xs font-medium text-zinc-300 hover:bg-[#181818] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <FileSpreadsheet size={13} className="text-emerald-400" />
                  View Capex, Opex & Citation Breakdown
                </span>
                {showMethodology ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showMethodology && (
                <div className="p-4 pt-2 border-t border-[#222222] space-y-3.5 text-xs text-zinc-400 bg-[#0d0d0d]">
                  {/* Capex Breakdown */}
                  {Object.keys(roi.legacy.capexBreakdown).length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-mono font-semibold uppercase text-zinc-300">
                        Initial Capital Expenditure (Capex):
                      </div>
                      <div className="space-y-1">
                        {Object.entries(roi.legacy.capexBreakdown).map(([key, val]) => (
                          <div key={key} className="flex justify-between text-[11px]">
                            <span className="text-zinc-400">{key}</span>
                            <span className="font-mono text-zinc-200">{formatINR(val)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-[11px] pt-1 border-t border-[#222] font-semibold">
                          <span className="text-zinc-300">Total Upfront Investment</span>
                          <span className="font-mono text-rose-400">{formatINR(roi.legacy.initialCapex)}</span>
                        </div>
                        {comparisonMode === 'tco' && (
                          <div className="text-[10px] text-zinc-500 italic">
                            Amortized at {formatINR(roi.legacy.monthlyDepreciation)}/mo over {usefulLifeMonths} months.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Opex Breakdown */}
                  {Object.keys(roi.legacy.opexBreakdown).length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-[#202020]">
                      <div className="text-[11px] font-mono font-semibold uppercase text-zinc-300">
                        Operating Expenditure (Monthly Opex):
                      </div>
                      <div className="space-y-1">
                        {Object.entries(roi.legacy.opexBreakdown).map(([key, val]) => (
                          <div key={key} className="flex justify-between text-[11px]">
                            <span className="text-zinc-400">{key}</span>
                            <span className="font-mono text-zinc-200">{formatINR(val)}/mo</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AuraPass Tier Breakdown */}
                  <div className="space-y-1.5 pt-2 border-t border-[#202020]">
                    <div className="text-[11px] font-mono font-semibold uppercase text-emerald-400">
                      AuraPass Commercial Plan:
                    </div>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span>Commercial Tier:</span>
                        <span className="font-mono text-emerald-400 font-semibold">{roi.aurapass.tierName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Base Platform License:</span>
                        <span className="font-mono text-zinc-200">
                          {roi.aurapass.monthlyBase === 0 ? '₹0 / mo (Free)' : `${formatINR(roi.aurapass.monthlyBase)}/mo`}
                        </span>
                      </div>
                      {roi.aurapass.extraGateMonthly > 0 && (
                        <div className="flex justify-between">
                          <span>Additional Gate Add-ons:</span>
                          <span className="font-mono text-zinc-200">{formatINR(roi.aurapass.extraGateMonthly)}/mo</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Formal Mathematical Disclosures */}
                  <div className="p-2.5 rounded-lg bg-[#141414] border border-[#202020] text-[10px] text-zinc-400 space-y-1 leading-relaxed">
                    <div className="font-semibold text-zinc-300">Calculation Transparency:</div>
                    <div>• Straight-line depreciation = Capex ÷ {usefulLifeMonths} months.</div>
                    <div>• 18% GST modeled in conformity with Indian IT/SaaS SAC code guidelines.</div>
                    <div>• Morning peak queue calculated using deterministic queue accumulation (65% in 25 min window).</div>
                    <div>• Proxy fraud recovery is an operational estimate and strictly separated from software fee savings.</div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons & Secondary Audit Export */}
            <div className="space-y-2.5 pt-1">
              <Button
                variant="primary"
                size="md"
                to="/register"
                iconRight={ArrowRight}
                className="w-full justify-center shadow-lg"
              >
                Start 7-Day Free Trial
              </Button>

              <button
                type="button"
                onClick={handleDownloadSummary}
                className="w-full py-2 px-3 rounded-xl border border-[#2b2b2b] bg-[#141414] hover:bg-[#1a1a1a] text-zinc-300 hover:text-white text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                title="Download full calculation sheet with sources, formulas, and Capex/Opex breakdown"
              >
                {downloadSuccess ? (
                  <>
                    <CheckCircle2 size={13} className="text-emerald-400" />
                    <span className="text-emerald-400 font-mono">Calculation Summary Downloaded!</span>
                  </>
                ) : (
                  <>
                    <Download size={13} className="text-zinc-400" />
                    <span>Download Calculation Summary (JSON)</span>
                  </>
                )}
              </button>

              <div className="text-center text-[11px] text-zinc-500 pt-1">
                Zero credit card required • Deploy on your laptop or CCTV in 5 minutes
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
