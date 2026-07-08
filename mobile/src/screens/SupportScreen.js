import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme';

export default function SupportScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      
      {/* Quick Start */}
      <Text style={styles.sectionTitle}>Quick Start Guide</Text>
      
      <View style={styles.card}>
        <GuideRow num={1} title="Register Person" desc="Go to the Add Person tab. Enter a name and capture or upload 3+ photos from frontal, left and right angles." />
        <GuideRow num={2} title="Train Models" desc="The Flask server trains models automatically when you upload. Check the Models tab to see completion." />
        <GuideRow num={3} title="Test Inference" desc="Use the Recognize tab to capture a face. The Ensemble system will predict by combining 3 models." />
      </View>

      {/* Connection Tips */}
      <Text style={styles.sectionTitle}>WiFi Connection Help</Text>
      <View style={styles.card}>
        <View style={styles.itemPadding}>
          <Text style={styles.itemTitle}>1. Same Network Required</Text>
          <Text style={styles.itemText}>Both your mobile device and your PC must be connected to the exact same WiFi router/local network.</Text>
        </View>
        <View style={styles.itemPadding}>
          <Text style={styles.itemTitle}>2. Check Server IP</Text>
          <Text style={styles.itemText}>Do not use "localhost" in settings on your mobile device. Enter the IPv4 network IP of your PC (e.g. http://192.168.1.7:5000).</Text>
        </View>
        <View style={[styles.itemPadding, { borderBottomWidth: 0 }]}>
          <Text style={styles.itemTitle}>3. Firewalls</Text>
          <Text style={styles.itemText}>Windows Defender or third-party firewalls might block incoming requests on port 5000. Try temporarily allowing port 5000 or set connection profile to Private.</Text>
        </View>
      </View>

      {/* Accuracy Tips */}
      <Text style={styles.sectionTitle}>Accuracy Guidelines</Text>
      <View style={styles.card}>
        <View style={styles.itemPadding}>
          <Text style={styles.itemTitle}>✅ Best Practices</Text>
          <Text style={styles.itemText}>• Frontal + side angles during registration</Text>
          <Text style={styles.itemText}>• Good ambient light with clean background</Text>
          <Text style={styles.itemText}>• Face is centered and not covered by mask/sunglasses</Text>
        </View>
        <View style={[styles.itemPadding, { borderBottomWidth: 0 }]}>
          <Text style={styles.itemTitle}>❌ Avoid</Text>
          <Text style={styles.itemText}>• Out-of-focus or moving/motion-blurred images</Text>
          <Text style={styles.itemText}>• Backlit shots (very dark faces)</Text>
          <Text style={styles.itemText}>• Cropped face edges</Text>
        </View>
      </View>

    </ScrollView>
  );
}

function GuideRow({ num, title, desc }) {
  return (
    <View style={styles.guideRow}>
      <View style={styles.numberCircle}>
        <Text style={styles.numberText}>{num}</Text>
      </View>
      <View style={styles.guideText}>
        <Text style={styles.guideTitle}>{title}</Text>
        <Text style={styles.guideDesc}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  guideRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'flex-start',
  },
  numberCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary + '15',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    marginTop: 2,
  },
  numberText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: FONT_SIZES.sm,
  },
  guideText: {
    flex: 1,
  },
  guideTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  guideDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  itemPadding: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  itemText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
