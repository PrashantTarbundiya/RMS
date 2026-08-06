import React, { useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Text, TextInput, Snackbar, Switch } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, APPLE_GLASS_STYLE } from '../theme';
import { setServerUrl, getServerUrl, checkHealth, saveConfig } from '../services/api';
import { getLocalSettings, saveLocalSettings, syncSettingsWithServer } from '../services/settings';
import BackgroundOrbs from '../components/BackgroundOrbs';

export default function SettingsScreen() {
  const [serverUrl, setServerUrlState] = useState('');
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [testing, setTesting] = useState(false);
  const [snackVisible, setSnackVisible] = useState(false);
  const [responseTime, setResponseTime] = useState(null);

  // Model & Display Settings State
  const [showConfidence, setShowConfidence] = useState(true);
  const [enableDeepFace, setEnableDeepFace] = useState(false);
  const [confirmThreshold, setConfirmThreshold] = useState(0.55);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    try {
      setServerUrlState(getServerUrl().replace('/api', ''));
    } catch {}

    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const settings = await syncSettingsWithServer();
      setShowConfidence(settings.showConfidence);
      setEnableDeepFace(settings.enableDeepFace);
      setConfirmThreshold(settings.confirmThreshold);
    } catch (e) {
      console.warn('Failed to load settings', e);
    }
  }

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
        loadSettings();
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

  const handleToggleConfidence = async (val) => {
    setShowConfidence(val);
    await saveLocalSettings({ showConfidence: val });
  };

  const handleToggleDeepFace = async (val) => {
    setEnableDeepFace(val);
    await saveLocalSettings({ enableDeepFace: val });
    if (connectionStatus?.ok) {
      try {
        await saveConfig({ ENABLE_DEEPFACE: val });
      } catch (e) {}
    }
  };

  const THRESHOLD_MIN = 0.20;
  const THRESHOLD_MAX = 0.90;

  const setThresholdTo = useCallback((value) => {
    const clamped = Math.max(THRESHOLD_MIN, Math.min(THRESHOLD_MAX, parseFloat(value.toFixed(2))));
    setConfirmThreshold(clamped);
  }, []);

  const stepThreshold = useCallback((delta) => {
    setConfirmThreshold(prev => {
      return Math.max(THRESHOLD_MIN, Math.min(THRESHOLD_MAX, parseFloat((prev + delta).toFixed(2))));
    });
  }, []);

  const handleSaveModelSettings = async () => {
    setSavingSettings(true);
    try {
      await saveLocalSettings({
        showConfidence,
        enableDeepFace,
        confirmThreshold,
      });

      if (connectionStatus?.ok) {
        await saveConfig({
          CONFIRM_THRESHOLD: confirmThreshold,
          ENABLE_DEEPFACE: enableDeepFace,
        });
      }

      setConnectionStatus({ ok: true, message: 'Recognition settings saved!' });
      setSnackVisible(true);
    } catch (err) {
      setConnectionStatus({ ok: false, message: 'Failed to save settings: ' + err.message });
      setSnackVisible(true);
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary }}>
      <BackgroundOrbs />

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

        {/* Model & Display Preferences Card */}
        <Text style={styles.sectionHeaderTitle}>RECOGNITION PREFERENCES</Text>
        <View style={styles.appleGlassCard}>

          {/* Show Confidence Switch */}
          <View style={styles.settingRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <View style={styles.settingHeader}>
                <MaterialCommunityIcons name="percent-outline" size={18} color={COLORS.appleBlue} />
                <Text style={styles.settingTitle}>Show Confidence Scores</Text>
              </View>
              <Text style={styles.settingDesc}>
                Display confidence percentages (e.g. 85.4%) on recognition screens
              </Text>
            </View>
            <Switch
              value={showConfidence}
              onValueChange={handleToggleConfidence}
              color={COLORS.appleBlue}
            />
          </View>

          <View style={styles.divider} />

          {/* Enable DeepFace Switch */}
          <View style={styles.settingRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <View style={styles.settingHeader}>
                <MaterialCommunityIcons name="brain" size={18} color={COLORS.applePurple} />
                <Text style={styles.settingTitle}>Enable DeepFace Model</Text>
              </View>
              <Text style={styles.settingDesc}>
                Facenet512 embedding check alongside MobileNetV2
              </Text>
            </View>
            <Switch
              value={enableDeepFace}
              onValueChange={handleToggleDeepFace}
              color={COLORS.applePurple}
            />
          </View>

          <View style={styles.divider} />

          {/* Threshold Control */}
          <View style={{ marginTop: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <View style={styles.settingHeader}>
                <MaterialCommunityIcons name="tune-vertical" size={18} color={COLORS.appleBlue} />
                <Text style={styles.settingTitle}>Distance Cutoff Threshold</Text>
              </View>
              <View style={styles.thresholdBadge}>
                <Text style={styles.thresholdBadgeText}>{confirmThreshold.toFixed(2)}</Text>
              </View>
            </View>
            <Text style={styles.settingDesc}>
              Lower = Stricter, Higher = Lenient. Default standard cutoff is 0.55.
            </Text>

            {/* Visual Track */}
            <View style={styles.thresholdControlRow}>
              <TouchableOpacity style={styles.stepBtn} onPress={() => stepThreshold(-0.05)} activeOpacity={0.6}>
                <MaterialCommunityIcons name="minus" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>

              <View style={styles.trackOuter}>
                <View style={[styles.trackFill, { width: `${((confirmThreshold - 0.20) / 0.70) * 100}%` }]} />
                <View style={[styles.trackThumb, { left: `${((confirmThreshold - 0.20) / 0.70) * 100}%` }]} />
              </View>

              <TouchableOpacity style={styles.stepBtn} onPress={() => stepThreshold(0.05)} activeOpacity={0.6}>
                <MaterialCommunityIcons name="plus" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Preset Chips */}
            <View style={styles.presetsRow}>
              {[
                { val: 0.30, label: 'Strict', color: COLORS.appleRed },
                { val: 0.45, label: 'Balanced', color: COLORS.appleOrange },
                { val: 0.55, label: 'Standard', color: COLORS.appleBlue },
                { val: 0.70, label: 'Relaxed', color: COLORS.appleGreen },
              ].map(p => {
                const active = Math.abs(confirmThreshold - p.val) < 0.01;
                return (
                  <TouchableOpacity
                    key={p.val}
                    style={[styles.presetChip, active && { backgroundColor: p.color + '25', borderColor: p.color + '60' }]}
                    onPress={() => setThresholdTo(p.val)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.presetDot, { backgroundColor: active ? p.color : COLORS.textTertiary }]} />
                    <Text style={[styles.presetChipText, active && { color: p.color, fontWeight: '800' }]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.saveSettingsBtn}
              onPress={handleSaveModelSettings}
              disabled={savingSettings}
            >
              {savingSettings ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialCommunityIcons name="content-save-outline" size={18} color="#FFF" />
                  <Text style={styles.saveSettingsBtnText}>Save Preferences</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

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
  scrollContent: { padding: SPACING.md, paddingBottom: 100 },
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
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  settingHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingTitle: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 14 },
  settingDesc: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4, lineHeight: 16 },
  thresholdBadge: {
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12,
    backgroundColor: 'rgba(10, 132, 255, 0.15)', borderWidth: 1, borderColor: 'rgba(10, 132, 255, 0.35)',
  },
  thresholdBadgeText: { color: COLORS.appleBlue, fontWeight: '800', fontSize: 13, fontFamily: 'monospace' },
  thresholdControlRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: SPACING.md, marginBottom: SPACING.md },
  stepBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  trackOuter: {
    flex: 1, height: 6, borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative', justifyContent: 'center',
  },
  trackFill: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    borderRadius: 3, backgroundColor: COLORS.appleBlue,
  },
  trackThumb: {
    position: 'absolute', width: 16, height: 16, borderRadius: 8,
    backgroundColor: COLORS.appleBlue, borderWidth: 2.5, borderColor: '#FFF',
    marginLeft: -8, top: -5,
    elevation: 4, shadowColor: COLORS.appleBlue, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4,
  },
  presetsRow: { flexDirection: 'row', gap: 6, marginBottom: SPACING.sm },
  presetChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 8, borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  presetDot: { width: 6, height: 6, borderRadius: 3 },
  presetChipText: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '600' },
  saveSettingsBtn: {
    backgroundColor: COLORS.appleBlue, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 12, justifyContent: 'center', alignItems: 'center', marginTop: 4,
  },
  saveSettingsBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
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
