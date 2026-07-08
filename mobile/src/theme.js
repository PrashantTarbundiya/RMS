// ═══════════════════════════════════════════════════════
// RMS FACE AI — MOBILE DESIGN SYSTEM v2.0
// Matches the premium Mint Green & Charcoal Slate design
// ═══════════════════════════════════════════════════════

export const COLORS = {
  // ── Core Palette (Emerald/Mint & Slate) ──
  primary: '#10B981',        // Emerald Green
  primaryLight: '#34D399',   // Light Mint
  primaryDark: '#059669',    // Dark Emerald
  secondary: '#1E293B',      // Slate Carbon
  secondaryLight: '#334155', // Light Slate

  // ── Surfaces ──
  bgPrimary: '#0B0F19',      // Deep Charcoal
  bgSecondary: '#131926',    // Sleek Slate Carbon
  bgCard: '#1E293B',         // Slate Gray
  bgCardHover: '#263548',    // Active Slate Gray
  bgElevated: '#334155',     // Elevated Slate
  bgInput: '#080C14',        // Deepest Dark

  // ── Legacy Aliases ──
  accentCyan: '#10B981',     // Map legacy accentCyan to Mint Green
  accentTeal: '#34D399',     // Map legacy accentTeal to Light Mint

  // ── Text ──
  textPrimary: '#F8FAFC',    // Off-White
  textSecondary: '#94A3B8',  // Slate Gray Text
  textTertiary: '#64748B',   // Dark Gray Text
  textMuted: '#475569',      // Muted Slate Text

  // ── Semantic ──
  success: '#10B981',        // Green
  error: '#EF4444',          // Coral Red
  warning: '#F59E0B',        // Amber Yellow
  info: '#06B6D4',           // Teal Blue
  danger: '#EF4444',

  // ── Borders ──
  border: 'rgba(148, 163, 184, 0.12)',
  borderHover: 'rgba(10, 185, 129, 0.25)',
  borderActive: 'rgba(16, 185, 129, 0.5)',

  // ── Gradients ──
  gradientPrimary: ['#059669', '#10B981'],
  gradientCyan: ['#10B981', '#34D399'],
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
