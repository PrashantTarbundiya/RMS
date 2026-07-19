import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { Text, ActivityIndicator, IconButton, Snackbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, APPLE_GLASS_STYLE } from '../theme';
import { getPersons, exportOnnx, resetModels, downloadModelFile, pingServer } from '../services/api';
import CustomDialog from '../components/CustomDialog';

export default function ModelsScreen({ navigation }) {
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const [serverOnline, setServerOnline] = useState(null);
  const [status, setStatus] = useState(null);
  const [snackVisible, setSnackVisible] = useState(false);
  const [resetDialogVisible, setResetDialogVisible] = useState(false);

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
      const online = await pingServer();
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

  async function handleDownload(filename) {
    setDownloading(filename);
    try {
      const uri = await downloadModelFile(filename);
      showStatus('success', `Downloaded ${filename} to device`);
    } catch (err) {
      showStatus('error', `Failed to download ${filename}: ${err.message}`);
    } finally {
      setDownloading(null);
    }
  }

  function handleReset() {
    setResetDialogVisible(true);
  }

  async function confirmReset() {
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
      <View style={styles.appleWallpaperOrbPurple} />

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

        {/* Model Cards Showcase */}
        <Text style={styles.sectionHeaderTitle}>NEURAL MODELS</Text>

        <View style={styles.appleGlassCard}>
          <View style={styles.modelHeaderRow}>
            <View style={styles.modelIconBox}>
              <MaterialCommunityIcons name="brain" size={22} color={COLORS.appleBlue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.modelTitle}>DeepFace (Facenet512)</Text>
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
              <Text style={styles.modelTitle}>SOTA MobileNetV2</Text>
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
        onConfirm={confirmReset}
        onCancel={() => setResetDialogVisible(false)}
        type="confirm"
        confirmText="Delete Everything"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: SPACING.md },
  appleWallpaperOrbPurple: {
    position: 'absolute', top: -60, right: -60,
    width: 250, height: 250, borderRadius: 125,
    backgroundColor: 'rgba(94, 44, 165, 0.25)',
  },
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
  modelHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modelIconBox: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    borderWidth: 1, borderColor: 'rgba(10, 132, 255, 0.35)',
    justifyContent: 'center', alignItems: 'center',
  },
  modelTitle: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 15 },
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
