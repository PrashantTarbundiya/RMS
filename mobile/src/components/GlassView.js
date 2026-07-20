import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, BORDER_RADIUS } from '../theme';

/**
 * Reusable Glassmorphism primitive component for RMS Mobile.
 * Uses expo-blur BlurView on supported platforms (iOS / Web),
 * and falls back to a solid translucent glass container on Android.
 */
export default function GlassView({
  children,
  style,
  intensity = 35,
  tint = 'dark',
  borderRadius = BORDER_RADIUS.lg,
  borderColor = COLORS.glassBorder,
  overlayColor = COLORS.glassOverlayDark,
  ...props
}) {
  const isAndroid = Platform.OS === 'android';

  if (isAndroid) {
    return (
      <View
        style={[
          styles.solidGlassFallback,
          {
            borderRadius,
            borderColor,
            backgroundColor: overlayColor,
          },
          style,
        ]}
        {...props}
      >
        <View style={styles.topHighlight} />
        {children}
      </View>
    );
  }

  return (
    <BlurView
      intensity={intensity}
      tint={tint}
      style={[
        styles.glassSurface,
        {
          borderRadius,
          borderColor,
        },
        style,
      ]}
      {...props}
    >
      <View style={[styles.glassOverlay, { backgroundColor: overlayColor }]} />
      <View style={styles.topHighlight} />
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  glassSurface: {
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  solidGlassFallback: {
    borderWidth: 1,
    position: 'relative',
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: COLORS.glassHighlight,
  },
});
