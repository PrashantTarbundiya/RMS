import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, Linking,
} from 'react-native';
import { Text, TextInput, Snackbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, APPLE_GLASS_STYLE } from '../theme';
import { setServerUrl, getServerUrl, checkHealth } from '../services/api';

export default function SettingsScreen() {
  const [serverUrl, setServerUrlState] = useState('');
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [testing, setTesting] = useState(false);
  const [snackVisible, setSnackVisible] = useState(false);
  const [responseTime, setResponseTime] = useState(null);

  useEffect(() => {
    try {
      setServerUrlState(getServerUrl().replace('/api', ''));
    } catch {}
  }, []);

  async function testConnection() {
    setTesting(true);
    setConnectionStatus(null);
    setResponseTime(null);

    const url = serverUrl.trim();
    if (!url) {
      setConnectionStatus({ ok: false, message: 'Enter a server URL first' });
      setTesting(false);
      setSnackVisible(true);
      return;
    }

    setServerUrl(url);
    const startTime = Date.now();

    try {
      const response = await checkHealth();
      const online = !!response;
      const elapsed = Date.now() - startTime;
      setResponseTime(elapsed);
      if (online) {
        setConnectionStatus({ ok: true, message: `Connected in ${elapsed}ms` });
      } else {
        setConnectionStatus({ ok: false, message: 'Server not responding. Check IP & port.' });
      }
    } catch (err) {
      setConnectionStatus({ ok: false, message: 'Connection error: ' + err.message });
    } finally {
      setTesting(false);
      setSnackVisible(true);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary }}>
      <View style={styles.appleWallpaperOrbPurple} />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Server Connection Card */}
        <Text style={styles.sectionHeaderTitle}>SERVER CONNECTION</Text>
        <View style={styles.appleGlassCard}>
          {/* Connection Status Indicator */}
          <View style={styles.connectionHeader}>
            <View style={[styles.bigStatusDot, {
              backgroundColor: connectionStatus?.ok ? COLORS.appleGreen
                : connectionStatus === null ? COLORS.textTertiary
                : COLORS.appleRed,
            }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.connectionTitle}>
                {connectionStatus?.ok ? 'Connected' : connectionStatus === null ? 'Not Tested' : 'Disconnected'}
              </Text>
              {responseTime && connectionStatus?.ok && (
                <Text style={{ color: COLORS.appleGreen, fontSize: 11, fontWeight: '600' }}>
                  Latency: {responseTime}ms
                </Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.inputHeaderLabel}>FLASK SERVER URL</Text>
          <TextInput
            mode="outlined"
            value={serverUrl}
            onChangeText={setServerUrlState}
            placeholder="http://192.168.1.100:5000"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            left={<TextInput.Icon icon="server-network" color={COLORS.appleBlue} />}
            outlineColor="rgba(255, 255, 255, 0.15)"
            activeOutlineColor={COLORS.appleBlue}
            textColor={COLORS.textPrimary}
            placeholderTextColor={COLORS.textTertiary}
            style={styles.glassInput}
            theme={{ colors: { onSurfaceVariant: COLORS.textSecondary } }}
          />

          <TouchableOpacity
            onPress={testConnection}
            disabled={testing}
            style={[styles.appleActionButton, testing && { opacity: 0.5 }]}
          >
            {testing ? (
              <Text style={styles.actionButtonText}>Testing...</Text>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="lan-connect" size={18} color="#FFF" />
                <Text style={styles.actionButtonText}>Test Connection</Text>
              </View>
            )}
          </TouchableOpacity>

          {connectionStatus && (
            <View style={[styles.statusBanner, {
              backgroundColor: connectionStatus.ok ? 'rgba(48, 209, 88, 0.12)' : 'rgba(255, 69, 58, 0.12)',
              borderColor: connectionStatus.ok ? 'rgba(48, 209, 88, 0.30)' : 'rgba(255, 69, 58, 0.30)',
            }]}>
              <MaterialCommunityIcons
                name={connectionStatus.ok ? 'check-circle-outline' : 'alert-circle-outline'}
                size={16}
                color={connectionStatus.ok ? COLORS.appleGreen : COLORS.appleRed}
              />
              <Text style={{
                color: connectionStatus.ok ? COLORS.appleGreen : COLORS.appleRed,
                fontSize: 12, fontWeight: '600', flex: 1, marginLeft: 8,
              }}>
                {connectionStatus.message}
              </Text>
            </View>
          )}
        </View>

        {/* IP Help */}
        <Text style={styles.sectionHeaderTitle}>FIND YOUR COMPUTER IP</Text>
        <View style={styles.appleGlassCard}>
          <HelpStep
            platform="Windows"
            icon="microsoft-windows"
            command='Open CMD → type "ipconfig"'
            detail="Look for IPv4 Address under WiFi adapter"
          />
          <View style={styles.divider} />
          <HelpStep
            platform="Mac / Linux"
            icon="apple"
            command='Terminal → type "ifconfig"'
            detail="Look for inet address under en0 or wlan0"
          />
          <View style={styles.divider} />
          <View style={styles.helpNote}>
            <MaterialCommunityIcons name="information-outline" size={14} color={COLORS.appleBlue} />
            <Text style={styles.helpNoteText}>
              Default Flask port is <Text style={{ color: COLORS.appleBlue, fontWeight: '700' }}>5000</Text>. 
              Both devices must be on the same WiFi network.
            </Text>
          </View>
        </View>

        {/* About */}
        <Text style={styles.sectionHeaderTitle}>ABOUT</Text>
        <View style={styles.appleGlassCard}>
          <AboutRow icon="application-outline" label="App" value="RMS Face AI" />
          <View style={styles.divider} />
          <AboutRow icon="tag-outline" label="Version" value="1.0.0" />
          <View style={styles.divider} />
          <AboutRow icon="brain" label="Models" value="MobileNetV2" />
          <View style={styles.divider} />
          <AboutRow icon="react" label="Frontend" value="Expo SDK 54 + React Native" />
          <View style={styles.divider} />
          <AboutRow icon="language-python" label="Backend" value="Flask + PyTorch" />
        </View>

        {/* Quick Start */}
        <Text style={styles.sectionHeaderTitle}>QUICK START</Text>
        <View style={styles.appleGlassCard}>
          <StepItem num="1" text="Start Flask server on your PC (run start.bat)" />
          <StepItem num="2" text="Enter your PC's IP address above & test connection" />
          <StepItem num="3" text="Go to Register tab to add face photos" />
          <StepItem num="4" text="Use Scan tab to recognize faces" isLast />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <Snackbar
        visible={snackVisible}
        onDismiss={() => setSnackVisible(false)}
        duration={3000}
        style={{
          backgroundColor: connectionStatus?.ok ? COLORS.successContainer : COLORS.errorContainer,
          borderWidth: 1,
          borderColor: connectionStatus?.ok ? COLORS.success + '40' : COLORS.error + '40',
        }}
      >
        <Text style={{ color: connectionStatus?.ok ? COLORS.appleGreen : COLORS.appleRed, fontWeight: '700', fontSize: 12 }}>
          {connectionStatus?.message}
        </Text>
      </Snackbar>
    </View>
  );
}

function AboutRow({ icon, label, value }) {
  return (
    <View style={styles.aboutRow}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <MaterialCommunityIcons name={icon} size={16} color={COLORS.appleBlue} />
        <Text style={styles.aboutLabel}>{label}</Text>
      </View>
      <Text style={styles.aboutValue}>{value}</Text>
    </View>
  );
}

function HelpStep({ platform, icon, command, detail }) {
  return (
    <View style={styles.helpStepRow}>
      <MaterialCommunityIcons name={icon} size={18} color={COLORS.textSecondary} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.helpPlatform}>{platform}</Text>
        <Text style={styles.helpCommand}>{command}</Text>
        <Text style={styles.helpDetail}>{detail}</Text>
      </View>
    </View>
  );
}

function StepItem({ num, text, isLast }) {
  return (
    <View style={[styles.stepRow, isLast && { marginBottom: 0 }]}>
      <View style={styles.stepCircle}>
        <Text style={styles.stepNum}>{num}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: SPACING.md },
  appleWallpaperOrbPurple: {
    position: 'absolute', top: -50, left: -50,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: 'rgba(94, 44, 165, 0.22)',
  },
  sectionHeaderTitle: {
    color: COLORS.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1,
    marginTop: SPACING.xs, marginBottom: SPACING.sm,
  },
  appleGlassCard: { ...APPLE_GLASS_STYLE, padding: SPACING.md, marginBottom: SPACING.md },
  connectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: SPACING.sm },
  bigStatusDot: { width: 14, height: 14, borderRadius: 7 },
  connectionTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  divider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.06)', marginVertical: SPACING.sm },
  inputHeaderLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6 },
  glassInput: { backgroundColor: 'rgba(255, 255, 255, 0.04)', marginBottom: SPACING.md },
  appleActionButton: {
    backgroundColor: COLORS.appleBlue, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 13, justifyContent: 'center', alignItems: 'center',
  },
  actionButtonText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.sm, borderRadius: 12, borderWidth: 1, marginTop: SPACING.md,
  },
  helpStepRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 4 },
  helpPlatform: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 13 },
  helpCommand: { color: COLORS.appleBlue, fontSize: 12, fontWeight: '600', marginTop: 2 },
  helpDetail: { color: COLORS.textTertiary, fontSize: 11, marginTop: 1 },
  helpNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 4 },
  helpNoteText: { color: COLORS.textSecondary, fontSize: 12, flex: 1, lineHeight: 16 },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  aboutLabel: { color: COLORS.textSecondary, fontSize: 13 },
  aboutValue: { color: COLORS.textPrimary, fontWeight: '600', fontSize: 13, maxWidth: '55%', textAlign: 'right' },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: SPACING.sm },
  stepCircle: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(10, 132, 255, 0.15)', borderWidth: 1, borderColor: 'rgba(10, 132, 255, 0.30)',
    justifyContent: 'center', alignItems: 'center', marginTop: 1,
  },
  stepNum: { color: COLORS.appleBlue, fontWeight: '700', fontSize: 11 },
  stepText: { color: COLORS.textSecondary, fontSize: 13, flex: 1, lineHeight: 18 },
});
