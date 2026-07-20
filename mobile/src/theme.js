// ═════════════════════════════════════════════════════════════════════════
// RMS FACE AI — SLEEK DARK MODE UI
// ═════════════════════════════════════════════════════════════════════════

import { MD3DarkTheme } from 'react-native-paper';

export const COLORS = {
  // ── Sleek Dark Base ──
  bgPrimary: '#010102',               
  bgSecondary: '#0F1011',             
  bgCard: '#0F1011',                  
  bgCardHover: '#141516',
  bgElevated: 'rgba(15, 16, 17, 0.90)',
  bgInput: '#141516',                 

  // ── Vibrant Accent Colors ──
  appleBlue: '#5E6AD2',               // SOTA MobileNetV2 Primary Accent
  appleGreen: '#27A644',              // Success / Confirmed
  appleRed: '#F87171',                // Error / Failed
  applePurple: '#828FFF',             // Secondary / Muted SOTA
  appleOrange: '#FBBF24',             // Warning / Spoof
  appleCyan: '#32ADE6',               
  appleIndigo: '#5856D6',             

  // Core System Aliases
  primary: '#5E6AD2',
  primaryLight: '#828FFF',
  primaryDark: '#4A54AB',
  primaryContainer: 'rgba(94, 106, 210, 0.12)',
  onPrimaryContainer: '#D0D5FF',

  // ── Typography ──
  textPrimary: '#FFFFFF',                               // High Contrast Ink
  textSecondary: '#A0A3AB',                             // Ink Subdued
  textTertiary: '#737780',                              // Ink Tertiary
  textMuted: 'rgba(255, 255, 255, 0.2)',                // Ink Muted

  // ── Status Mapping ──
  success: '#27A644',
  successContainer: 'rgba(39, 166, 68, 0.15)',
  error: '#F87171',
  errorContainer: 'rgba(248, 113, 113, 0.15)',
  warning: '#FBBF24',
  warningContainer: 'rgba(251, 191, 36, 0.15)',
  info: '#5E6AD2',
  infoContainer: 'rgba(94, 106, 210, 0.15)',

  // ── Glass Design Tokens ──
  glassOverlayDark: 'rgba(15, 16, 17, 0.65)',
  glassCardBg: 'rgba(15, 16, 17, 0.55)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassHighlight: 'rgba(255, 255, 255, 0.04)',
  
  // ── Sharp Borders ──
  border: '#23252A',
  borderSpecularTop: '#23252A',
  borderSpecularLeft: '#23252A',
  borderSpecularRight: '#141516',
  borderSpecularBottom: '#0F1011',

  // ── Vibrant Gradients ──
  gradientPrimary: ['#5E6AD2', '#828FFF'],
  gradientAppleBlue: ['#5E6AD2', '#828FFF'],
  gradientAppleGreen: ['#27A644', '#34C759'],
  gradientApplePurple: ['#828FFF', '#5856D6'],
  gradientAppleOrange: ['#FBBF24', '#F87171'],
  gradientHero: ['rgba(94, 106, 210, 0.08)', 'rgba(88, 86, 214, 0.05)', '#010102'],
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
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const TAB_BAR_HEIGHT = 64;

export const APPLE_GLASS_STYLE = {
  backgroundColor: 'rgba(15, 16, 17, 0.65)',
  borderRadius: BORDER_RADIUS.lg,
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.08)',
  overflow: 'hidden',
  elevation: 0,
};

export const paperTheme = {
  ...MD3DarkTheme,
  dark: true,
  roundness: 12,
  colors: {
    ...MD3DarkTheme.colors,
    primary: COLORS.appleBlue,
    primaryContainer: COLORS.primaryContainer,
    onPrimaryContainer: COLORS.onPrimaryContainer,
    secondary: COLORS.applePurple,
    surface: COLORS.bgSecondary,
    surfaceVariant: '#141516',
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
    card: '#0F1011',
    text: COLORS.textPrimary,
    border: '#23252A',
    notification: COLORS.appleRed,
  },
};

export const API_CONFIG = {
  BASE_URL: 'http://10.21.26.170:5000/api',
};

