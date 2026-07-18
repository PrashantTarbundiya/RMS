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
import { predict, pingServer } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function RecognizeScreen() {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraAvailable, setCameraAvailable] = useState(true);
  const [cameraError, setCameraError] = useState(null);
  const [imageUri, setImageUri] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [serverOnline, setServerOnline] = useState(null);
  const [facing, setFacing] = useState('front');

  const [webStream, setWebStream] = useState(null);
  const webVideoRef = useRef(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      startWebCamera();
    } else {
      if (!permission?.granted && permission?.canAskAgain) {
        requestPermission();
      }
    }
    checkServer();
    return () => {
      if (Platform.OS === 'web') stopWebCamera();
      // Restore tab bar when leaving
      navigation.getParent()?.setOptions({ tabBarStyle: undefined });
    };
  }, [permission?.granted]);

  // Hide tab bar when camera is active (no image captured), show it otherwise
  useEffect(() => {
    const cameraActive = !imageUri && cameraAvailable && (Platform.OS === 'web' || permission?.granted);
    if (cameraActive) {
      // Hide tab bar when camera viewfinder is active
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: 'none' }
      });
    } else {
      // Restore tab bar when viewing image or results
      navigation.getParent()?.setOptions({ tabBarStyle: undefined });
    }
  }, [imageUri, cameraAvailable, permission?.granted]);

  async function startWebCamera() {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      setWebStream(stream);
      setCameraAvailable(true);
      setTimeout(() => {
        if (webVideoRef.current) webVideoRef.current.srcObject = stream;
      }, 300);
    } catch (err) {
      setCameraError('Camera not available. Use gallery instead.');
      setCameraAvailable(false);
    }
  }

  function stopWebCamera() {
    if (webStream) { webStream.getTracks().forEach(t => t.stop()); setWebStream(null); }
  }

  async function checkServer() {
    try { setServerOnline(await pingServer()); } catch { setServerOnline(false); }
  }

  async function takePicture() {
    if (Platform.OS === 'web') { captureWebPicture(); return; }
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      setImageUri(photo.uri);
      setResults(null);
    } catch (err) {
      alert('Camera Error: ' + err.message);
    }
  }

  function captureWebPicture() {
    if (!webVideoRef.current) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = webVideoRef.current.videoWidth || 640;
      canvas.height = webVideoRef.current.videoHeight || 480;
      canvas.getContext('2d').drawImage(webVideoRef.current, 0, 0);
      setImageUri(canvas.toDataURL('image/jpeg'));
      setResults(null);
      stopWebCamera();
    } catch (err) { console.warn('Web capture error:', err); }
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
        if (Platform.OS === 'web') stopWebCamera();
      }
    } catch (err) { alert('Gallery Error: ' + err.message); }
  }

  async function runRecognition() {
    if (!imageUri) return;
    setLoading(true);
    setResults(null);
    try {
      let predictUri = imageUri;
      if (Platform.OS === 'web' && imageUri.startsWith('data:image')) {
        const response = await fetch(imageUri);
        predictUri = URL.createObjectURL(await response.blob());
      }
      setResults(await predict(predictUri));
    } catch (err) { alert('Recognition Failed: ' + err.message); }
    finally { setLoading(false); }
  }

  function clearImage() {
    setImageUri(null);
    setResults(null);
    if (Platform.OS === 'web') startWebCamera();
  }

  if (Platform.OS !== 'web' && !permission && cameraAvailable) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={COLORS.appleBlue} size="large" animating />
        <Text style={styles.loadingText}>Initializing Camera...</Text>
      </View>
    );
  }

  const canUseCamera = cameraAvailable && (Platform.OS === 'web' || permission?.granted);

  // Determine ensemble result for prominent display
  const topResult = results?.faces?.[0]?.ensemble;
  const isConfirmed = topResult && topResult.is_confirmed === true;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary }}>
      <View style={styles.appleWallpaperOrbPurple} />

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

        {cameraError && !imageUri && (
          <View style={styles.warningBanner}>
            <MaterialCommunityIcons name="alert-outline" size={16} color={COLORS.appleOrange} />
            <Text style={{ color: COLORS.appleOrange, fontSize: 12, flex: 1, marginLeft: 8 }}>{cameraError}</Text>
          </View>
        )}

        {/* Camera Viewfinder */}
        <View style={styles.cameraContainerGlass}>
          {imageUri ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
              <TouchableOpacity style={styles.clearBtn} onPress={clearImage}>
                <MaterialCommunityIcons name="close" size={18} color="#FFF" />
              </TouchableOpacity>
              {/* Overlay result badge on image */}
              {topResult && (
                <View style={[styles.resultOverlayBadge, { backgroundColor: isConfirmed ? 'rgba(48, 209, 88, 0.90)' : 'rgba(255, 69, 58, 0.85)' }]}>
                  <MaterialCommunityIcons name={isConfirmed ? 'check-circle' : 'close-circle'} size={18} color="#FFF" />
                  <Text style={styles.resultOverlayText}>
                    {isConfirmed ? `CONFIRMED: ${topResult.label.replace(/_/g, ' ')}` : 'NOT FOUND'}
                  </Text>
                </View>
              )}
            </View>
          ) : canUseCamera ? (
            Platform.OS === 'web' ? (
              <video
                ref={webVideoRef}
                autoPlay playsInline muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
                <View style={styles.cameraOverlay}>
                  <View style={styles.faceGuideFrame}>
                    <View style={[styles.cornerBracket, styles.cornerTL]} />
                    <View style={[styles.cornerBracket, styles.cornerTR]} />
                    <View style={[styles.cornerBracket, styles.cornerBL]} />
                    <View style={[styles.cornerBracket, styles.cornerBR]} />
                  </View>
                  <Text style={styles.guideText}>Align face within frame</Text>
                </View>
              </CameraView>
            )
          ) : (
            <View style={styles.permissionBox}>
              <MaterialCommunityIcons name="camera-off-outline" size={48} color={COLORS.textTertiary} />
              <Text style={styles.permissionTitle}>Camera Access Needed</Text>
              <Text style={styles.permissionDesc}>
                {!cameraAvailable ? 'No camera detected. Use gallery below.' : 'Allow camera to scan faces.'}
              </Text>
              {cameraAvailable && (
                <TouchableOpacity onPress={Platform.OS === 'web' ? startWebCamera : requestPermission} style={styles.grantBtn}>
                  <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 13 }}>Allow Camera</Text>
                </TouchableOpacity>
              )}
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

            {canUseCamera && (
              <>
                <TouchableOpacity style={styles.captureOuterRing} onPress={takePicture}>
                  <View style={styles.captureInnerCircle}>
                    <MaterialCommunityIcons name="camera" size={28} color="#FFF" />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.controlBtn} onPress={() => {
                  if (Platform.OS === 'web') alert('Webcam uses front camera');
                  else setFacing(f => f === 'back' ? 'front' : 'back');
                }}>
                  <MaterialCommunityIcons name="camera-flip-outline" size={22} color={COLORS.textPrimary} />
                  <Text style={styles.controlLabel}>Flip</Text>
                </TouchableOpacity>
              </>
            )}
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
            {/* Ensemble Hero — Binary Result */}
            {face.ensemble && (() => {
              const confirmed = face.ensemble.is_confirmed === true;
              return (
              <View style={[styles.ensembleBox, {
                backgroundColor: confirmed ? 'rgba(48, 209, 88, 0.12)' : 'rgba(255, 69, 58, 0.12)',
                borderColor: confirmed ? 'rgba(48, 209, 88, 0.30)' : 'rgba(255, 69, 58, 0.30)',
              }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ensembleLabel}>{confirmed ? 'IDENTITY CONFIRMED' : 'NOT FOUND'}</Text>
                    <Text style={[styles.ensembleName, !confirmed && { color: COLORS.appleRed }]}>
                      {confirmed ? face.ensemble.label.replace(/_/g, ' ') : 'Unknown Person'}
                    </Text>
                  </View>
                  <View style={[styles.confCircle, { borderColor: confirmed ? COLORS.appleGreen : COLORS.appleRed }]}>
                    <MaterialCommunityIcons
                      name={confirmed ? 'check-bold' : 'close-thick'}
                      size={24}
                      color={confirmed ? COLORS.appleGreen : COLORS.appleRed}
                    />
                  </View>
                </View>
                <Text style={styles.ensembleMeta}>
                  {face.ensemble.method} · Status: {face.ensemble.confidence_level?.toUpperCase() || 'N/A'}
                </Text>
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
            <PredictionRow
              model="DeepFace (Facenet512)"
              icon="brain"
              label={face.predictions.deepface.label}
              confidence={face.predictions.deepface.confidence}
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
});
