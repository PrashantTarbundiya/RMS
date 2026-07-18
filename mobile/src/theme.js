// ═════════════════════════════════════════════════════════════════════════
// RMS FACE AI — BRIGHT & VIBRANT UI
// ═════════════════════════════════════════════════════════════════════════

import { MD3LightTheme } from 'react-native-paper';

export const COLORS = {
  // ── Bright & Clean Base ──
  bgPrimary: '#F2F2F7',               // Apple System Gray 6 (Light)
  bgSecondary: '#FFFFFF',             // Pure White
  bgCard: '#FFFFFF',                  // Solid White Card
  bgCardHover: '#F2F2F7',
  bgElevated: 'rgba(255, 255, 255, 0.90)',
  bgInput: '#E5E5EA',                 // System Gray 5

  // ── Vibrant Accent Colors ──
  appleBlue: '#007AFF',               // Bright System Blue
  appleGreen: '#34C759',              // Bright System Green
  appleRed: '#FF3B30',                // Bright System Red
  applePurple: '#AF52DE',             // Bright System Purple
  appleOrange: '#FF9500',             // Bright System Orange
  appleCyan: '#32ADE6',               // Bright System Cyan
  appleIndigo: '#5856D6',             // Bright System Indigo

  // Core System Aliases
  primary: '#007AFF',
  primaryLight: '#5AC8FA',
  primaryDark: '#0056B3',
  primaryContainer: 'rgba(0, 122, 255, 0.12)',
  onPrimaryContainer: '#004080',

  // ── High Contrast Typography ──
  textPrimary: '#000000',                               // High Contrast Black
  textSecondary: '#3C3C43',                             // System Gray (Secondary)
  textTertiary: 'rgba(60, 60, 67, 0.6)',                // System Gray (Tertiary)
  textMuted: 'rgba(60, 60, 67, 0.3)',                   // System Gray (Quaternary)

  // ── Status Mapping ──
  success: '#34C759',
  successContainer: 'rgba(52, 199, 89, 0.15)',
  error: '#FF3B30',
  errorContainer: 'rgba(255, 59, 48, 0.15)',
  warning: '#FF9500',
  warningContainer: 'rgba(255, 149, 0, 0.15)',
  info: '#32ADE6',
  infoContainer: 'rgba(50, 173, 230, 0.15)',

  // ── Soft Borders ──
  border: '#E5E5EA',
  borderSpecularTop: '#FFFFFF',
  borderSpecularLeft: '#FFFFFF',
  borderSpecularRight: '#E5E5EA',
  borderSpecularBottom: '#D1D1D6',

  // ── Vibrant Gradients ──
  gradientPrimary: ['#007AFF', '#5856D6'],
  gradientAppleBlue: ['#007AFF', '#5AC8FA'],
  gradientAppleGreen: ['#34C759', '#30D158'],
  gradientApplePurple: ['#AF52DE', '#5856D6'],
  gradientAppleOrange: ['#FF9500', '#FF3B30'],
  gradientHero: ['rgba(0, 122, 255, 0.08)', 'rgba(88, 86, 214, 0.05)', 'rgba(255, 255, 255, 1)'],
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
  lg: 17,
  xl: 22,
  xxl: 28,
  hero: 34,
};

export const BORDER_RADIUS = {
  sm: 14,
  md: 20,
  lg: 26,
  xl: 38,
  full: 999,
};

export const APPLE_GLASS_STYLE = {
  backgroundColor: '#FFFFFF',
  borderRadius: BORDER_RADIUS.lg,
  borderWidth: 1,
  borderColor: '#E5E5EA',
  borderTopColor: '#FFFFFF',
  borderLeftColor: '#FFFFFF',
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 16,
  elevation: 4,
};

export const paperTheme = {
  ...MD3LightTheme,
  dark: false,
  roundness: 20,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.appleBlue,
    primaryContainer: COLORS.primaryContainer,
    onPrimaryContainer: COLORS.onPrimaryContainer,
    secondary: COLORS.applePurple,
    surface: COLORS.bgSecondary,
    surfaceVariant: '#F2F2F7',
    background: COLORS.bgPrimary,
    error: COLORS.appleRed,
    errorContainer: COLORS.errorContainer,
    outline: COLORS.border,
    onSurface: COLORS.textPrimary,
    onSurfaceVariant: COLORS.textSecondary,
  },
};

export const navigationTheme = {
  dark: false,
  colors: {
    primary: COLORS.appleBlue,
    background: COLORS.bgPrimary,
    card: '#FFFFFF',
    text: COLORS.textPrimary,
    border: '#E5E5EA',
    notification: COLORS.appleRed,
  },
};

export const API_CONFIG = {
  BASE_URL: 'http://10.21.26.170:5000/api',
};
