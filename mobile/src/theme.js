// ═════════════════════════════════════════════════════════════════════════
// RMS FACE AI — 100% AUTHENTIC APPLE VISIONOS / IOS LIQUID GLASS SYSTEM (HIG SPEC)
// ═════════════════════════════════════════════════════════════════════════

import { MD3DarkTheme } from 'react-native-paper';

export const COLORS = {
  // ── Apple Void Base & Space Materials ──
  bgPrimary: '#000000',               // True Apple Void Black
  bgSecondary: '#0B0E17',             // Apple Deep Navy Base
  bgCard: 'rgba(30, 32, 50, 0.55)',   // Authentic Apple Frosted Glass
  bgCardHover: 'rgba(42, 45, 68, 0.65)',
  bgElevated: 'rgba(24, 26, 42, 0.75)',
  bgInput: 'rgba(15, 17, 28, 0.70)',

  // ── Authentic Apple System Colors (iOS / visionOS HIG Spec) ──
  appleBlue: '#0A84FF',               // System Blue
  appleGreen: '#30D158',              // System Green
  appleRed: '#FF453A',                // System Red
  applePurple: '#BF5AF2',             // System Purple
  appleOrange: '#FF9F0A',             // System Orange
  appleCyan: '#64D2FF',               // System Cyan
  appleIndigo: '#5E5CE6',             // System Indigo

  // Core System Aliases
  primary: '#0A84FF',
  primaryLight: '#64D2FF',
  primaryDark: '#0066CC',
  primaryContainer: 'rgba(10, 132, 255, 0.18)',
  onPrimaryContainer: '#D0E4FF',

  // ── Apple Vibrancy Typography ──
  textPrimary: '#FFFFFF',                               // 100% Crisp White
  textSecondary: 'rgba(235, 235, 245, 0.60)',          // Apple Standard Secondary
  textTertiary: 'rgba(235, 235, 245, 0.38)',           // Apple Standard Tertiary
  textMuted: 'rgba(235, 235, 245, 0.22)',              // Apple Standard Quaternary

  // ── Status Mapping ──
  success: '#30D158',
  successContainer: 'rgba(48, 209, 88, 0.18)',
  error: '#FF453A',
  errorContainer: 'rgba(255, 69, 58, 0.18)',
  warning: '#FF9F0A',
  warningContainer: 'rgba(255, 159, 10, 0.18)',
  info: '#64D2FF',
  infoContainer: 'rgba(100, 210, 255, 0.18)',

  // ── Apple Dual Specular Rim Spec ──
  border: 'rgba(255, 255, 255, 0.12)',
  borderSpecularTop: 'rgba(255, 255, 255, 0.42)',
  borderSpecularLeft: 'rgba(255, 255, 255, 0.22)',
  borderSpecularRight: 'rgba(255, 255, 255, 0.10)',
  borderSpecularBottom: 'rgba(255, 255, 255, 0.06)',

  // ── Apple Gradient Accents ──
  gradientPrimary: ['#0A84FF', '#5E5CE6'],
  gradientAppleBlue: ['#0A84FF', '#64D2FF'],
  gradientAppleGreen: ['#30D158', '#34C759'],
  gradientApplePurple: ['#BF5AF2', '#5E5CE6'],
  gradientAppleOrange: ['#FF9F0A', '#FF3B30'],
  gradientHero: ['rgba(94, 92, 230, 0.22)', 'rgba(10, 132, 255, 0.12)', 'rgba(0, 0, 0, 0.5)'],
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

//  Authentic Apple Specular Glass Style Preset
export const APPLE_GLASS_STYLE = {
  backgroundColor: 'rgba(30, 32, 50, 0.55)',
  borderRadius: BORDER_RADIUS.lg,
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.12)',
  borderTopColor: 'rgba(255, 255, 255, 0.42)',
  borderLeftColor: 'rgba(255, 255, 255, 0.22)',
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.35,
  shadowRadius: 24,
  elevation: 8,
};

export const paperTheme = {
  ...MD3DarkTheme,
  dark: true,
  roundness: 20,
  colors: {
    ...MD3DarkTheme.colors,
    primary: COLORS.appleBlue,
    primaryContainer: COLORS.primaryContainer,
    onPrimaryContainer: COLORS.onPrimaryContainer,
    secondary: COLORS.applePurple,
    surface: COLORS.bgSecondary,
    surfaceVariant: 'rgba(255, 255, 255, 0.08)',
    background: COLORS.bgPrimary,
    error: COLORS.appleRed,
    errorContainer: COLORS.errorContainer,
    outline: COLORS.border,
    onSurface: COLORS.textPrimary,
    onSurfaceVariant: COLORS.textSecondary,
  },
};

export const navigationTheme = {
  dark: true,
  colors: {
    primary: COLORS.appleBlue,
    background: COLORS.bgPrimary,
    card: 'rgba(24, 26, 42, 0.75)',
    text: COLORS.textPrimary,
    border: 'rgba(255, 255, 255, 0.12)',
    notification: COLORS.appleBlue,
  },
};

export const API_CONFIG = {
  BASE_URL: 'http://10.21.26.170:5000/api',
};
