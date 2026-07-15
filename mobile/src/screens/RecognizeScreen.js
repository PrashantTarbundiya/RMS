import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ScrollView, ActivityIndicator, Alert, Dimensions, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme';
import { predict, pingServer } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function RecognizeScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraAvailable, setCameraAvailable] = useState(true);
  const [cameraError, setCameraError] = useState(null);
  const [imageUri, setImageUri] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [serverOnline, setServerOnline] = useState(null);
  const [facing, setFacing] = useState('front');
  
  // Web specific state
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
      if (Platform.OS === 'web') {
        stopWebCamera();
      }
    };
  }, [permission?.granted]);

  async function startWebCamera() {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      setWebStream(stream);
      setCameraAvailable(true);
      // Wait for ref binding
      setTimeout(() => {
        if (webVideoRef.current) {
          webVideoRef.current.srcObject = stream;
        }
      }, 300);
    } catch (err) {
      console.warn('Web camera permission failed:', err);
      setCameraError('Camera access not allowed or not found. Use gallery instead.');
      setCameraAvailable(false);
    }
  }

  function stopWebCamera() {
    if (webStream) {
      webStream.getTracks().forEach(track => track.stop());
      setWebStream(null);
    }
  }

  async function checkServer() {
    try {
      const online = await pingServer();
      setServerOnline(online);
    } catch {
      setServerOnline(false);
    }
  }

  async function takePicture() {
    if (Platform.OS === 'web') {
      captureWebPicture();
      return;
    }

    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });
      setImageUri(photo.uri);
      setResults(null);
    } catch (err) {
      Alert.alert('Camera Error', 'Failed to take picture. Try picking from gallery instead.\n\n' + err.message);
    }
  }

  function captureWebPicture() {
    if (!webVideoRef.current) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = webVideoRef.current.videoWidth || 640;
      canvas.height = webVideoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(webVideoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setImageUri(dataUrl);
      setResults(null);
      stopWebCamera();
    } catch (err) {
      console.warn('Web capture error:', err);
    }
  }

  async function pickImage() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setResults(null);
        if (Platform.OS === 'web') {
          stopWebCamera();
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to open gallery: ' + err.message);
    }
  }

  async function runRecognition() {
    if (!imageUri) {
      Alert.alert('No Image', 'Please capture or select an image first.');
      return;
    }
    setLoading(true);
    setResults(null);
    try {
      // For web, if it's base64, we convert it to Blob to upload
      let predictUri = imageUri;
      if (Platform.OS === 'web' && imageUri.startsWith('data:image')) {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        predictUri = URL.createObjectURL(blob);
      }
      const data = await predict(predictUri);
      setResults(data);
    } catch (err) {
      Alert.alert('Recognition Failed', err.message);
    } finally {
      setLoading(false);
    }
  }

  function clearImage() {
    setImageUri(null);
    setResults(null);
    if (Platform.OS === 'web') {
      startWebCamera();
    }
  }

  // Initial loading state
  if (Platform.OS !== 'web' && !permission && cameraAvailable) {
    return (
      <View style={styles.container}>
        <View style={styles.centerBox}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Initializing camera...</Text>
        </View>
      </View>
    );
  }

  const canUseCamera = cameraAvailable && (Platform.OS === 'web' || permission?.granted);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Server Status */}
      <View style={styles.statusBar}>
        <View style={[styles.statusDot, { backgroundColor: serverOnline ? COLORS.success : COLORS.error }]} />
        <Text style={styles.statusText}>
          {serverOnline === null ? 'Checking server...' : serverOnline ? 'Server Online' : 'Server Offline'}
        </Text>
        <TouchableOpacity onPress={checkServer} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Camera Error Banner */}
      {cameraError && !imageUri && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>⚠️ {cameraError}</Text>
        </View>
      )}

      {/* Camera / Preview Section */}
      <View style={styles.cameraContainer}>
        {imageUri ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
            <TouchableOpacity style={styles.clearBtn} onPress={clearImage}>
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : canUseCamera ? (
          Platform.OS === 'web' ? (
            <video
              ref={webVideoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
              <View style={styles.cameraOverlay}>
                <View style={styles.faceGuide} />
                <Text style={styles.guideText}>Position face in the frame</Text>
              </View>
            </CameraView>
          )
        ) : (
          <View style={styles.permissionBox}>
            <Text style={styles.permissionEmoji}>📷</Text>
            <Text style={styles.permissionTitle}>
              {!cameraAvailable ? 'Camera Not Available' : 'Camera Access Required'}
            </Text>
            <Text style={styles.permissionDesc}>
              {!cameraAvailable
                ? 'Your device does not support camera. Use the Gallery button below to pick images.'
                : 'Grant camera access to capture face photos, or use the Gallery button below.'}
            </Text>
            {cameraAvailable && (
              <TouchableOpacity style={styles.primaryBtn} onPress={Platform.OS === 'web' ? startWebCamera : requestCameraPermission}>
                <Text style={styles.primaryBtnText}>Grant Permission</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Camera Controls */}
      {!imageUri && (
        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.controlBtn} onPress={pickImage}>
            <Text style={styles.controlIcon}>🖼</Text>
            <Text style={styles.controlLabel}>Gallery</Text>
          </TouchableOpacity>

          {canUseCamera && (
            <>
              <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
                <View style={styles.captureInner} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.controlBtn}
                onPress={() => {
                  if (Platform.OS === 'web') {
                    // Web camera facing toggle (just a mock for now, browser has default front camera)
                    alert('Webcam uses front facing camera');
                  } else {
                    setFacing(f => f === 'back' ? 'front' : 'back');
                  }
                }}
              >
                <Text style={styles.controlIcon}>🔄</Text>
                <Text style={styles.controlLabel}>Flip</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* Action Buttons */}
      {imageUri && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.primaryBtn, styles.fullWidth, (loading || !serverOnline) && styles.disabledBtn]}
            onPress={runRecognition}
            disabled={loading || !serverOnline}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.primaryBtnText}>🔍  Run Recognition</Text>
            )}
          </TouchableOpacity>
          {!serverOnline && (
            <Text style={styles.offlineHint}>⚠️ Server is offline. Connect to your computer's network.</Text>
          )}
        </View>
      )}

      {/* Results Section */}
      {results && results.faces && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>
            {results.message || `Detected ${results.faces.length} face(s)`}
          </Text>
          {results.faces.map((face, i) => (
            <View key={i} style={styles.faceCard}>
              <Text style={styles.faceLabel}>Face {i + 1}</Text>
              
              {/* Ensemble Result */}
              {face.ensemble && (
                <View style={styles.ensembleCard}>
                  <Text style={styles.ensembleHeader}>ENSEMBLE RESULT</Text>
                  <View style={styles.ensembleRow}>
                    <Text style={[styles.ensembleName, face.ensemble.label === 'Unknown' && { color: COLORS.warning }]}>
                      {face.ensemble.label}
                    </Text>
                    <Text style={styles.ensembleConf}>
                      {(face.ensemble.confidence * 100).toFixed(1)}%
                    </Text>
                  </View>
                  <Text style={styles.ensembleMeta}>
                    {face.ensemble.method} · agreement: {face.ensemble.agreement}
                  </Text>
                </View>
              )}

              <Text style={styles.modelsHeader}>Individual Models</Text>
              <PredictionRow model="SOTA MobileNetV2" label={face.predictions.sota.label} confidence={face.predictions.sota.confidence} />
              <PredictionRow model="Custom CNN" label={face.predictions.cnn.label} confidence={face.predictions.cnn.confidence} />
              <PredictionRow model="DeepFace (Facenet512)" label={face.predictions.deepface.label} confidence={face.predictions.deepface.confidence} />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function PredictionRow({ model, label, confidence }) {
  const confPercent = (confidence * 100).toFixed(1);
  const isUntrained = label.includes('UNTRAINED') || label.includes('Not Trained') || label === 'Error';
  const barColor = isUntrained ? COLORS.textTertiary : confPercent > 80 ? COLORS.success : confPercent > 50 ? COLORS.primary : COLORS.error;

  return (
    <View style={styles.predictionRow}>
      <View style={styles.predHeader}>
        <Text style={styles.predModel}>{model}</Text>
        <Text style={[styles.predLabel, isUntrained && { color: COLORS.textTertiary }]}>{label}</Text>
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
  scrollContent: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md },
  loadingText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.md, marginTop: SPACING.sm },
  statusBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgSecondary, padding: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: SPACING.sm },
  statusText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm, flex: 1 },
  refreshBtn: { padding: SPACING.xs },
  refreshText: { fontSize: 18, color: COLORS.primary },
  warningBanner: { backgroundColor: 'rgba(245, 158, 11, 0.08)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)', borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md },
  warningText: { color: COLORS.warning, fontSize: FONT_SIZES.sm },
  cameraContainer: { height: SCREEN_WIDTH * 0.85, borderRadius: BORDER_RADIUS.lg, overflow: 'hidden', backgroundColor: COLORS.bgSecondary, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md },
  camera: { flex: 1 },
  cameraOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  faceGuide: { width: 180, height: 220, borderWidth: 2, borderColor: 'rgba(16, 185, 129, 0.4)', borderRadius: BORDER_RADIUS.xl, borderStyle: 'dashed' },
  guideText: { color: 'rgba(255, 255, 255, 0.6)', fontSize: FONT_SIZES.sm, marginTop: SPACING.sm },
  previewContainer: { flex: 1, position: 'relative' },
  previewImage: { flex: 1, width: '100%' },
  clearBtn: { position: 'absolute', top: SPACING.sm, right: SPACING.sm, backgroundColor: 'rgba(0, 0, 0, 0.6)', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  clearBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  permissionBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  permissionEmoji: { fontSize: 48, marginBottom: SPACING.md },
  permissionTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZES.lg, fontWeight: '700', marginBottom: SPACING.sm, textAlign: 'center' },
  permissionDesc: { color: COLORS.textSecondary, fontSize: FONT_SIZES.md, textAlign: 'center', marginBottom: SPACING.lg, lineHeight: 22 },
  controlsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: SPACING.md, marginBottom: SPACING.sm },
  controlBtn: { alignItems: 'center', gap: 4 },
  controlIcon: { fontSize: 24 },
  controlLabel: { color: COLORS.textSecondary, fontSize: FONT_SIZES.xs },
  captureBtn: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary },
  actionRow: { marginBottom: SPACING.md },
  primaryBtn: { backgroundColor: COLORS.primary, paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl, borderRadius: BORDER_RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: COLORS.textPrimary, fontSize: FONT_SIZES.md, fontWeight: '700' },
  fullWidth: { width: '100%' },
  disabledBtn: { opacity: 0.5 },
  offlineHint: { color: COLORS.warning, fontSize: FONT_SIZES.sm, textAlign: 'center', marginTop: SPACING.sm },
  resultsContainer: { marginTop: SPACING.sm },
  resultsTitle: { color: COLORS.success, fontSize: FONT_SIZES.md, fontWeight: '600', marginBottom: SPACING.md },
  faceCard: { backgroundColor: COLORS.bgSecondary, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  faceLabel: { color: COLORS.primary, fontSize: FONT_SIZES.lg, fontWeight: '700', marginBottom: SPACING.sm },
  ensembleCard: { backgroundColor: 'rgba(16, 185, 129, 0.06)', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)', borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md },
  ensembleHeader: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, letterSpacing: 1.5, marginBottom: SPACING.xs },
  ensembleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ensembleName: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary },
  ensembleConf: { fontSize: FONT_SIZES.xxl, fontWeight: '700', color: COLORS.primary },
  ensembleMeta: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, marginTop: SPACING.xs },
  modelsHeader: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, letterSpacing: 1.5, marginBottom: SPACING.sm, textTransform: 'uppercase' },
  predictionRow: { marginBottom: SPACING.md },
  predHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  predModel: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm },
  predLabel: { color: COLORS.textPrimary, fontSize: FONT_SIZES.sm, fontWeight: '600' },
  barBg: { height: 6, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 3, overflow: 'hidden', marginBottom: 2 },
  barFill: { height: '100%', borderRadius: 3 },
  predConf: { fontSize: FONT_SIZES.xs, textAlign: 'right' },
});
