import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { COLORS } from '../theme';

const { width, height } = Dimensions.get('window');

/**
 * Ambient Glowing Background Orbs with true soft SVG Radial Gradient falloff.
 * Fixes Bug #4 (hard-edged background circles).
 */
export default function BackgroundOrbs() {
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
});
