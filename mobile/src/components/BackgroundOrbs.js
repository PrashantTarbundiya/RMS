import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../theme';

let Svg, Defs, RadialGradient, Stop, Rect;
try {
  const svgModule = require('react-native-svg');
  Svg = svgModule.default || svgModule.Svg;
  Defs = svgModule.Defs;
  RadialGradient = svgModule.RadialGradient;
  Stop = svgModule.Stop;
  Rect = svgModule.Rect;
} catch (e) {
  Svg = null;
}

/**
 * Ambient Glowing Background Orbs with true soft SVG Radial Gradient falloff.
 * Fixes Bug #4 (hard-edged background circles).
 */
export default function BackgroundOrbs() {
  if (!Svg || !RadialGradient) {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.topRightOrbFallback} />
        <View style={styles.bottomLeftOrbFallback} />
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Top Right Purple Ambient Glow */}
      <View style={styles.topRightOrb}>
        <Svg height="350" width="350">
          <Defs>
            <RadialGradient id="orbPurple" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={COLORS.applePurple} stopOpacity="0.22" />
              <Stop offset="50%" stopColor={COLORS.applePurple} stopOpacity="0.08" />
              <Stop offset="100%" stopColor={COLORS.applePurple} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#orbPurple)" />
        </Svg>
      </View>

      {/* Bottom Left Blue Ambient Glow */}
      <View style={styles.bottomLeftOrb}>
        <Svg height="400" width="400">
          <Defs>
            <RadialGradient id="orbBlue" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={COLORS.appleBlue} stopOpacity="0.20" />
              <Stop offset="50%" stopColor={COLORS.appleBlue} stopOpacity="0.06" />
              <Stop offset="100%" stopColor={COLORS.appleBlue} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#orbBlue)" />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topRightOrb: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 350,
    height: 350,
  },
  bottomLeftOrb: {
    position: 'absolute',
    bottom: -120,
    left: -120,
    width: 400,
    height: 400,
  },
  topRightOrbFallback: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(130, 143, 255, 0.12)',
  },
  bottomLeftOrbFallback: {
    position: 'absolute',
    bottom: -120,
    left: -120,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(94, 106, 210, 0.10)',
  },
});
