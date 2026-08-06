import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, Image, Dimensions, Platform, TouchableOpacity,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Text, ActivityIndicator, IconButton } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, APPLE_GLASS_STYLE } from '../theme';
import { predictImage, checkHealth, submitFeedback } from '../services/api';
import { getLocalSettings, saveLocalSettings } from '../services/settings';
import BackgroundOrbs from '../components/BackgroundOrbs';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const THRESHOLD_MIN = 0.20;
const THRESHOLD_MAX = 0.90;

export default function RecognizeScreen() {
  const [imageUri, setImageUri] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [serverOnline, setServerOnline] = useState(null);
  const [feedbackState, setFeedbackState] = useState({});

  // Settings state
  const [showConfidence, setShowConfidence] = useState(true);
  const [customThreshold, setCustomThreshold] = useState(0.55);

  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const route = useNavigation().getState().routes.find(r => r.name === 'Recognize');

  useEffect(() => {
    checkServer();
    loadPreferences();
  }, [isFocused]);

  async function loadPreferences() {
    try {
      const settings = await getLocalSettings();
      setShowConfidence(settings.showConfidence);
      if (settings.confirmThreshold) {
        setCustomThreshold(settings.confirmThreshold);
      }
    } catch (e) {}
  }

  useEffect(() => {
    if (route?.params?.capturedImage) {
      setImageUri(route.params.capturedImage);
      setResults(null);
      navigation.setParams({ capturedImage: undefined });
    }
  }, [route?.params?.capturedImage]);

  async function checkServer() {
    try {
      await checkHealth();
      setServerOnline(true);
    } catch {
      setServerOnline(false);
    }
  }

  function openCamera() {
    navigation.navigate('CameraCapture', { returnScreen: 'Recognize' });
  }

  async function pickImage() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, aspect: [1, 1], quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setResults(null);
        setFeedbackState({});
      }
    } catch (err) { alert('Gallery Error: ' + err.message); }
  }

  async function runRecognition() {
    if (!imageUri) return;
    setLoading(true);
    setResults(null);
    setFeedbackState({});
    try {
      let predictUri = imageUri;
      if (Platform.OS === 'web' && imageUri.startsWith('data:image')) {
        const response = await fetch(imageUri);
        predictUri = URL.createObjectURL(await response.blob());
      }
      setResults(await predictImage(predictUri, { threshold: customThreshold }));
    } catch (err) { alert('Recognition Failed: ' + err.message); }
    finally { setLoading(false); }
  }

  function clearImage() {
    setImageUri(null);
    setResults(null);
    setFeedbackState({});
  }

  // ── Threshold Controls (absolute set, not delta) ──
  const setThresholdTo = useCallback(async (value) => {
    const clamped = Math.max(THRESHOLD_MIN, Math.min(THRESHOLD_MAX, parseFloat(value.toFixed(2))));
    setCustomThreshold(clamped);
    await saveLocalSettings({ confirmThreshold: clamped });
  }, []);

  const stepThreshold = useCallback(async (delta) => {
    setCustomThreshold(prev => {
      const next = Math.max(THRESHOLD_MIN, Math.min(THRESHOLD_MAX, parseFloat((prev + delta).toFixed(2))));
      saveLocalSettings({ confirmThreshold: next });
      return next;
    });
  }, []);

  async function handleFeedback(predictionId, isCorrect, predictedLabel) {
    try {
      await submitFeedback(predictionId, isCorrect, isCorrect ? predictedLabel : '');
      setFeedbackState(prev => ({ ...prev, [predictionId]: 'logged' }));
    } catch (err) {
      alert('Failed to submit feedback');
    }
  }

  // Primary result
  const topResult = results?.faces?.[0]?.predictions?.edge || results?.faces?.[0]?.predictions?.ensemble;
  const displayLabel = topResult?.label || 'Unknown';
  const displayConf = topResult?.confidence || 0;
  const confPercentText = (displayConf * 100).toFixed(1) + '%';
  const isSpoofed = displayLabel === 'SPOOF DETECTED';
  const isConfirmed = (!isSpoofed && displayConf > 0.4 && displayLabel !== 'Unknown');

  // Threshold visual track position
  const trackFillPercent = ((customThreshold - THRESHOLD_MIN) / (THRESHOLD_MAX - THRESHOLD_MIN)) * 100;
  const isNearPreset = (val) => Math.abs(customThreshold - val) < 0.01;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary }}>
      <BackgroundOrbs />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Server Status */}
        <View style={styles.statusBarGlass}>
          <View style={styles.statusLeft}>
            <View style={[styles.statusDot, {
              backgroundColor: serverOnline ? COLORS.appleGreen : serverOnline === null ? COLORS.textTertiary : COLORS.appleRed,
            }]} />
            <Text style={styles.statusText}>
              {serverOnline === null ? 'Checking...' : serverOnline ? 'Engine Online' : 'Server Offline'}
            </Text>
          </View>
          <IconButton icon="refresh" iconColor={COLORS.appleBlue} size={16} onPress={checkServer} style={{ margin: 0 }} />
        </View>

        {/* Image Preview Container */}
        <View style={[styles.cameraContainerGlass, !imageUri && { height: 200, justifyContent: 'center', alignItems: 'center' }]}>
          {imageUri ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
              <TouchableOpacity style={styles.clearBtn} onPress={clearImage}>
                <MaterialCommunityIcons name="close" size={18} color="#FFF" />
              </TouchableOpacity>
              {topResult && (
                <View style={[styles.resultOverlayBadge, {
                  backgroundColor: isSpoofed ? 'rgba(251, 191, 36, 0.92)' : isConfirmed ? 'rgba(39, 166, 68, 0.92)' : 'rgba(248, 113, 113, 0.88)',
                }]}>
                  <MaterialCommunityIcons name={isSpoofed ? 'alert-circle' : isConfirmed ? 'check-circle' : 'close-circle'} size={20} color="#FFF" />
                  <Text style={styles.resultOverlayText}>
                    {isSpoofed
                      ? 'SPOOF DETECTED'
                      : isConfirmed
                      ? `${displayLabel.replace(/_/g, ' ')}${showConfidence ? ` · ${confPercentText}` : ''}`
                      : 'NOT FOUND'}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyIconRing}>
                <MaterialCommunityIcons name="face-recognition" size={40} color={COLORS.appleBlue} />
              </View>
              <Text style={styles.emptyTitle}>Face Scanner</Text>
              <Text style={styles.emptyDesc}>Select an image or capture a photo to identify</Text>
            </View>
          )}
        </View>

        {/* ── Threshold Tuning Card ── */}
        <View style={styles.thresholdCard}>
          <View style={styles.thresholdHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.thresholdIconBox}>
                <MaterialCommunityIcons name="tune-vertical" size={16} color={COLORS.appleBlue} />
              </View>
              <Text style={styles.thresholdTitle}>Recognition Threshold</Text>
            </View>
            <View style={styles.thresholdValuePill}>
              <Text style={styles.thresholdValueText}>{customThreshold.toFixed(2)}</Text>
            </View>
          </View>

          {/* Visual Track */}
          <View style={styles.trackContainer}>
            <TouchableOpacity style={styles.stepButton} onPress={() => stepThreshold(-0.05)} activeOpacity={0.6}>
              <MaterialCommunityIcons name="minus" size={18} color={COLORS.textPrimary} />
            </TouchableOpacity>

            <View style={styles.trackOuter}>
              <View style={[styles.trackFill, { width: `${trackFillPercent}%` }]} />
              <View style={[styles.trackThumb, { left: `${trackFillPercent}%` }]} />
            </View>

            <TouchableOpacity style={styles.stepButton} onPress={() => stepThreshold(0.05)} activeOpacity={0.6}>
              <MaterialCommunityIcons name="plus" size={18} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Preset Chips */}
          <View style={styles.presetRow}>
            {[
              { val: 0.30, label: 'Strict', color: COLORS.appleRed },
              { val: 0.45, label: 'Balanced', color: COLORS.appleOrange },
              { val: 0.55, label: 'Standard', color: COLORS.appleBlue },
              { val: 0.70, label: 'Relaxed', color: COLORS.appleGreen },
            ].map(p => (
              <TouchableOpacity
                key={p.val}
                style={[styles.presetChip, isNearPreset(p.val) && { backgroundColor: p.color + '25', borderColor: p.color + '60' }]}
                onPress={() => setThresholdTo(p.val)}
                activeOpacity={0.7}
              >
                <View style={[styles.presetDot, { backgroundColor: isNearPreset(p.val) ? p.color : COLORS.textTertiary }]} />
                <Text style={[styles.presetLabel, isNearPreset(p.val) && { color: p.color, fontWeight: '800' }]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Controls */}
        {!imageUri && (
          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.controlBtn} onPress={pickImage} activeOpacity={0.7}>
              <View style={styles.controlIconCircle}>
                <MaterialCommunityIcons name="image-outline" size={22} color={COLORS.appleBlue} />
              </View>
              <Text style={styles.controlLabel}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.captureOuterRing} onPress={openCamera} activeOpacity={0.7}>
              <View style={styles.captureInnerCircle}>
                <MaterialCommunityIcons name="camera" size={28} color="#FFF" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlBtn} onPress={checkServer} activeOpacity={0.7}>
              <View style={styles.controlIconCircle}>
                <MaterialCommunityIcons name="refresh" size={22} color={COLORS.appleBlue} />
              </View>
              <Text style={styles.controlLabel}>Refresh</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Scan Action Button */}
        {imageUri && !results && (
          <TouchableOpacity
            onPress={runRecognition}
            disabled={loading || !serverOnline}
            style={[styles.scanButton, (loading || !serverOnline) && { opacity: 0.5 }]}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ActivityIndicator color="#FFF" size="small" />
                <Text style={styles.scanBtnText}>Analyzing Face…</Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="radar" size={20} color="#FFF" />
                <Text style={styles.scanBtnText}>Run Recognition</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        {imageUri && !serverOnline && (
          <Text style={styles.offlineHint}>⚠️ Server offline — check Settings</Text>
        )}

        {/* Scan Again */}
        {results && (
          <TouchableOpacity onPress={clearImage} style={styles.scanAgainBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="camera-retake-outline" size={18} color={COLORS.appleBlue} />
            <Text style={{ color: COLORS.appleBlue, fontWeight: '700', fontSize: 13 }}>Scan Another Face</Text>
          </TouchableOpacity>
        )}

        {/* Detailed Results */}
        {results && results.faces && results.faces.map((face, i) => (
          <View key={i} style={styles.resultCard}>
            {face.predictions && (() => {
               const p = face.predictions.edge || face.predictions.ensemble || {};
               const spoofed = p.label === 'SPOOF DETECTED';
               const confirmed = (!spoofed && p.confidence > 0.4 && p.label !== 'Unknown');

               let boxBg = confirmed ? 'rgba(39, 166, 68, 0.10)' : 'rgba(248, 113, 113, 0.10)';
               let boxBorder = confirmed ? 'rgba(39, 166, 68, 0.25)' : 'rgba(248, 113, 113, 0.25)';
               let iconColor = confirmed ? COLORS.appleGreen : COLORS.appleRed;
               let iconName = confirmed ? 'check-bold' : 'close-thick';

               if (spoofed) {
                 boxBg = 'rgba(251, 191, 36, 0.10)';
                 boxBorder = 'rgba(251, 191, 36, 0.25)';
                 iconColor = COLORS.appleOrange;
                 iconName = 'alert-octagon';
               }

               return (
               <View style={[styles.ensembleBox, { backgroundColor: boxBg, borderColor: boxBorder }]}>
                 <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                   <View style={{ flex: 1 }}>
                     <Text style={styles.ensembleLabel}>{spoofed ? 'LIVENESS FAILED' : confirmed ? 'IDENTITY CONFIRMED' : 'NO MATCH FOUND'}</Text>
                     <Text style={[styles.ensembleName, { color: iconColor }]}>
                       {p.label ? p.label.replace(/_/g, ' ') : 'Unknown'}
                     </Text>
                     {showConfidence && p.confidence !== undefined && (
                       <Text style={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: '700', marginTop: 4 }}>
                         Confidence: {(p.confidence * 100).toFixed(1)}%
                       </Text>
                     )}
                   </View>
                   <View style={[styles.confCircle, { borderColor: iconColor }]}>
                     <MaterialCommunityIcons name={iconName} size={24} color={iconColor} />
                   </View>
                 </View>

                 {face.prediction_id && !spoofed && (
                   <View style={styles.feedbackRow}>
                     {feedbackState[face.prediction_id] === 'logged' ? (
                       <Text style={styles.feedbackLoggedText}>✓ Feedback Logged</Text>
                     ) : (
                       <>
                         <TouchableOpacity onPress={() => handleFeedback(face.prediction_id, true, p.label)} style={styles.feedbackBtn} activeOpacity={0.7}>
                           <MaterialCommunityIcons name="thumb-up-outline" size={16} color={COLORS.appleGreen} />
                         </TouchableOpacity>
                         <TouchableOpacity onPress={() => handleFeedback(face.prediction_id, false, p.label)} style={styles.feedbackBtn} activeOpacity={0.7}>
                           <MaterialCommunityIcons name="thumb-down-outline" size={16} color={COLORS.appleRed} />
                         </TouchableOpacity>
                       </>
                     )}
                   </View>
                 )}
               </View>
               );
            })()}

            <Text style={styles.breakdownTitle}>MODEL BREAKDOWN</Text>
            {face.predictions?.edge && (
              <PredictionRow model="GhostFaceNet" icon="cellphone-cog" label={face.predictions.edge.label} confidence={face.predictions.edge.confidence} showConfidence={showConfidence} />
            )}
            {face.predictions?.deepface && (
              <PredictionRow model="InsightFace ArcFace" icon="brain" label={face.predictions.deepface.label} confidence={face.predictions.deepface.confidence} showConfidence={showConfidence} />
            )}
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function PredictionRow({ model, icon, label, confidence, showConfidence }) {
  const confPercent = (confidence * 100).toFixed(1);
  const isUntrained = label.includes('UNTRAINED') || label.includes('Not Trained') || label === 'Error';
  const barColor = isUntrained ? COLORS.textTertiary : confPercent > 80 ? COLORS.appleGreen : confPercent > 50 ? COLORS.appleBlue : COLORS.appleRed;

  return (
    <View style={styles.predictionRow}>
      <View style={styles.predHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MaterialCommunityIcons name={icon} size={14} color={COLORS.textSecondary} />
          <Text style={styles.predModel}>{model}</Text>
        </View>
        <Text style={[styles.predLabel, isUntrained && { color: COLORS.textTertiary }]}>{label.replace(/_/g, ' ')}</Text>
      </View>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${Math.min(100, Math.max(0, confPercent))}%`, backgroundColor: barColor }]} />
      </View>
      {showConfidence && <Text style={[styles.predConf, { color: barColor }]}>{confPercent}%</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  scrollContent: { padding: SPACING.md, paddingBottom: 120 },

  // ── Status Bar ──
  statusBarGlass: {
    ...APPLE_GLASS_STYLE,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: 8, marginBottom: SPACING.md,
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },

  // ── Camera / Preview ──
  cameraContainerGlass: {
    height: SCREEN_WIDTH * 0.85, borderRadius: 20,
    overflow: 'hidden', ...APPLE_GLASS_STYLE, marginBottom: SPACING.md,
  },
  previewContainer: { flex: 1, position: 'relative' },
  previewImage: { flex: 1, width: '100%' },
  clearBtn: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', borderRadius: 18,
    width: 36, height: 36, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  resultOverlayBadge: {
    position: 'absolute', bottom: 14, left: 14, right: 14,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16,
  },
  resultOverlayText: { color: '#FFF', fontWeight: '800', fontSize: 15 },

  // ── Empty State ──
  emptyStateContainer: { alignItems: 'center', paddingHorizontal: 20 },
  emptyIconRing: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(94, 106, 210, 0.12)', borderWidth: 1.5, borderColor: 'rgba(94, 106, 210, 0.30)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 4 },
  emptyDesc: { color: COLORS.textTertiary, fontSize: 13, textAlign: 'center' },

  // ── Threshold Card ──
  thresholdCard: {
    ...APPLE_GLASS_STYLE, padding: SPACING.md, borderRadius: 18, marginBottom: SPACING.md,
  },
  thresholdHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  thresholdIconBox: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: 'rgba(94, 106, 210, 0.15)', borderWidth: 1, borderColor: 'rgba(94, 106, 210, 0.30)',
    justifyContent: 'center', alignItems: 'center',
  },
  thresholdTitle: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '700' },
  thresholdValuePill: {
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
    backgroundColor: 'rgba(94, 106, 210, 0.18)', borderWidth: 1, borderColor: 'rgba(94, 106, 210, 0.40)',
  },
  thresholdValueText: { color: COLORS.appleBlue, fontWeight: '800', fontSize: 14, fontFamily: 'monospace' },

  // ── Track ──
  trackContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  stepButton: {
    width: 36, height: 36, borderRadius: 12,
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

  // ── Presets ──
  presetRow: { flexDirection: 'row', gap: 6 },
  presetChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 8, borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  presetDot: { width: 6, height: 6, borderRadius: 3 },
  presetLabel: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '600' },

  // ── Controls ──
  controlsRow: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingVertical: SPACING.md, marginBottom: SPACING.sm,
  },
  controlBtn: { alignItems: 'center', gap: 6 },
  controlIconCircle: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: 'rgba(94, 106, 210, 0.12)', borderWidth: 1, borderColor: 'rgba(94, 106, 210, 0.25)',
    justifyContent: 'center', alignItems: 'center',
  },
  controlLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '600' },
  captureOuterRing: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 3, borderColor: COLORS.appleBlue,
    justifyContent: 'center', alignItems: 'center',
  },
  captureInnerCircle: {
    width: 58, height: 58, borderRadius: 29, backgroundColor: COLORS.appleBlue,
    justifyContent: 'center', alignItems: 'center',
  },

  // ── Scan Button ──
  scanButton: {
    backgroundColor: COLORS.appleBlue, paddingVertical: 15, borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md,
  },
  scanBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  offlineHint: { color: COLORS.appleOrange, fontSize: 11, textAlign: 'center', marginBottom: SPACING.md, fontWeight: '600' },
  scanAgainBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 13, marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(94, 106, 210, 0.10)', borderWidth: 1, borderColor: 'rgba(94, 106, 210, 0.30)',
  },

  // ── Results ──
  resultCard: { ...APPLE_GLASS_STYLE, padding: SPACING.md, marginBottom: SPACING.md, borderRadius: 18 },
  ensembleBox: { borderRadius: 16, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1 },
  ensembleLabel: { fontSize: 10, color: COLORS.textSecondary, letterSpacing: 1.5, fontWeight: '700' },
  ensembleName: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginTop: 4 },
  confCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.06)', borderWidth: 2,
    justifyContent: 'center', alignItems: 'center',
  },
  breakdownTitle: { fontSize: 10, color: COLORS.textTertiary, letterSpacing: 1.5, fontWeight: '700', marginBottom: SPACING.sm },
  predictionRow: { marginBottom: SPACING.md },
  predHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  predModel: { color: COLORS.textSecondary, fontSize: 12 },
  predLabel: { color: COLORS.textPrimary, fontSize: 12, fontWeight: '700' },
  barBg: { height: 6, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 3, overflow: 'hidden', marginBottom: 3 },
  barFill: { height: '100%', borderRadius: 3 },
  predConf: { fontSize: 10, textAlign: 'right', fontWeight: '700' },
  feedbackRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.06)' },
  feedbackBtn: { padding: 8, backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.10)' },
  feedbackLoggedText: { fontSize: 11, color: COLORS.appleGreen, fontWeight: '600' },
});
