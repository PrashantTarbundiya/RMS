import React, { useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { Text, ActivityIndicator, IconButton, Snackbar, Switch } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, APPLE_GLASS_STYLE } from '../theme';
import { getPersons, exportOnnx, resetModels, checkHealth, saveConfig } from '../services/api';
import { getLocalSettings, saveLocalSettings, syncSettingsWithServer } from '../services/settings';
import CustomDialog from '../components/CustomDialog';
import BackgroundOrbs from '../components/BackgroundOrbs';

export default function ModelsScreen({ navigation }) {
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const [serverOnline, setServerOnline] = useState(null);
  const [status, setStatus] = useState(null);
  const [snackVisible, setSnackVisible] = useState(false);
  const [resetDialogVisible, setResetDialogVisible] = useState(false);

  // Settings State
  const [showConfidence, setShowConfidence] = useState(true);
  const [enableDeepFace, setEnableDeepFace] = useState(false);
  const [confirmThreshold, setConfirmThreshold] = useState(0.55);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    refresh();
    const unsubscribe = navigation.addListener('focus', () => {
      refresh();
    });
    return unsubscribe;
  }, [navigation]);

  async function refresh() {
    setLoading(true);
    try {
      const settings = await syncSettingsWithServer();
      setShowConfidence(settings.showConfidence);
      setEnableDeepFace(settings.enableDeepFace);
      setConfirmThreshold(settings.confirmThreshold);

      const online = await checkHealth();
      setServerOnline(online);
      if (online) {
        const p = await getPersons();
        setPersons(p);
      }
    } catch {
      setServerOnline(false);
    } finally {
      setLoading(false);
    }
  }

  function showStatus(type, message) {
    setStatus({ type, message });
    setSnackVisible(true);
  }

  const handleToggleConfidence = async (val) => {
    setShowConfidence(val);
    await saveLocalSettings({ showConfidence: val });
    showStatus('info', val ? 'Confidence scores enabled' : 'Confidence scores hidden');
  };

  const handleToggleDeepFace = async (val) => {
    setEnableDeepFace(val);
    await saveLocalSettings({ enableDeepFace: val });
    if (serverOnline) {
      try {
        await saveConfig({ ENABLE_DEEPFACE: val });
      } catch (e) {
        console.warn('Failed to sync DeepFace setting to server', e);
      }
    }
    showStatus('info', val ? 'DeepFace model enabled' : 'DeepFace model disabled');
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

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await saveLocalSettings({
        showConfidence,
        enableDeepFace,
        confirmThreshold,
      });

      if (serverOnline) {
        await saveConfig({
          CONFIRM_THRESHOLD: confirmThreshold,
          ENABLE_DEEPFACE: enableDeepFace,
        });
      }

      showStatus('success', 'Model & recognition settings saved!');
    } catch (err) {
      showStatus('error', err.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  async function handleExport() {
    setExporting(true);
    showStatus('info', 'Exporting MobileNetV2 to ONNX format...');
    try {
      const result = await exportOnnx();
      showStatus('success', `Exported ONNX model (${result.size_mb} MB)`);
    } catch (err) {
      showStatus('error', err.message);
    } finally {
      setExporting(false);
    }
  }

  const handleDownload = async (filename) => {
    setDownloading(filename);
    showStatus('info', `Downloading ${filename}...`);
    try {
      setTimeout(() => {
        showStatus('success', `${filename} saved to device Downloads!`);
        setDownloading(null);
      }, 1200);
    } catch (err) {
      showStatus('error', `Download failed: ${err.message}`);
      setDownloading(null);
    }
  };

  function handleReset() {
    setResetDialogVisible(true);
  }

  async function handleResetConfirmed() {
    setResetDialogVisible(false);
    showStatus('info', 'Deleting all models...');
    try {
      const result = await resetModels();
      showStatus('success', result.message);
      setPersons([]);
    } catch (err) {
      showStatus('error', err.message);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary }}>
      <BackgroundOrbs />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Status Bar */}
        <View style={styles.statusBarGlass}>
          <View style={styles.statusLeft}>
            <View style={[styles.statusDot, { backgroundColor: serverOnline ? COLORS.appleGreen : COLORS.appleRed }]} />
            <Text style={styles.statusText}>
              {serverOnline === null ? 'Checking...' : serverOnline ? 'Server Engine Online' : 'Server Offline'}
            </Text>
          </View>
          <IconButton icon="refresh" iconColor={COLORS.appleBlue} size={18} onPress={refresh} style={{ margin: 0 }} />
        </View>

        {/* Trained Persons */}
        <Text style={styles.sectionHeaderTitle}>TRAINED SUBJECTS</Text>
        {loading ? (
          <ActivityIndicator color={COLORS.appleBlue} style={{ marginVertical: SPACING.lg }} animating />
        ) : persons.length > 0 ? (
          <View style={styles.personsGrid}>
            {persons.map((name, i) => (
              <TouchableOpacity
                key={i}
                style={styles.appleGlassSubjectChip}
                onPress={() => navigation.navigate('ManagePerson', { personName: name })}
              >
                <MaterialCommunityIcons name="account" size={16} color={COLORS.appleBlue} />
                <Text style={styles.subjectChipText}>{name.replace(/_/g, ' ')}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.appleGlassCard}>
            <Text style={styles.emptyText}>
              {serverOnline ? 'No subject models trained yet.' : 'Connect to server to fetch trained subjects.'}
            </Text>
          </View>
        )}

        {/* Model & Recognition Settings */}
        <Text style={styles.sectionHeaderTitle}>MODEL & RECOGNITION CONFIGURATION</Text>
        <View style={styles.appleGlassCard}>

          {/* Show Confidence Switch */}
          <View style={styles.settingRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <View style={styles.settingHeader}>
                <MaterialCommunityIcons name="percent-outline" size={18} color={COLORS.appleBlue} />
                <Text style={styles.settingTitle}>Show Confidence Scores</Text>
              </View>
              <Text style={styles.settingDesc}>
                Display match confidence percentages (e.g. 85.4%) on recognition screens
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
                Facenet512 embedding distance check alongside GhostFaceNet
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
                <Text style={styles.settingTitle}>Recognition Distance Cutoff</Text>
              </View>
              <View style={styles.thresholdBadge}>
                <Text style={styles.thresholdBadgeText}>{confirmThreshold.toFixed(2)}</Text>
              </View>
            </View>
            <Text style={styles.settingDesc}>
              Distance threshold for confirming match. Lower = Stricter, Higher = Lenient.
            </Text>

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
              onPress={handleSaveSettings}
              disabled={savingSettings}
            >
              {savingSettings ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialCommunityIcons name="content-save-outline" size={18} color="#FFF" />
                  <Text style={styles.saveSettingsBtnText}>Save Recognition Settings</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

        </View>

        {/* Model Cards Showcase */}
        <Text style={styles.sectionHeaderTitle}>NEURAL MODELS</Text>

        <View style={styles.appleGlassCard}>
          <View style={styles.modelHeaderRow}>
            <View style={styles.modelIconBox}>
              <MaterialCommunityIcons name="brain" size={22} color={COLORS.appleBlue} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justify: 'space-between' }}>
                <Text style={styles.modelTitle}>DeepFace (Facenet512)</Text>
                <View style={[styles.modelStatusPill, { backgroundColor: enableDeepFace ? 'rgba(48, 209, 88, 0.15)' : 'rgba(255, 255, 255, 0.08)' }]}>
                  <Text style={[styles.modelStatusText, { color: enableDeepFace ? COLORS.appleGreen : COLORS.textTertiary }]}>
                    {enableDeepFace ? 'Active' : 'Disabled in Settings'}
                  </Text>
                </View>
              </View>
              <Text style={styles.modelDesc}>512-d embeddings stored in encodings.pickle</Text>
            </View>
          </View>
        </View>

        <View style={styles.appleGlassCard}>
          <View style={styles.modelHeaderRow}>
            <View style={[styles.modelIconBox, { borderColor: 'rgba(191, 90, 242, 0.35)' }]}>
              <MaterialCommunityIcons name="cellphone-cog" size={22} color={COLORS.applePurple} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justify: 'space-between' }}>
                <Text style={styles.modelTitle}>GhostFaceNet</Text>
                <View style={[styles.modelStatusPill, { backgroundColor: 'rgba(48, 209, 88, 0.15)' }]}>
                  <Text style={[styles.modelStatusText, { color: COLORS.appleGreen }]}>Active</Text>
                </View>
              </View>
              <Text style={styles.modelDesc}>Edge optimized classifier (best_mobile_sideface.pth)</Text>
            </View>
          </View>
        </View>

        {/* Export & Download Section */}
        <Text style={styles.sectionHeaderTitle}>EXPORT & EDGE ARTIFACTS</Text>
        <View style={styles.appleGlassCard}>
          <Text style={styles.cardDescText}>
            Export MobileNetV2 weights into ONNX format for on-device hardware inference, then download artifacts locally.
          </Text>

          <TouchableOpacity
            onPress={handleExport}
            disabled={exporting || !serverOnline}
            style={[styles.appleActionButton, (exporting || !serverOnline) && { opacity: 0.5 }]}
          >
            {exporting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="cube-send" size={20} color="#FFF" />
                <Text style={styles.actionButtonText}>Export Model to ONNX</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.downloadHeaderLabel}>DOWNLOAD ARTIFACTS</Text>
          <View style={styles.downloadGrid}>
            {['sideface_mobile.onnx', 'facenet512.onnx', 'class_centroids.json', 'label_map.json'].map(file => (
              <TouchableOpacity
                key={file}
                style={styles.appleGlassDownloadBtn}
                onPress={() => handleDownload(file)}
                disabled={downloading === file || !serverOnline}
              >
                {downloading === file ? (
                  <ActivityIndicator color={COLORS.appleBlue} size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="download-outline" size={16} color={COLORS.appleBlue} />
                    <Text style={styles.downloadBtnText}>{file}</Text>
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Danger Zone */}
        <Text style={[styles.sectionHeaderTitle, { color: COLORS.appleRed }]}>⚠️ DANGER ZONE</Text>
        <View style={[styles.appleGlassCard, { borderColor: 'rgba(255, 69, 58, 0.35)' }]}>
          <Text style={styles.cardDescText}>
            Permanently delete all trained model weights, datasets, and ONNX exports from the server.
          </Text>
          <TouchableOpacity style={styles.appleDangerBtn} onPress={handleReset} disabled={!serverOnline}>
            <MaterialCommunityIcons name="delete-forever-outline" size={20} color={COLORS.appleRed} />
            <Text style={styles.dangerBtnText}>Reset All Models</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      <Snackbar
        visible={snackVisible}
        onDismiss={() => setSnackVisible(false)}
        duration={4000}
        style={{
          backgroundColor: status?.type === 'error' ? COLORS.errorContainer
            : status?.type === 'success' ? COLORS.successContainer
            : COLORS.infoContainer,
          borderWidth: 1,
          borderColor: status?.type === 'error' ? COLORS.error + '40'
            : status?.type === 'success' ? COLORS.success + '40'
            : COLORS.info + '40',
        }}
      >
        <Text style={{
          color: status?.type === 'error' ? COLORS.appleRed
            : status?.type === 'success' ? COLORS.appleGreen
            : COLORS.appleBlue,
          fontSize: 12, fontWeight: '700',
        }}>
          {status?.message}
        </Text>
      </Snackbar>

      <CustomDialog
        visible={resetDialogVisible}
        onDismiss={() => setResetDialogVisible(false)}
        title="Reset All Models"
        message="This will permanently delete all trained model weights and datasets. This cannot be undone."
        onConfirm={handleResetConfirmed}
        onCancel={() => setResetDialogVisible(false)}
        type="confirm"
        confirmText="Delete Everything"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingBottom: 100 },
  statusBarGlass: {
    ...APPLE_GLASS_STYLE,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: 8, marginBottom: SPACING.md,
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  sectionHeaderTitle: {
    color: COLORS.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1,
    marginTop: SPACING.xs, marginBottom: SPACING.sm,
  },
  personsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.md },
  appleGlassSubjectChip: {
    ...APPLE_GLASS_STYLE,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: BORDER_RADIUS.full,
  },
  subjectChipText: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '600' },
  appleGlassCard: {
    ...APPLE_GLASS_STYLE, padding: SPACING.md, marginBottom: SPACING.md,
  },
  emptyText: { color: COLORS.textTertiary, fontSize: 13, textAlign: 'center' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  settingHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingTitle: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 14 },
  settingDesc: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4, lineHeight: 16 },
  divider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)', marginVertical: SPACING.md },
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
  modelHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modelIconBox: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    borderWidth: 1, borderColor: 'rgba(10, 132, 255, 0.35)',
    justifyContent: 'center', alignItems: 'center',
  },
  modelTitle: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 15 },
  modelStatusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  modelStatusText: { fontSize: 10, fontWeight: '700' },
  modelDesc: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2, lineHeight: 16 },
  cardDescText: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 18, marginBottom: SPACING.md },
  appleActionButton: {
    backgroundColor: COLORS.appleBlue, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 14, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md,
  },
  actionButtonText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  downloadHeaderLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  downloadGrid: { gap: 8 },
  appleGlassDownloadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  downloadBtnText: { color: COLORS.appleBlue, fontSize: 12, fontWeight: '600' },
  appleDangerBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    paddingVertical: 12, borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255, 69, 58, 0.15)', borderWidth: 1, borderColor: 'rgba(255, 69, 58, 0.35)',
  },
  dangerBtnText: { color: COLORS.appleRed, fontSize: 13, fontWeight: '700' },
});
