import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
  Sparkles
} from 'lucide-react';
import Button from '../ui/marketing/Button';

export default function RoiCalculator() {
  const [staffCount, setStaffCount] = useState(150);
  const [gateCount, setGateCount] = useState(3);
  const [systemType, setSystemType] = useState('rfid'); // 'rfid' | 'fingerprint' | 'cloud'

  // Realistic system cost parameters grounded in Indian enterprise operations
  const SYSTEM_CONFIGS = {
    rfid: {
      name: 'Plastic RFID Badges',
      icon: CreditCard,
      description: 'Card printing, replacements (lost/broken cards), turnstile readers & proxy card swiping.',
      monthlyMaintenancePerStaff: 18,   // ₹18/month per employee (~₹200/yr for cards, ribbons, lanyards)
      monthlyMaintenancePerGate: 1200,  // ₹1,200/month reader/turnstile maintenance & AMC
      queueSecPerCheckin: 6.5,          // Card tap, wallet fumbling, forgotten card delays
      proxyLossRate: 0.007              // 0.7% payroll leakage from coworkers swiping for each other
    },
    fingerprint: {
      name: 'Fingerprint Machines',
      icon: Fingerprint,
      description: 'Sensor smudges, rough/dry finger retries, hardware AMC & manual HR log correction hours.',
      monthlyMaintenancePerStaff: 28,   // ₹28/month per employee in HR time fixing failed/missed thumb scans
      monthlyMaintenancePerGate: 2200,  // ₹2,200/month biometric clock AMC, repairs & network line
      queueSecPerCheckin: 9.0,          // Finger placement, retry on dirty/dry fingers
      proxyLossRate: 0.002              // Rare proxy, but frequent clock-in failures and queue delays
    },
    cloud: {
      name: 'Cloud Facial SaaS',
      icon: Cloud,
      description: 'Monthly per-employee software subscription fees, internet line dependency & recurring bills.',
      monthlyMaintenancePerStaff: 45,   // Standard Indian cloud attendance fee (₹45/user/month)
      monthlyMaintenancePerGate: 1000,  // Tablet hardware & internet connection per gate
      queueSecPerCheckin: 2.5,          // Cloud latency and network delays
      proxyLossRate: 0.001              // Minimal proxy, but high per-seat recurring fees
    }
  };

  const currentSys = SYSTEM_CONFIGS[systemType];

  // Mathematical modeling in realistic Indian business context
  const workDaysPerMonth = 22;
  const avgMonthlySalaryINR = 22000; // Benchmark Indian monthly staff salary

  // 1. Time lost in queue vs AuraPass (<0.3s)
  const legacyQueueHoursPerMonth = Math.round(
    (staffCount * currentSys.queueSecPerCheckin * 2 * workDaysPerMonth) / 3600
  );
  const aurapassQueueHoursPerMonth = Math.round(
    (staffCount * 0.3 * 2 * workDaysPerMonth) / 3600
  );
  const queueHoursSaved = Math.max(1, legacyQueueHoursPerMonth - aurapassQueueHoursPerMonth);

  // 2. Buddy punching / proxy attendance leakage recovered in ₹
  const monthlyProxyRecoveredINR = Math.round(
    staffCount * avgMonthlySalaryINR * currentSys.proxyLossRate
  );

  // 3. Realistic direct operational cost of current system in ₹
  const legacyMonthlyOperatingINR = Math.round(
    staffCount * currentSys.monthlyMaintenancePerStaff +
    gateCount * currentSys.monthlyMaintenancePerGate
  );

  // 4. AuraPass On-Premise Cost in ₹ (Flat software license: ₹0 for <=25 staff; ₹1,999/mo flat unlimited)
  const aurapassMonthlyINR = staffCount <= 25 ? 0 : 1999;

  // 5. Direct system cost saved (excluding payroll recovery)
  const directMonthlySavingsINR = Math.max(0, legacyMonthlyOperatingINR - aurapassMonthlyINR);

  // 6. Total Net Monthly Benefit (Direct savings + proxy attendance recovered)
  const netMonthlySavingsINR = directMonthlySavingsINR + monthlyProxyRecoveredINR;
  const netAnnualSavingsINR = netMonthlySavingsINR * 12;

  // Percentage cost cut on pure software & badge spend
  const percentageSaved = Math.min(95, Math.max(10, Math.round(
    ((legacyMonthlyOperatingINR - aurapassMonthlyINR) / Math.max(1, legacyMonthlyOperatingINR)) * 100
  )));

  // Format currency helpers strictly in Indian Rupees (₹)
  const formatINR = (val) => {
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(1)} Lakhs`;
    }
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const formatShortINR = (val) => {
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(1)}L`;
    }
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <section id="roi" className="py-20 md:py-28 bg-[#0A0A0A] border-b border-[#262626] relative overflow-hidden">
      {/* Background illumination */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-emerald-500/5 blur-[140px] rounded-full pointer-events-none"
        aria-hidden="true" 
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111111] border border-[#262626] text-[11px] font-mono uppercase tracking-widest text-emerald-400 mb-3 shadow-sm">
            <Calculator size={13} className="text-emerald-400" />
            <span>OPERATIONAL ROI CALCULATOR (INR)</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white font-display text-balance">
            Calculate your monthly operational savings.
          </h2>

          <p className="mt-3.5 text-sm sm:text-base text-zinc-400 leading-relaxed text-balance">
            Compare flat on-premise facial verification against badge printing, fingerprint clock maintenance, and per-user cloud SaaS fees.
          </p>
        </div>

        {/* Main Interactive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Interactive Sliders & Configuration (7 cols) */}
          <div className="lg:col-span-7 bg-[#111111] border border-[#262626] rounded-2xl p-6 sm:p-8 space-y-7 shadow-xl">
            {/* Header Row */}
            <div className="flex items-center justify-between pb-4 border-b border-[#202020]">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
                1. System Parameters
              </span>

              {/* Currency Tag */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#171717] border border-emerald-500/30 text-xs font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>₹ INR (Indian Rupees)</span>
              </div>
            </div>

            {/* Slider 1: Staff Count */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-200">
                  Total Organization Staff
                </label>
                <span className="font-mono text-base font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/30">
                  {staffCount.toLocaleString('en-IN')} Employees
                </span>
              </div>

              <input
                type="range"
                min="20"
                max="1500"
                step="10"
                value={staffCount}
                onChange={(e) => setStaffCount(Number(e.target.value))}
                className="w-full h-2 bg-[#202020] rounded-lg appearance-none cursor-pointer accent-[#10B981]"
              />

              <div className="flex justify-between items-center text-[11px] font-mono text-zinc-500">
                <span>20 (Starter)</span>
                <span>250</span>
                <span>500</span>
                <span>1,500+ Staff</span>
              </div>
            </div>

            {/* Slider 2: Entrance Gates */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-200">
                  Entrance Turnstiles & Kiosk Lanes
                </label>
                <span className="font-mono text-base font-bold text-white bg-[#1A1A1A] px-2.5 py-0.5 rounded border border-[#2E2E2E]">
                  {gateCount} {gateCount === 1 ? 'Lane' : 'Lanes'}
                </span>
              </div>

              <input
                type="range"
                min="1"
                max="12"
                step="1"
                value={gateCount}
                onChange={(e) => setGateCount(Number(e.target.value))}
                className="w-full h-2 bg-[#202020] rounded-lg appearance-none cursor-pointer accent-[#10B981]"
              />

              <div className="flex justify-between items-center text-[11px] font-mono text-zinc-500">
                <span>1 Lane</span>
                <span>4 Lanes</span>
                <span>8 Lanes</span>
                <span>12 Lanes</span>
              </div>
            </div>

            {/* Selector: Current System Type */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400 block">
                2. Current Attendance Infrastructure
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {Object.entries(SYSTEM_CONFIGS).map(([key, sys]) => {
                  const Icon = sys.icon;
                  const isSelected = systemType === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSystemType(key)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#181818] border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.15)] text-white'
                          : 'bg-[#141414] border-[#262626] text-zinc-400 hover:border-[#383838] hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon size={14} className={isSelected ? 'text-emerald-400' : 'text-zinc-500'} />
                        <span className="text-xs font-semibold">{sys.name}</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-tight">
                        {key === 'rfid' ? 'Badges & Readers' : key === 'fingerprint' ? 'Hardware Clocks' : 'Cloud Per-Seat'}
                      </p>
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-zinc-400 pt-1">
                <span className="text-zinc-500">Modeled impact:</span> {currentSys.description}
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: Real-Time Results & Cost Comparison (5 cols) */}
          <div className="lg:col-span-5 bg-[#111111] border border-[#262626] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
            {/* Top Accent Strip */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Sparkles size={13} />
                Estimated Net Savings
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                {percentageSaved}% REDUCTION
              </span>
            </div>

            {/* Big Hero Savings Number */}
            <div className="py-2">
              <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white font-mono">
                {formatINR(netAnnualSavingsINR)}
                <span className="text-base font-sans font-normal text-zinc-400 block sm:inline sm:ml-2">
                  / year saved
                </span>
              </div>
              <div className="text-xs text-emerald-400/90 font-mono mt-1">
                (~{formatShortINR(netMonthlySavingsINR)} / month recovered)
              </div>
            </div>

            {/* Side-by-Side Cost Comparison Bar */}
            <div className="p-4 rounded-xl bg-[#161616] border border-[#262626] space-y-3">
              <div className="text-xs font-medium text-zinc-300">
                Monthly System Spend Comparison:
              </div>

              {/* Current Legacy Solution */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Current {currentSys.name}</span>
                  <span className="font-mono font-semibold text-rose-400">
                    ₹{legacyMonthlyOperatingINR.toLocaleString('en-IN')}/mo
                  </span>
                </div>
                <div className="h-2 w-full bg-[#262626] rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500/70 rounded-full w-full" />
                </div>
              </div>

              {/* AuraPass On-Premise */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span className="text-emerald-400 font-medium">AuraPass On-Premise</span>
                  <span className="font-mono font-semibold text-emerald-400">
                    {aurapassMonthlyINR === 0 ? '₹0 (Free Starter)' : `₹${aurapassMonthlyINR.toLocaleString('en-IN')}/mo flat`}
                  </span>
                </div>
                <div className="h-2 w-full bg-[#262626] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.max(4, Math.min(100, (aurapassMonthlyINR / Math.max(1, legacyMonthlyOperatingINR)) * 100))}%`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Key Micro-Metrics */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-[#141414] border border-[#242424]">
                <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
                  <Clock size={12} className="text-emerald-400" />
                  <span>Queue Hours Saved</span>
                </div>
                <div className="text-xl font-bold font-mono text-white">
                  {queueHoursSaved} hrs
                  <span className="text-[10px] text-zinc-500 font-sans block">per month</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#141414] border border-[#242424]">
                <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
                  <ShieldCheck size={12} className="text-emerald-400" />
                  <span>Buddy Punch Rate</span>
                </div>
                <div className="text-xl font-bold font-mono text-emerald-400">
                  0.0%
                  <span className="text-[10px] text-zinc-500 font-sans block">100% eliminated</span>
                </div>
              </div>
            </div>

            {/* Action CTA */}
            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                to="/register"
                iconRight={ArrowRight}
                className="w-full justify-center shadow-lg"
              >
                Start Free Trial (25 Staff)
              </Button>
              <div className="text-center text-[11px] text-zinc-500 mt-2">
                No credit card • 5-minute laptop webcam deployment
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
