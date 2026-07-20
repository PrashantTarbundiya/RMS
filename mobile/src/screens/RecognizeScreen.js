import React, { useState, useRef, useEffect } from 'react';
import {
  View, StyleSheet, ScrollView, Image, Dimensions, Platform, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Text, ActivityIndicator, IconButton } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, APPLE_GLASS_STYLE } from '../theme';
import { predictImage, checkHealth, submitFeedback } from '../services/api';
import GlassView from '../components/GlassView';
import BackgroundOrbs from '../components/BackgroundOrbs';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function RecognizeScreen() {
  const [imageUri, setImageUri] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [serverOnline, setServerOnline] = useState(null);
  const [feedbackState, setFeedbackState] = useState({}); // track feedback per prediction_id

  const navigation = useNavigation();
  const route = useNavigation().getState().routes.find(r => r.name === 'Recognize');

  useEffect(() => {
    checkServer();
  }, []);

  // Handle return from CameraCaptureScreen
  useEffect(() => {
    if (route?.params?.capturedImage) {
      setImageUri(route.params.capturedImage);
      setResults(null);
      // Clear the param
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
        if (Platform.OS === 'web') stopWebCamera();
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
      setResults(await predictImage(predictUri));
    } catch (err) { alert('Recognition Failed: ' + err.message); }
    finally { setLoading(false); }
  }

  function clearImage() {
    setImageUri(null);
    setResults(null);
    setFeedbackState({});
  }

  async function handleFeedback(predictionId, isCorrect, predictedLabel) {
    try {
      await submitFeedback(predictionId, isCorrect, isCorrect ? predictedLabel : '');
      setFeedbackState(prev => ({ ...prev, [predictionId]: 'logged' }));
    } catch (err) {
      alert('Failed to submit feedback');
    }
  }

  // Removed inline camera access checking since it's now in CameraCaptureScreen

  // Determine primary result for prominent display (using SOTA)
  const topResult = results?.faces?.[0]?.predictions?.sota;
  // If the label is SPOOF DETECTED, we don't confirm. If confidence > 0.6 and not unknown, confirmed.
  const displayLabel = topResult?.label || 'Unknown';
  const displayConf = topResult?.confidence || 0;
  const isSpoofed = displayLabel === 'SPOOF DETECTED';
  const isConfirmed = (!isSpoofed && displayConf > 0.6 && displayLabel !== 'Unknown');

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary }}>
      <BackgroundOrbs />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Server Status */}
        <View style={styles.statusBarGlass}>
          <View style={styles.statusLeft}>
            <View style={[styles.statusDot, { backgroundColor: serverOnline ? COLORS.appleGreen : COLORS.appleRed }]} />
            <Text style={styles.statusText}>
              {serverOnline === null ? 'Checking...' : serverOnline ? 'Engine Online' : 'Server Offline'}
            </Text>
          </View>
          <IconButton icon="refresh" iconColor={COLORS.appleBlue} size={16} onPress={checkServer} style={{ margin: 0 }} />
        </View>



        {/* Image Preview Container */}
        <View style={[styles.cameraContainerGlass, !imageUri && { height: 160, justifyContent: 'center', alignItems: 'center' }]}>
          {imageUri ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
              <TouchableOpacity style={styles.clearBtn} onPress={clearImage}>
                <MaterialCommunityIcons name="close" size={18} color="#FFF" />
              </TouchableOpacity>
              {/* Overlay result badge on image */}
              {topResult && (
                <View style={[styles.resultOverlayBadge, { backgroundColor: isSpoofed ? 'rgba(251, 191, 36, 0.90)' : isConfirmed ? 'rgba(39, 166, 68, 0.90)' : 'rgba(248, 113, 113, 0.85)' }]}>
                  <MaterialCommunityIcons name={isSpoofed ? 'alert-circle' : isConfirmed ? 'check-circle' : 'close-circle'} size={18} color="#FFF" />
                  <Text style={styles.resultOverlayText}>
                    {isSpoofed ? 'SPOOF DETECTED' : isConfirmed ? `CONFIRMED: ${displayLabel.replace(/_/g, ' ')}` : 'NOT FOUND'}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={{ alignItems: 'center' }}>
              <MaterialCommunityIcons name="line-scan" size={48} color={COLORS.appleBlue} />
              <Text style={{ color: COLORS.textSecondary, marginTop: 10, fontWeight: '600' }}>Select an image or take a photo to begin</Text>
            </View>
          )}
        </View>

        {/* Controls */}
        {!imageUri && (
          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.controlBtn} onPress={pickImage}>
              <MaterialCommunityIcons name="image-outline" size={22} color={COLORS.textPrimary} />
              <Text style={styles.controlLabel}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.captureOuterRing} onPress={openCamera}>
              <View style={styles.captureInnerCircle}>
                <MaterialCommunityIcons name="camera" size={28} color="#FFF" />
              </View>
            </TouchableOpacity>

            <View style={[styles.controlBtn, { opacity: 0 }]} />
          </View>
        )}

        {/* Scan Action Button */}
        {imageUri && !results && (
          <TouchableOpacity
            onPress={runRecognition}
            disabled={loading || !serverOnline}
            style={[styles.scanButton, (loading || !serverOnline) && { opacity: 0.5 }]}
          >
            {loading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ActivityIndicator color="#FFF" size="small" />
                <Text style={styles.scanBtnText}>Analyzing Face...</Text>
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

        {/* Scan Again Button */}
        {results && (
          <TouchableOpacity onPress={clearImage} style={styles.scanAgainBtn}>
            <MaterialCommunityIcons name="camera-retake-outline" size={18} color={COLORS.appleBlue} />
            <Text style={{ color: COLORS.appleBlue, fontWeight: '700', fontSize: 13 }}>Scan Another Face</Text>
          </TouchableOpacity>
        )}

        {/* Detailed Results */}
        {results && results.faces && results.faces.map((face, i) => (
          <View key={i} style={styles.resultCard}>
            {/* Primary Result Box */}
            {face.predictions?.sota && (() => {
               const spoofed = face.predictions.sota.label === 'SPOOF DETECTED';
               const confirmed = (!spoofed && face.predictions.sota.confidence > 0.6 && face.predictions.sota.label !== 'Unknown');
               
               let boxBg = confirmed ? 'rgba(39, 166, 68, 0.12)' : 'rgba(248, 113, 113, 0.12)';
               let boxBorder = confirmed ? 'rgba(39, 166, 68, 0.30)' : 'rgba(248, 113, 113, 0.30)';
               let iconColor = confirmed ? COLORS.appleGreen : COLORS.appleRed;
               let iconName = confirmed ? 'check-bold' : 'close-thick';

               if (spoofed) {
                 boxBg = 'rgba(251, 191, 36, 0.12)';
                 boxBorder = 'rgba(251, 191, 36, 0.30)';
                 iconColor = COLORS.appleOrange;
                 iconName = 'alert-octagon';
               }

               return (
               <View style={[styles.ensembleBox, { backgroundColor: boxBg, borderColor: boxBorder }]}>
                 <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                   <View style={{ flex: 1 }}>
                     <Text style={styles.ensembleLabel}>{spoofed ? 'LIVENESS FAILED' : confirmed ? 'IDENTITY CONFIRMED' : 'NO MATCH FOUND'}</Text>
                     <Text style={[styles.ensembleName, { color: iconColor }]}>
                       {face.predictions.sota.label.replace(/_/g, ' ')}
                     </Text>
                   </View>
                   <View style={[styles.confCircle, { borderColor: iconColor }]}>
                     <MaterialCommunityIcons name={iconName} size={24} color={iconColor} />
                   </View>
                 </View>

                 {/* Feedback Section */}
                 {face.prediction_id && !spoofed && (
                   <View style={styles.feedbackRow}>
                     {feedbackState[face.prediction_id] === 'logged' ? (
                       <Text style={styles.feedbackLoggedText}>✓ Feedback Logged</Text>
                     ) : (
                       <>
                         <TouchableOpacity onPress={() => handleFeedback(face.prediction_id, true, face.predictions.sota.label)} style={styles.feedbackBtn}>
                           <MaterialCommunityIcons name="thumb-up-outline" size={16} color={COLORS.appleGreen} />
                         </TouchableOpacity>
                         <TouchableOpacity onPress={() => handleFeedback(face.prediction_id, false, face.predictions.sota.label)} style={styles.feedbackBtn}>
                           <MaterialCommunityIcons name="thumb-down-outline" size={16} color={COLORS.appleRed} />
                         </TouchableOpacity>
                       </>
                     )}
                   </View>
                 )}
               </View>
               );
            })()}

            {/* Model Breakdown */}
            <Text style={styles.breakdownTitle}>MODEL BREAKDOWN</Text>
            <PredictionRow
              model="SOTA MobileNetV2"
              icon="cellphone-cog"
              label={face.predictions.sota.label}
              confidence={face.predictions.sota.confidence}
            />
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function PredictionRow({ model, icon, label, confidence }) {
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
        <Text style={[styles.predLabel, isUntrained && { color: COLORS.textTertiary }]}>
          {label.replace(/_/g, ' ')}
        </Text>
      </View>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${Math.min(100, Math.max(0, confPercent))}%`, backgroundColor: barColor }]} />
      </View>
      <Text style={[styles.predConf, { color: barColor }]}>{confPercent}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  scrollContent: { padding: SPACING.md, paddingBottom: 120 },
  appleWallpaperOrbPurple: {
    position: 'absolute', top: -80, left: -80,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(94, 44, 165, 0.22)',
  },
  loadingText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 13, marginTop: 12 },
  statusBarGlass: {
    ...APPLE_GLASS_STYLE,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: 6, marginBottom: SPACING.md,
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  warningBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.warningContainer, borderWidth: 1, borderColor: 'rgba(255, 159, 10, 0.35)',
    borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md,
  },
  cameraContainerGlass: {
    height: SCREEN_WIDTH * 0.85, borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden', ...APPLE_GLASS_STYLE, marginBottom: SPACING.md,
  },
  camera: { flex: 1 },
  cameraOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  faceGuideFrame: { width: 180, height: 210, position: 'relative' },
  cornerBracket: { position: 'absolute', width: 28, height: 28, borderColor: COLORS.appleBlue },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },
  guideText: { color: COLORS.appleBlue, fontSize: 12, fontWeight: '600', marginTop: 14 },
  previewContainer: { flex: 1, position: 'relative' },
  previewImage: { flex: 1, width: '100%' },
  clearBtn: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.55)', borderRadius: 16,
    width: 32, height: 32, justifyContent: 'center', alignItems: 'center',
  },
  resultOverlayBadge: {
    position: 'absolute', bottom: 12, left: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14,
  },
  resultOverlayText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  permissionBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl, gap: 10 },
  permissionTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  permissionDesc: { color: COLORS.textSecondary, textAlign: 'center', fontSize: 13 },
  grantBtn: {
    backgroundColor: COLORS.appleBlue, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 10, paddingHorizontal: 20, marginTop: 4,
  },
  controlsRow: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingVertical: SPACING.sm, marginBottom: SPACING.sm,
  },
  controlBtn: {
    alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 16, paddingVertical: 10, paddingHorizontal: 18,
  },
  controlLabel: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '600' },
  captureOuterRing: {
    width: 68, height: 68, borderRadius: 34,
    borderWidth: 3, borderColor: COLORS.appleBlue,
    justifyContent: 'center', alignItems: 'center',
  },
  captureInnerCircle: {
    width: 54, height: 54, borderRadius: 27, backgroundColor: COLORS.appleBlue,
    justifyContent: 'center', alignItems: 'center',
  },
  scanButton: {
    backgroundColor: COLORS.appleBlue, paddingVertical: 14, borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm,
  },
  scanBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  offlineHint: { color: COLORS.appleOrange, fontSize: 11, textAlign: 'center', marginBottom: SPACING.md, fontWeight: '600' },
  scanAgainBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(10, 132, 255, 0.12)', borderWidth: 1, borderColor: 'rgba(10, 132, 255, 0.30)',
  },
  resultCard: { ...APPLE_GLASS_STYLE, padding: SPACING.md, marginBottom: SPACING.md },
  ensembleBox: {
    borderRadius: 16, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1,
  },
  ensembleLabel: { fontSize: 10, color: COLORS.textSecondary, letterSpacing: 1, fontWeight: '700' },
  ensembleName: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginTop: 2 },
  confCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 2, borderColor: COLORS.appleBlue,
    justifyContent: 'center', alignItems: 'center',
  },
  confCircleValue: { color: COLORS.appleBlue, fontSize: 18, fontWeight: '800', lineHeight: 20 },
  confCircleUnit: { color: COLORS.appleBlue, fontSize: 10, fontWeight: '700' },
  ensembleMeta: { fontSize: 11, color: COLORS.textTertiary, marginTop: 8 },
  breakdownTitle: { fontSize: 10, color: COLORS.textTertiary, letterSpacing: 1, fontWeight: '700', marginBottom: SPACING.sm },
  predictionRow: { marginBottom: SPACING.md },
  predHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  predModel: { color: COLORS.textSecondary, fontSize: 12 },
  predLabel: { color: COLORS.textPrimary, fontSize: 12, fontWeight: '700' },
  barBg: { height: 6, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 3, overflow: 'hidden', marginBottom: 2 },
  barFill: { height: '100%', borderRadius: 3 },
  predConf: { fontSize: 10, textAlign: 'right', fontWeight: '700' },
  feedbackRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)' },
  feedbackBtn: { padding: 6, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 8 },
  feedbackLoggedText: { fontSize: 11, color: COLORS.appleGreen, fontWeight: '600' },
});
