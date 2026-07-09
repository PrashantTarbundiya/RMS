import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Image, Alert, ActivityIndicator, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme';
import { uploadPerson, pingServer } from '../services/api';

export default function AddPersonScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [personName, setPersonName] = useState('');
  const [epochs, setEpochs] = useState('5');
  const [images, setImages] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null);
  
  // Web specific state
  const [webStream, setWebStream] = useState(null);
  const webVideoRef = useRef(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    return () => {
      if (Platform.OS === 'web' && webStream) {
        webStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [webStream]);

  async function pickImages() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 20,
        quality: 0.8,
      });
      if (!result.canceled && result.assets) {
        setImages(prev => [...prev, ...result.assets.map(a => a.uri)]);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick images: ' + err.message);
    }
  }

  async function openCamera() {
    if (Platform.OS === 'web') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
        });
        setWebStream(stream);
        setShowCamera(true);
        setTimeout(() => {
          if (webVideoRef.current) {
            webVideoRef.current.srcObject = stream;
          }
        }, 300);
      } catch (err) {
        Alert.alert('Permission Denied', 'Camera is not available or permission denied.');
      }
      return;
    }

    try {
      if (!permission?.granted) {
        const res = await requestPermission();
        if (res.granted) {
          setShowCamera(true);
        } else {
          Alert.alert('Permission Required', 'Camera access is needed to take photos.');
        }
      } else {
        setShowCamera(true);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to start camera: ' + err.message);
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
      setImages(prev => [...prev, photo.uri]);
      setShowCamera(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to take picture: ' + err.message);
    }
  }

  function captureWebPicture() {
    if (!webVideoRef.current || !webStream) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = webVideoRef.current.videoWidth || 640;
      canvas.height = webVideoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(webVideoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setImages(prev => [...prev, dataUrl]);
      setShowCamera(false);
      webStream.getTracks().forEach(track => track.stop());
      setWebStream(null);
    } catch (err) {
      console.warn('Web capture error:', err);
    }
  }

  function removeImage(index) {
    setImages(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    const name = personName.trim().replace(/\s+/g, '_');
    if (!name) { setStatus({ type: 'error', message: 'Person name is required.' }); return; }
    if (images.length === 0) { setStatus({ type: 'error', message: 'Please add at least one photo.' }); return; }

    const online = await pingServer();
    if (!online) {
      Alert.alert('Offline', 'Cannot reach the server. Make sure Flask is running on your computer.');
      return;
    }

    setUploading(true);
    setStatus({ type: 'info', message: 'Uploading images and starting training...' });
    try {
      // For web, we convert any base64 images to Blob objects before uploading
      const processedImages = await Promise.all(
        images.map(async (uri) => {
          if (Platform.OS === 'web' && uri.startsWith('data:image')) {
            const response = await fetch(uri);
            const blob = await response.blob();
            return URL.createObjectURL(blob);
          }
          return uri;
        })
      );

      const result = await uploadPerson(name, processedImages, parseInt(epochs) || 5);
      setStatus({ type: 'success', message: result.message || 'Upload successful! Training started.' });
      setPersonName('');
      setImages([]);
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setUploading(false);
    }
  }

  if (showCamera) {
    return (
      <View style={styles.container}>
        {Platform.OS === 'web' ? (
          <View style={{ flex: 1, position: 'relative' }}>
            <video
              ref={webVideoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <View style={styles.cameraBottomBar}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => { setShowCamera(false); if (webStream) { webStream.getTracks().forEach(t => t.stop()); setWebStream(null); } }}>
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.bigCaptureBtn} onPress={takePicture}>
                <View style={styles.bigCaptureInner} />
              </TouchableOpacity>
              <View style={{ width: 80 }} />
            </View>
          </View>
        ) : (
          <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front">
            <View style={styles.cameraBottomBar}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowCamera(false)}>
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.bigCaptureBtn} onPress={takePicture}>
                <View style={styles.bigCaptureInner} />
              </TouchableOpacity>
              <View style={{ width: 80 }} />
            </View>
          </CameraView>
        )}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {status && (() => {
        let bannerBg = 'rgba(16, 185, 129, 0.08)';
        let bannerBorder = 'rgba(16, 185, 129, 0.3)';
        let bannerTextColor = COLORS.success;

        if (status.type === 'error') {
          bannerBg = 'rgba(239, 68, 68, 0.08)';
          bannerBorder = 'rgba(239, 68, 68, 0.3)';
          bannerTextColor = COLORS.error;
        } else if (status.type === 'info') {
          bannerBg = 'rgba(59, 130, 246, 0.08)';
          bannerBorder = 'rgba(59, 130, 246, 0.3)';
          bannerTextColor = COLORS.info;
        }

        return (
          <View style={[styles.statusBanner, { backgroundColor: bannerBg, borderColor: bannerBorder }]}>
            <Text style={{ color: bannerTextColor, fontSize: FONT_SIZES.sm, fontWeight: '500' }}>
              {status.message}
            </Text>
          </View>
        )
      })()}

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>PERSON NAME</Text>
        <TextInput style={styles.textInput} placeholder="e.g. John_Doe" placeholderTextColor={COLORS.textTertiary} value={personName} onChangeText={(t) => setPersonName(t.replace(/\s+/g, '_'))} autoCapitalize="words" />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>TRAINING EPOCHS</Text>
        <TextInput style={[styles.textInput, { width: 100 }]} placeholder="5" placeholderTextColor={COLORS.textTertiary} value={epochs} onChangeText={setEpochs} keyboardType="number-pad" />
      </View>

      <Text style={styles.inputLabel}>FACE PHOTOS</Text>
      <View style={styles.photoActions}>
        <TouchableOpacity style={styles.photoBtn} onPress={pickImages}>
          <Text style={styles.photoBtnIcon}>🖼</Text>
          <Text style={styles.photoBtnText}>Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.photoBtn} onPress={openCamera}>
          <Text style={styles.photoBtnIcon}>📷</Text>
          <Text style={styles.photoBtnText}>Camera</Text>
        </TouchableOpacity>
      </View>

      {images.length > 0 && (
        <View style={styles.photoGrid}>
          {images.map((uri, i) => (
            <View key={i} style={styles.photoThumb}>
              <Image source={{ uri }} style={styles.thumbImage} />
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(i)}>
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      {images.length > 0 && <Text style={styles.photoCount}>{images.length} photo(s) selected</Text>}

      <TouchableOpacity style={[styles.submitBtn, (uploading || images.length === 0) && styles.disabledBtn]} onPress={handleSubmit} disabled={uploading || images.length === 0}>
        {uploading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitBtnText}>✓  Upload & Start Training</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  scrollContent: { padding: SPACING.md, paddingBottom: SPACING.xxl * 2 },
  statusBanner: { padding: SPACING.md, borderRadius: BORDER_RADIUS.md, borderWidth: 1, marginBottom: SPACING.md },
  inputGroup: { marginBottom: SPACING.lg },
  inputLabel: { color: COLORS.textSecondary, fontSize: FONT_SIZES.xs, fontWeight: '600', letterSpacing: 1.5, marginBottom: SPACING.sm },
  textInput: { backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, color: COLORS.textPrimary, fontSize: FONT_SIZES.md },
  photoActions: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  photoBtn: { flex: 1, backgroundColor: COLORS.bgSecondary, borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.lg, alignItems: 'center', gap: SPACING.sm },
  photoBtnIcon: { fontSize: 28 },
  photoBtnText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm, fontWeight: '500' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm },
  photoThumb: { width: 80, height: 80, borderRadius: BORDER_RADIUS.sm, overflow: 'hidden', position: 'relative' },
  thumbImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  removeBtn: { position: 'absolute', top: 2, right: 2, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  removeBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  photoCount: { color: COLORS.textTertiary, fontSize: FONT_SIZES.sm, marginBottom: SPACING.lg },
  submitBtn: { backgroundColor: COLORS.primary, paddingVertical: SPACING.md + 2, borderRadius: BORDER_RADIUS.md, alignItems: 'center', marginTop: SPACING.sm },
  submitBtnText: { color: COLORS.textPrimary, fontSize: FONT_SIZES.md, fontWeight: '700' },
  disabledBtn: { opacity: 0.5 },
  secondaryBtn: { backgroundColor: COLORS.bgSecondary, paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', minWidth: 80 },
  secondaryBtnText: { color: COLORS.textPrimary, fontSize: FONT_SIZES.md, fontWeight: '600' },
  cameraBottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, paddingBottom: SPACING.xl, backgroundColor: 'rgba(0,0,0,0.4)' },
  bigCaptureBtn: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  bigCaptureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary },
});
