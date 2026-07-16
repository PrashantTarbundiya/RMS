import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme';
import { getPersons, exportOnnx, resetModels, downloadModelFile, pingServer } from '../services/api';

export default function ModelsScreen({ navigation }) {
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const [serverOnline, setServerOnline] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    refresh();
    
    // Auto-refresh when screen comes into focus
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

  async function handleExport() {
    setExporting(true);
    setStatus({ type: 'info', message: 'Exporting MobileNetV2 to ONNX format...' });
    try {
      const result = await exportOnnx();
      setStatus({ type: 'success', message: `Exported ONNX model (${result.size_mb} MB)` });
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setExporting(false);
    }
  }

  async function handleDownload(filename) {
    setDownloading(filename);
    try {
      const uri = await downloadModelFile(filename);
      setStatus({ type: 'success', message: `Downloaded ${filename} to device` });
    } catch (err) {
      setStatus({ type: 'error', message: `Failed to download ${filename}: ${err.message}` });
    } finally {
      setDownloading(null);
    }
  }

  function handleReset() {
    Alert.alert(
      'Reset All Models',
      'This will permanently delete all trained model weights and datasets. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            setStatus({ type: 'info', message: 'Deleting all models...' });
            try {
              const result = await resetModels();
              setStatus({ type: 'success', message: result.message });
              setPersons([]);
            } catch (err) {
              setStatus({ type: 'error', message: err.message });
            }
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Server Status */}
      <View style={styles.statusBar}>
        <View style={[styles.statusDot, { backgroundColor: serverOnline ? COLORS.success : COLORS.danger }]} />
        <Text style={styles.statusText}>
          {serverOnline === null ? 'Checking...' : serverOnline ? 'Server Online' : 'Server Offline'}
        </Text>
        <TouchableOpacity onPress={refresh} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Status Banner */}
      {status && (
        <View style={[styles.banner, {
          backgroundColor: status.type === 'error' ? 'rgba(255, 71, 87, 0.1)' :
                           status.type === 'success' ? 'rgba(46, 213, 115, 0.1)' : 'rgba(0, 240, 255, 0.1)',
          borderColor: status.type === 'error' ? COLORS.danger :
                       status.type === 'success' ? COLORS.success : COLORS.accentCyan,
        }]}>
          <Text style={[styles.bannerText, {
            color: status.type === 'error' ? COLORS.danger :
                   status.type === 'success' ? COLORS.success : COLORS.accentCyan,
          }]}>{status.message}</Text>
        </View>
      )}

      {/* Trained Persons */}
      <Text style={styles.sectionTitle}>Trained Persons</Text>
      {loading ? (
        <ActivityIndicator color={COLORS.accentCyan} style={{ marginVertical: SPACING.lg }} />
      ) : persons.length > 0 ? (
        <View style={styles.personsGrid}>
          {persons.map((name, i) => (
            <TouchableOpacity 
              key={i} 
              style={styles.personChip}
              onPress={() => navigation.navigate('ManagePerson', { personName: name })}
            >
              <Text style={styles.personAvatar}>👤</Text>
              <Text style={styles.personName}>{name.replace(/_/g, ' ')}</Text>
              <Text style={{ fontSize: 10, color: COLORS.primaryLight, marginLeft: 4 }}>✏️</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            {serverOnline ? 'No persons trained yet' : 'Connect to server to see trained persons'}
          </Text>
        </View>
      )}

      {/* Model Cards */}
      <Text style={styles.sectionTitle}>Models</Text>
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.cardIcon}>🧠</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>DeepFace (Facenet512)</Text>
            <Text style={styles.cardDesc}>512-d embeddings stored in encodings.pickle</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.cardIcon}>📱</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>SOTA MobileNetV2</Text>
            <Text style={styles.cardDesc}>Edge optimized (best_mobile_sideface.pth)</Text>
          </View>
        </View>
      </View>

      {/* Export & Download */}
      <Text style={styles.sectionTitle}>Export & Download</Text>
      <View style={styles.card}>
        <Text style={styles.cardDesc}>
          Export the MobileNetV2 model to ONNX format for edge deployment, then download the model files to this device.
        </Text>
        <TouchableOpacity
          style={[styles.actionBtn, exporting && styles.disabledBtn]}
          onPress={handleExport}
          disabled={exporting || !serverOnline}
        >
          {exporting ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <Text style={styles.actionBtnText}>📦  Export to ONNX</Text>
          )}
        </TouchableOpacity>

        <Text style={[styles.inputLabel, { marginTop: SPACING.md }]}>DOWNLOAD ARTIFACTS</Text>
        <View style={styles.downloadGrid}>
          {['sideface_mobile.onnx', 'facenet512.onnx', 'class_centroids.json', 'label_map.json'].map(file => (
            <TouchableOpacity
              key={file}
              style={styles.downloadBtn}
              onPress={() => handleDownload(file)}
              disabled={downloading === file || !serverOnline}
            >
              {downloading === file ? (
                <ActivityIndicator color={COLORS.accentCyan} size="small" />
              ) : (
                <Text style={styles.downloadBtnText}>⬇ {file}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Danger Zone */}
      <Text style={[styles.sectionTitle, { color: COLORS.danger }]}>⚠️ Danger Zone</Text>
      <View style={[styles.card, { borderColor: 'rgba(255, 71, 87, 0.3)' }]}>
        <Text style={styles.cardDesc}>
          Permanently delete all trained model weights, datasets, and ONNX exports. This cannot be undone.
        </Text>
        <TouchableOpacity style={styles.dangerBtn} onPress={handleReset} disabled={!serverOnline}>
          <Text style={styles.dangerBtnText}>🗑  Reset All Models</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.sm,
  },
  statusText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    flex: 1,
  },
  refreshBtn: { padding: SPACING.xs },
  refreshText: { fontSize: 18, color: COLORS.accentCyan },
  banner: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  bannerText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  personsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  personChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  personAvatar: { fontSize: 16 },
  personName: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  emptyBox: {
    backgroundColor: COLORS.bgCard,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: {
    color: COLORS.textTertiary,
    fontSize: FONT_SIZES.sm,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  cardIcon: { fontSize: 28 },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  cardDesc: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
    lineHeight: 20,
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
  },
  actionBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  actionBtnText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  disabledBtn: { opacity: 0.5 },
  downloadGrid: {
    gap: SPACING.sm,
  },
  downloadBtn: {
    backgroundColor: COLORS.bgCardHover,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  downloadBtnText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  dangerBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  dangerBtnText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
});
