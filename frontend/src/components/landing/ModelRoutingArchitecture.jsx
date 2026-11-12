import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Cpu,
  Zap,
  CheckCircle2,
  Copy,
  Check,
  Radio,
  Lock,
  Layers,
  Sparkles
} from 'lucide-react';
import InteractiveDotGrid from './InteractiveDotGrid';

const MODELS = [
  {
    id: 'facenet',
    name: 'FaceNet-512',
    provider: 'Frontal Master',
    benchmark: '99.65% Accuracy',
    latency: '18.4 ms',
    desc: 'Instant, razor-sharp recognition for front-facing entrance gates',
    accentColor: '#10B981',
    icon: Cpu,
    statusText: 'PRIMARY ENGINE'
  },
  {
    id: 'insightface',
    name: 'InsightFace (ArcFace)',
    provider: 'Wide-Angle Specialist',
    benchmark: '99.83% Accuracy',
    latency: '24.1 ms',
    desc: 'Recognizes staff walking past at up to 45° side angles without stopping',
    accentColor: '#38BDF8',
    icon: Layers,
    statusText: 'SIDE-ANGLE READY'
  },
  {
    id: 'ghostfacenet',
    name: 'GhostFaceNet',
    provider: 'Fast Edge Engine',
    benchmark: '4.2 ms Speed',
    latency: '4.2 ms',
    desc: 'Ultra-fast lightweight engine for tablets, budget laptops & mini PCs',
    accentColor: '#A78BFA',
    icon: Zap,
    statusText: 'FAST FOR TABLETS'
  },
  {
    id: 'antispoof',
    name: 'Anti-Cheating Guard',
    provider: 'Liveness Defense Unit',
    benchmark: 'ISO 30107-3',
    latency: '8.6 ms',
    desc: 'Stops phone screen photos, printed paper & video replays instantly',
    accentColor: '#F59E0B',
    icon: Shield,
    statusText: 'NO PROXY CHECK-IN'
  },
  {
    id: 'enclave',
    name: 'Local Private Storage',
    provider: 'Office PC Database',
    benchmark: 'AES-256 Vault',
    latency: '1.8 ms',
    desc: 'Saves all face templates inside your office — 0% internet cloud upload',
    accentColor: '#10B981',
    icon: Lock,
    statusText: 'STAYS IN YOUR OFFICE'
  }
];

export default function ModelRoutingArchitecture() {
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [autoCycle, setAutoCycle] = useState(true);
  const [copied, setCopied] = useState(false);
  const [wireCoords, setWireCoords] = useState(null);

  const containerRef = useRef(null);
  const codeBoxRef = useRef(null);
  const hubRef = useRef(null);
  const circleHubRef = useRef(null);
  const cardRefs = useRef([]);
  const userTimerRef = useRef(null);

  // Auto-cycle through models every 2.6 seconds (like ScrapeOps dynamic live showcase)
  useEffect(() => {
    if (!autoCycle) return;
    const interval = setInterval(() => {
      setSelectedModel(prev => {
        const nextIdx = (MODELS.findIndex(m => m.id === prev.id) + 1) % MODELS.length;
        return MODELS[nextIdx];
      });
    }, 2600);
    return () => clearInterval(interval);
  }, [autoCycle]);

  // When user hovers or clicks, pause auto-cycle for 8s, then resume
  const handleSelectModel = (model) => {
    setSelectedModel(model);
    setAutoCycle(false);
    if (userTimerRef.current) clearTimeout(userTimerRef.current);
    userTimerRef.current = setTimeout(() => {
      setAutoCycle(true);
    }, 8000);
  };

  const handleCopyCode = () => {
    const code = `from aurapass import BiometricPipeline

# Connect to any RTSP camera or local webcam feed
pipeline = BiometricPipeline.connect(
    source="rtsp://192.168.1.50:554/live",
    routing="consensus_ensemble",
    min_confidence=0.75,
    anti_spoof=True
)

# Multi-model inference dispatches automatically
for match in pipeline.detect():
    print(f"Verified: {match.name} ({match.confidence}%)")`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Recalculate pixel-perfect SVG bezier anchor points
  const updateCoordinates = useCallback(() => {
    if (!containerRef.current || !codeBoxRef.current || !circleHubRef.current) return;
    const contRect = containerRef.current.getBoundingClientRect();
    const codeRect = codeBoxRef.current.getBoundingClientRect();
    const circleRect = circleHubRef.current.getBoundingClientRect();

    // Exact center coordinates of the circular AuraPass emblem
    const hubCenterX = circleRect.left + circleRect.width / 2 - contRect.left;
    const hubCenterY = circleRect.top + circleRect.height / 2 - contRect.top;
    const radius = circleRect.width / 2;

    // Use the central hub's vertical center as the single unified horizontal baseline
    // This mathematically guarantees that the left incoming beam is 100% horizontal (0° tilt)
    const baselineY = hubCenterY;

    // Left wire: connects code box right edge directly to center hub left rim
    const codePoint = {
      x: codeRect.right - contRect.left,
      y: baselineY
    };

    // Center point of the AuraPass circle
    const hubCenterPoint = {
      x: hubCenterX,
      y: baselineY
    };

    // Left rim of the circle (where wire touches)
    const hubLeftPoint = {
      x: hubCenterX - radius,
      y: baselineY
    };

    // Right rim of the circle (where wires emerge)
    const hubRightPoint = {
      x: hubCenterX + radius,
      y: baselineY
    };

    const cardPoints = cardRefs.current.map(cardEl => {
      if (!cardEl) return null;
      const r = cardEl.getBoundingClientRect();
      return {
        x: r.left - contRect.left,
        y: r.top + r.height / 2 - contRect.top
      };
    });

    setWireCoords({
      width: contRect.width,
      height: contRect.height,
      codePoint,
      hubCenterPoint,
      hubLeftPoint,
      hubRightPoint,
      cardPoints
    });
  }, []);

  useEffect(() => {
    updateCoordinates();
    const ro = new ResizeObserver(() => updateCoordinates());
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', updateCoordinates);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateCoordinates);
    };
  }, [updateCoordinates]);

  const selectedIdx = MODELS.findIndex(m => m.id === selectedModel.id);
  const activeCardPoint = wireCoords?.cardPoints?.[selectedIdx];

  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-[#0A0A0A] border-t border-b border-[#262626] overflow-hidden select-none">
      {/* ─── Interactive Dotted Canvas with Mouse Illumination ─── */}
      <InteractiveDotGrid dotSpacing={28} glowRadius={190} />

      {/* Ambient background glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[400px] bg-emerald-500/5 blur-[130px] rounded-full pointer-events-none"
        aria-hidden="true" 
      />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111111] border border-[#262626] text-[11px] font-mono uppercase tracking-widest text-emerald-400 mb-3 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>ONE SIMPLE SETUP • MULTI-CAMERA ATTENDANCE</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground font-display max-w-3xl mx-auto text-balance">
            Smart AI Engine Built for Busy Office & Factory Gates
          </h2>

          <p className="mt-3.5 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed text-balance">
            Connect your existing CCTV cameras, webcams, or tablets. AuraPass automatically recognizes staff in under a second — even in dim light or when walking past the camera at an angle.
          </p>
        </div>

        {/* ─── Interactive Node Architecture Diagram ─── */}
        <div 
          ref={containerRef}
          className="relative mb-14 min-h-[460px] flex items-center justify-between"
        >
          {/* Dynamic SVG Connection Layer (Desktop >= 1024px) */}
          {wireCoords && (
            <svg 
              className="hidden lg:block absolute inset-0 pointer-events-none z-0" 
              style={{ width: wireCoords.width, height: wireCoords.height }}
            >
              <defs>
                <filter id="emeraldGlowWire" filterUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#10B981" floodOpacity="0.8" />
                </filter>
                <linearGradient id="activeBeam" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#34D399" />
                </linearGradient>
              </defs>

              {/* 1. Left Wire: Code Box directly to Center Hub */}
              {/* Outer glowing underlay */}
              <path
                d={`M ${wireCoords.codePoint.x} ${wireCoords.codePoint.y} L ${wireCoords.hubCenterPoint.x} ${wireCoords.hubCenterPoint.y}`}
                stroke="#10B981"
                strokeWidth="7"
                strokeOpacity="0.28"
                strokeLinecap="round"
                fill="none"
              />
              {/* Core crisp emerald wire */}
              <path
                d={`M ${wireCoords.codePoint.x} ${wireCoords.codePoint.y} L ${wireCoords.hubCenterPoint.x} ${wireCoords.hubCenterPoint.y}`}
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
              {/* Traveling Packet on Left Wire into Center */}
              <circle r="3.5" fill="#FFFFFF">
                <animateMotion
                  path={`M ${wireCoords.codePoint.x} ${wireCoords.codePoint.y} L ${wireCoords.hubCenterPoint.x} ${wireCoords.hubCenterPoint.y}`}
                  dur="1.2s"
                  repeatCount="indefinite"
                />
              </circle>
              {/* Pulse glow around packet */}
              <circle r="6" fill="#10B981" opacity="0.45">
                <animateMotion
                  path={`M ${wireCoords.codePoint.x} ${wireCoords.codePoint.y} L ${wireCoords.hubCenterPoint.x} ${wireCoords.hubCenterPoint.y}`}
                  dur="1.2s"
                  repeatCount="indefinite"
                />
              </circle>
              {/* Anchor Port Dots */}
              <circle cx={wireCoords.codePoint.x} cy={wireCoords.codePoint.y} r="4.5" fill="#10B981" />
              <circle cx={wireCoords.hubLeftPoint.x} cy={wireCoords.hubLeftPoint.y} r="5" fill="#10B981" />

              {/* 2. Inactive Branches from Center Hub to Cards */}
              {wireCoords.cardPoints.map((cp, idx) => {
                if (!cp || idx === selectedIdx) return null;
                const startX = wireCoords.hubRightPoint.x;
                const startY = wireCoords.hubRightPoint.y;
                const midX = (startX + cp.x) / 2;
                const d = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${cp.y}, ${cp.x} ${cp.y}`;
                return (
                  <path
                    key={idx}
                    d={d}
                    stroke="#262626"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    fill="none"
                    opacity="0.8"
                  />
                );
              })}

              {/* 3. Active Branch from Center Hub to Selected Card */}
              {activeCardPoint && (() => {
                const startX = wireCoords.hubRightPoint.x;
                const startY = wireCoords.hubRightPoint.y;
                const midX = (startX + activeCardPoint.x) / 2;
                const activePath = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${activeCardPoint.y}, ${activeCardPoint.x} ${activeCardPoint.y}`;
                return (
                  <>
                    <path
                      d={activePath}
                      stroke="url(#activeBeam)"
                      strokeWidth="2.5"
                      fill="none"
                      filter="url(#emeraldGlowWire)"
                    />
                    {/* Traveling Pulse Particle */}
                    <circle r="4" fill="#FFFFFF">
                      <animateMotion path={activePath} dur="1.1s" repeatCount="indefinite" />
                    </circle>
                    <circle r="7" fill="#10B981" opacity="0.35">
                      <animateMotion path={activePath} dur="1.1s" repeatCount="indefinite" />
                    </circle>
                    {/* Anchor Dots on Active Wire */}
                    <circle cx={wireCoords.hubRightPoint.x} cy={wireCoords.hubRightPoint.y} r="4.5" fill="#10B981" />
                    <circle cx={activeCardPoint.x} cy={activeCardPoint.y} r="4" fill="#10B981" />
                  </>
                );
              })()}
            </svg>
          )}

          {/* DESKTOP 3-COLUMN CONTENT */}
          <div className="hidden lg:flex items-center justify-between w-full relative z-10 gap-6">
            {/* 1. LEFT NODE: Code Terminal Box */}
            <div ref={codeBoxRef} className="w-[330px] shrink-0">
              <div className="rounded-xl border border-[#262626] bg-[#0E0E10]/95 backdrop-blur-xl shadow-2xl overflow-hidden font-mono text-xs">
                {/* Terminal Window Header */}
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#141416] border-b border-[#262626]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                    <span className="text-[11px] text-zinc-400 ml-2 font-mono">aurapass_stream.py</span>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title="Copy code to clipboard"
                  >
                    {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Code Content */}
                <div className="p-4 space-y-1 text-[11.5px] leading-relaxed text-zinc-300">
                  <p className="text-zinc-500"># One unified biometric stream</p>
                  <p><span className="text-purple-400">from</span> aurapass <span className="text-purple-400">import</span> BiometricPipeline</p>
                  <p className="py-0.5" />
                  <p><span className="text-zinc-400">pipeline</span> = BiometricPipeline.connect(</p>
                  <p className="pl-4"><span className="text-emerald-300">source</span>=<span className="text-amber-300">"rtsp://192.168.1.50/live"</span>,</p>
                  <p className="pl-4"><span className="text-emerald-300">routing</span>=<span className="text-amber-300">"consensus_ensemble"</span>,</p>
                  <p className="pl-4"><span className="text-emerald-300">threshold</span>=<span className="text-blue-300">0.70</span>,</p>
                  <p className="pl-4"><span className="text-emerald-300">anti_spoof</span>=<span className="text-purple-400">True</span></p>
                  <p>)</p>
                  <p className="py-0.5" />
                  <p className="text-zinc-500"># Dynamic model dispatch</p>
                  <p><span className="text-purple-400">for</span> event <span className="text-purple-400">in</span> pipeline.detect():</p>
                  <p className="pl-4"><span className="text-cyan-400">print</span>(event.name, event.confidence)</p>
                </div>
              </div>
            </div>

            {/* 2. CENTER NODE: AuraPass Central Routing Hub */}
            <div ref={hubRef} className="relative flex flex-col items-center justify-center shrink-0 px-4">
              <div className="relative flex items-center justify-center">
                {/* Outer Concentric Animated Pulse Waves */}
                <div className="absolute w-36 h-36 rounded-full border border-emerald-500/20 animate-ping" style={{ animationDuration: '3s' }} />
                <div className="absolute w-28 h-28 rounded-full border border-emerald-500/30 animate-pulse" style={{ animationDuration: '2s' }} />

                {/* Center Solid Emblem Hub */}
                <div
                  ref={circleHubRef}
                  className="w-20 h-20 rounded-full bg-[#111111] border-2 border-emerald-500/60 shadow-[0_0_35px_rgba(16,185,129,0.35)] flex flex-col items-center justify-center relative z-10 group hover:scale-105 transition-transform duration-200 cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-400 mb-0.5">
                    <Shield className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <span className="font-mono text-[9px] font-bold tracking-tight text-white uppercase">AuraPass</span>
                </div>
              </div>

              {/* Center Label below emblem (absolutely positioned so it doesn't offset vertical centering) */}
              <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 text-center whitespace-nowrap pointer-events-none">
                <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-emerald-400 block">
                  AuraPass™
                </span>
                <span className="text-xs font-semibold text-zinc-300 font-mono tracking-wider">
                  ROUTING LAYER
                </span>
              </div>
            </div>

            {/* 3. RIGHT NODE: Model Engine Stack (Interactive Cards) */}
            <div className="w-[330px] shrink-0 space-y-2.5">
              {MODELS.map((model, idx) => {
                const isSelected = selectedModel.id === model.id;
                const IconComponent = model.icon;
                return (
                  <div
                    key={model.id}
                    ref={el => (cardRefs.current[idx] = el)}
                    onClick={() => handleSelectModel(model)}
                    onMouseEnter={() => handleSelectModel(model)}
                    className={`p-2.5 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#171717] border-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.20)] translate-x-1'
                        : 'bg-[#111111]/85 border-[#262626] hover:bg-[#141416] hover:border-[#383838]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                        style={{
                          backgroundColor: `${model.accentColor}18`,
                          borderColor: `${model.accentColor}35`,
                          color: model.accentColor
                        }}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-semibold text-xs truncate ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                            {model.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono truncate block">
                          {model.benchmark} • {model.latency}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isSelected ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold tracking-wider uppercase">
                          SELECTED
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300">
                          {model.statusText}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* MOBILE DIAGRAM VIEW (<1024px) */}
          <div className="lg:hidden w-full space-y-6">
            {/* 1. Code Box */}
            <div className="rounded-xl border border-[#262626] bg-[#0E0E10] overflow-hidden text-xs font-mono">
              <div className="flex items-center justify-between px-3 py-2 bg-[#141416] border-b border-[#262626]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  <span className="text-[10px] text-zinc-400 ml-1">aurapass_stream.py</span>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white"
                >
                  {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-3 text-[11px] leading-relaxed text-zinc-300 overflow-x-auto">
                <p className="text-zinc-500"># Unified RTSP stream</p>
                <p><span className="text-purple-400">from</span> aurapass <span className="text-purple-400">import</span> BiometricPipeline</p>
                <p><span className="text-zinc-400">pipeline</span> = BiometricPipeline.connect(</p>
                <p className="pl-3"><span className="text-emerald-300">source</span>=<span className="text-amber-300">"rtsp://192.168.1.50/live"</span>,</p>
                <p className="pl-3"><span className="text-emerald-300">threshold</span>=<span className="text-blue-300">0.70</span></p>
                <p>)</p>
              </div>
            </div>

            {/* Central Badge Flow Indicator */}
            <div className="flex items-center justify-center gap-3 py-2">
              <div className="h-px bg-emerald-500/40 flex-1" />
              <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs flex items-center gap-1.5">
                <Shield size={13} />
                <span>AuraPass Routing Layer</span>
              </div>
              <div className="h-px bg-emerald-500/40 flex-1" />
            </div>

            {/* Models Mobile Cards Grid */}
            <div className="space-y-2">
              {MODELS.map((model) => {
                const isSelected = selectedModel.id === model.id;
                const IconComponent = model.icon;
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => handleSelectModel(model)}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-[#171717] border-emerald-500/80 shadow-md'
                        : 'bg-[#111111] border-[#262626]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                        style={{
                          backgroundColor: `${model.accentColor}18`,
                          borderColor: `${model.accentColor}35`,
                          color: model.accentColor
                        }}
                      >
                        <IconComponent size={16} />
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-white">{model.name}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">{model.benchmark} • {model.latency}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono font-bold">
                        ACTIVE
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── 3 Bottom Value Prop Columns (matching ScrapeOps layout) ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-[#262626]">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm sm:text-base text-foreground font-display">
              One simple setup. Works with all your cameras.
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Connect standard CCTV cameras, entrance webcams, or tablets. No need to replace existing wiring or buy specialized biometric hardware.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm sm:text-base text-foreground font-display">
              Fast recognition. Front or walking side angle.
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Staff don't need to stand still or look directly into the lens. The AI naturally recognizes them as they walk through your doors.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm sm:text-base text-foreground font-display">
              100% Reliable. Works in dim light or sunshine.
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Built for real factory gates and office entrances. High-accuracy dual models prevent false alarms and ensure nobody gets stuck at the gate.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
