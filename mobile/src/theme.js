// ═══════════════════════════════════════════════════════
// RMS FACE AI — MOBILE DESIGN SYSTEM v2.0
// Matches the premium Mint Green & Charcoal Slate design
// ═══════════════════════════════════════════════════════

export const COLORS = {
  // ── Core Palette (Graphite & Indigo) ──
  primary: '#4F46E5',        // Indigo 600
  primaryLight: '#818CF8',   // Indigo 400
  primaryDark: '#3730A3',    // Indigo 800
  secondary: '#1E293B',      // Slate 800
  secondaryLight: '#334155', // Slate 700

  // ── Surfaces ──
  bgPrimary: '#0F172A',      // Slate 900
  bgSecondary: '#1E293B',    // Slate 800
  bgCard: '#1E293B',         // Slate 800
  bgCardHover: '#334155',    // Slate 700
  bgElevated: '#334155',     // Slate 700
  bgInput: '#0B1120',        // Slate 950

  // ── Legacy Aliases ──
  accentCyan: '#4F46E5',
  accentTeal: '#818CF8',

  // ── Text ──
  textPrimary: '#F8FAFC',    // Slate 50
  textSecondary: '#94A3B8',  // Slate 400
  textTertiary: '#64748B',   // Slate 500
  textMuted: '#475569',      // Slate 600

  // ── Semantic ──
  success: '#10B981',        
  error: '#EF4444',          
  warning: '#F59E0B',        
  info: '#3B82F6',           
  danger: '#EF4444',

  // ── Borders ──
  border: 'rgba(148, 163, 184, 0.12)',
  borderHover: 'rgba(79, 70, 229, 0.25)',
  borderActive: 'rgba(79, 70, 229, 0.5)',

  // ── Gradients ──
  gradientPrimary: ['#3730A3', '#4F46E5'],
  gradientCyan: ['#4F46E5', '#818CF8'],
  gradientSuccess: ['#10B981', '#059669'],
  gradientDanger: ['#EF4444', '#DC2626'],
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT_SIZES = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
  hero: 34,
};

export const BORDER_RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
};

// Default server configuration
export const API_CONFIG = {
  BASE_URL: 'http://192.168.1.7:5000/api',
};
