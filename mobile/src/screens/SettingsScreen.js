import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, Alert, Linking,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, API_CONFIG } from '../theme';
import { setServerUrl, getServerUrl, pingServer } from '../services/api';

const STORAGE_KEY = '@rms_server_url';

export default function SettingsScreen() {
  const [serverUrl, setServerUrlState] = useState('');
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadSavedUrl();
  }, []);

  async function loadSavedUrl() {
    try {
      // AsyncStorage might not be available in blank template
      // Fall back to the default
      setServerUrlState(getServerUrl().replace('/api', ''));
    } catch {
      setServerUrlState(API_CONFIG.BASE_URL.replace('/api', ''));
    }
  }

  async function testConnection() {
    setTesting(true);
    setConnectionStatus(null);

    // Apply the URL
    const url = serverUrl.trim();
    if (!url) {
      setConnectionStatus({ ok: false, message: 'Please enter a server URL' });
      setTesting(false);
      return;
    }

    setServerUrl(url);

    try {
      const online = await pingServer();
      if (online) {
        setConnectionStatus({ ok: true, message: 'Connected successfully!' });
        // Try to save for persistence
        try {
          // If AsyncStorage is available
        } catch {}
      } else {
        setConnectionStatus({ ok: false, message: 'Server is not responding. Check the URL and ensure Flask is running.' });
      }
    } catch (err) {
      setConnectionStatus({ ok: false, message: 'Connection failed: ' + err.message });
    } finally {
      setTesting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Server Configuration */}
      <Text style={styles.sectionTitle}>Server Configuration</Text>
      <View style={styles.card}>
        <Text style={styles.cardDesc}>
          Enter the IP address of the computer running the Flask API server. Both devices must be on the same WiFi network.
        </Text>

        <Text style={styles.inputLabel}>SERVER URL</Text>
        <TextInput
          style={styles.textInput}
          placeholder="http://192.168.1.100:5000"
          placeholderTextColor={COLORS.textTertiary}
          value={serverUrl}
          onChangeText={setServerUrlState}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <View style={styles.hintBox}>
          <Text style={styles.hintTitle}>💡 How to find your computer's IP:</Text>
          <Text style={styles.hintText}>• Windows: Open CMD → type "ipconfig" → look for "IPv4 Address"</Text>
          <Text style={styles.hintText}>• Mac/Linux: Open Terminal → type "ifconfig" → look for "inet" under your WiFi</Text>
          <Text style={styles.hintText}>• The default Flask port is 5000</Text>
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, testing && styles.disabledBtn]}
          onPress={testConnection}
          disabled={testing}
        >
          <Text style={styles.primaryBtnText}>
            {testing ? '⏳ Testing...' : '🔗  Test Connection'}
          </Text>
        </TouchableOpacity>

        {connectionStatus && (
          <View style={[styles.statusBanner, {
            backgroundColor: connectionStatus.ok ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            borderColor: connectionStatus.ok ? COLORS.success : COLORS.error,
          }]}>
            <Text style={[styles.statusBannerText, {
              color: connectionStatus.ok ? COLORS.success : COLORS.error,
            }]}>
              {connectionStatus.message}
            </Text>
          </View>
        )}
      </View>

      {/* About Section */}
      <Text style={styles.sectionTitle}>About</Text>
      <View style={styles.card}>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>App Name</Text>
          <Text style={styles.aboutValue}>RMS Face AI</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Version</Text>
          <Text style={styles.aboutValue}>1.0.0</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Project</Text>
          <Text style={styles.aboutValue}>RMS Subject — Side Face Recognition</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Models</Text>
          <Text style={styles.aboutValue}>DeepFace, MobileNetV2</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Architecture</Text>
          <Text style={styles.aboutValue}>Expo + React Native</Text>
        </View>
      </View>

      {/* How to Use */}
      <Text style={styles.sectionTitle}>How to Use</Text>
      <View style={styles.card}>
        <StepItem number="1" title="Start the Server" desc="Run start.bat on your computer to launch Flask API + Web Dashboard" />
        <StepItem number="2" title="Connect Phone" desc="Enter your computer's IP in Settings above and test connection" />
        <StepItem number="3" title="Add Persons" desc="Use 'Add Person' tab to upload face photos and train models" />
        <StepItem number="4" title="Recognize Faces" desc="Use 'Recognize' tab to capture/upload a photo and identify faces" />
        <StepItem number="5" title="Export Models" desc="Use 'Models' tab to export ONNX and download for offline use" />
      </View>
    </ScrollView>
  );
}

function StepItem({ number, title, desc }) {
  return (
    <View style={styles.stepItem}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{number}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDesc}>{desc}</Text>
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
    paddingBottom: SPACING.xxl * 2,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardDesc: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  textInput: {
    backgroundColor: COLORS.bgInput,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    marginBottom: SPACING.md,
  },
  hintBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.15)',
  },
  hintTitle: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  hintText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
    lineHeight: 18,
    marginBottom: 2,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  disabledBtn: { opacity: 0.5 },
  statusBanner: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginTop: SPACING.md,
  },
  statusBannerText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  aboutLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  aboutValue: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'right',
    maxWidth: '55%',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '800',
  },
  stepTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  stepDesc: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
    lineHeight: 18,
  },
});
