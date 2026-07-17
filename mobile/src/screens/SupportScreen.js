import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, APPLE_GLASS_STYLE } from '../theme';

export default function SupportScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary }}>
      <View style={styles.appleWallpaperOrbPurple} />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Quick Start */}
        <Text style={styles.sectionHeaderTitle}>QUICK START GUIDE</Text>

        <View style={styles.appleGlassCard}>
          <GuideRow
            num={1}
            icon="account-plus-outline"
            title="1. Register Subject"
            desc="Go to Register tab. Enter a name and capture or upload 3+ photos from frontal, left and right angles."
          />
          <View style={styles.divider} />
          <GuideRow
            num={2}
            icon="sync"
            title="2. Train Models"
            desc="The Flask server trains models automatically when you upload. Check the Models tab to see completion."
          />
          <View style={styles.divider} />
          <GuideRow
            num={3}
            icon="radar"
            title="3. Test Inference"
            desc="Use Scan tab to capture a face. The Ensemble system will predict by combining 3 models."
            isLast
          />
        </View>

        {/* Network Connections */}
        <Text style={styles.sectionHeaderTitle}>WIFI CONNECTION HELP</Text>
        <View style={styles.appleGlassCard}>
          <TipItem
            icon="wifi"
            title="Same Local Network"
            desc="Both your mobile device and your PC must be connected to the exact same WiFi router/local network."
          />
          <View style={styles.divider} />
          <TipItem
            icon="ip-network-outline"
            title="Check Server IP"
            desc='Do not use "localhost" in settings on your mobile device. Enter the IPv4 network IP of your PC (e.g. http://192.168.1.7:5000).'
          />
          <View style={styles.divider} />
          <TipItem
            icon="shield-alert-outline"
            title="Firewalls"
            desc="Windows Defender or third-party firewalls might block incoming requests on port 5000. Try temporarily allowing port 5000."
            isLast
          />
        </View>

        {/* Accuracy Guidelines */}
        <Text style={styles.sectionHeaderTitle}>ACCURACY GUIDELINES</Text>
        <View style={styles.appleGlassCard}>
          <View style={styles.tipSectionSuccess}>
            <View style={styles.tipHeader}>
              <MaterialCommunityIcons name="check-circle-outline" size={18} color={COLORS.appleGreen} />
              <Text style={{ color: COLORS.appleGreen, fontWeight: '700', fontSize: 13 }}>Best Practices</Text>
            </View>
            <BulletItem text="Frontal + side angles during registration" color={COLORS.textSecondary} />
            <BulletItem text="Good ambient light with clean background" color={COLORS.textSecondary} />
            <BulletItem text="Face is centered and not covered by mask/sunglasses" color={COLORS.textSecondary} />
          </View>

          <View style={{ height: SPACING.md }} />

          <View style={styles.tipSectionError}>
            <View style={styles.tipHeader}>
              <MaterialCommunityIcons name="close-circle-outline" size={18} color={COLORS.appleRed} />
              <Text style={{ color: COLORS.appleRed, fontWeight: '700', fontSize: 13 }}>Avoid</Text>
            </View>
            <BulletItem text="Out-of-focus or motion-blurred images" color={COLORS.textSecondary} />
            <BulletItem text="Backlit shots (very dark faces)" color={COLORS.textSecondary} />
            <BulletItem text="Cropped face edges" color={COLORS.textSecondary} />
          </View>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>
    </View>
  );
}

function GuideRow({ num, icon, title, desc }) {
  return (
    <View style={styles.guideRow}>
      <View style={styles.numberCircle}>
        <Text style={styles.numberText}>{num}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <MaterialCommunityIcons name={icon} size={16} color={COLORS.appleBlue} />
          <Text style={styles.guideTitle}>{title}</Text>
        </View>
        <Text style={styles.guideDesc}>{desc}</Text>
      </View>
    </View>
  );
}

function TipItem({ icon, title, desc }) {
  return (
    <View style={styles.tipItem}>
      <View style={styles.tipIconBox}>
        <MaterialCommunityIcons name={icon} size={18} color={COLORS.appleBlue} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.tipTitle}>{title}</Text>
        <Text style={styles.tipDesc}>{desc}</Text>
      </View>
    </View>
  );
}

function BulletItem({ text, color }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bulletDot} />
      <Text style={{ color, fontSize: 12, lineHeight: 16, flex: 1 }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: SPACING.md },
  appleWallpaperOrbPurple: {
    position: 'absolute', top: -40, right: -40,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: 'rgba(94, 44, 165, 0.25)',
  },
  sectionHeaderTitle: {
    color: COLORS.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1,
    marginTop: SPACING.xs, marginBottom: SPACING.sm,
  },
  appleGlassCard: {
    ...APPLE_GLASS_STYLE, padding: SPACING.md, marginBottom: SPACING.md,
  },
  divider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)', marginVertical: SPACING.sm },
  guideRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  numberCircle: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(10, 132, 255, 0.15)', borderWidth: 1, borderColor: 'rgba(10, 132, 255, 0.35)',
    justifyContent: 'center', alignItems: 'center', marginTop: 2,
  },
  numberText: { color: COLORS.appleBlue, fontWeight: '700', fontSize: 12 },
  guideTitle: { fontWeight: '700', color: COLORS.textPrimary, fontSize: 14 },
  guideDesc: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 16 },
  tipItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  tipIconBox: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(10, 132, 255, 0.15)', borderWidth: 1, borderColor: 'rgba(10, 132, 255, 0.30)',
    justifyContent: 'center', alignItems: 'center', marginTop: 2,
  },
  tipTitle: { fontWeight: '700', color: COLORS.textPrimary, fontSize: 14, marginBottom: 2 },
  tipDesc: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 16 },
  tipSectionSuccess: {
    backgroundColor: 'rgba(48, 209, 88, 0.12)', borderRadius: 14, padding: SPACING.md,
    borderWidth: 1, borderColor: 'rgba(48, 209, 88, 0.30)',
  },
  tipSectionError: {
    backgroundColor: 'rgba(255, 69, 58, 0.12)', borderRadius: 14, padding: SPACING.md,
    borderWidth: 1, borderColor: 'rgba(255, 69, 58, 0.30)',
  },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 4, marginLeft: 12 },
  bulletDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.textTertiary, marginTop: 6 },
});
