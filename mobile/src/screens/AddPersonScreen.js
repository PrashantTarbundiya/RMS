import React, { useState, useRef, useEffect } from 'react';
import {
  View, StyleSheet, ScrollView, Image, Platform, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Text, TextInput, Snackbar, ActivityIndicator,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, APPLE_GLASS_STYLE } from '../theme';
import { uploadPerson, pingServer } from '../services/api';

export default function AddPersonScreen() {
  const route = useNavigation().getState().routes.find(r => r.name === 'AddPerson');
  const [personName, setPersonName] = useState('');
  const [epochs, setEpochs] = useState('5');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null);
  const [snackVisible, setSnackVisible] = useState(false);

  const navigation = useNavigation();

  // Handle return from CameraCaptureScreen
  useEffect(() => {
    if (route?.params?.capturedImage) {
      setImages(prev => [...prev, route.params.capturedImage]);
      // Clear the param
      navigation.setParams({ capturedImage: undefined });
    }
  }, [route?.params?.capturedImage]);

  async function pickImages() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true, selectionLimit: 20, quality: 0.8,
      });
      if (!result.canceled && result.assets) {
        setImages(prev => [...prev, ...result.assets.map(a => a.uri)]);
      }
    } catch (err) { showStatus('error', 'Gallery failed: ' + err.message); }
  }

  function openCamera() {
    navigation.navigate('CameraCapture', { returnScreen: 'AddPerson' });
  }

  function removeImage(index) { setImages(prev => prev.filter((_, i) => i !== index)); }
  function showStatus(type, message) { setStatus({ type, message }); setSnackVisible(true); }

  async function handleSubmit() {
    const name = personName.trim().replace(/\s+/g, '_');
    if (!name) { showStatus('error', 'Enter a subject name.'); return; }
    if (images.length === 0) { showStatus('error', 'Add at least one photo.'); return; }

    const online = await pingServer();
    if (!online) { showStatus('error', 'Server offline. Check Settings.'); return; }

    setUploading(true);
    showStatus('info', 'Uploading ' + images.length + ' photos...');
    try {
      const processedImages = await Promise.all(
        images.map(async (uri) => {
          if (Platform.OS === 'web' && uri.startsWith('data:image')) {
            return URL.createObjectURL(await (await fetch(uri)).blob());
          }
          return uri;
        })
      );
      const result = await uploadPerson(name, processedImages, parseInt(epochs) || 5);
      showStatus('success', result.message || 'Upload complete! Training started.');
      setPersonName('');
      setImages([]);
    } catch (err) { showStatus('error', err.message); }
    finally { setUploading(false); }
  }



  const nameValid = personName.trim().length > 0;
  const readyToSubmit = nameValid && images.length > 0 && !uploading;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary }}>
      <View style={styles.appleWallpaperOrbPurple} />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Progress Steps */}
        <View style={styles.stepsRow}>
          <StepBadge num="1" label="Name" active={!nameValid} done={nameValid} />
          <View style={[styles.stepLine, nameValid && { backgroundColor: COLORS.appleBlue }]} />
          <StepBadge num="2" label="Photos" active={nameValid && images.length === 0} done={images.length > 0} />
          <View style={[styles.stepLine, images.length > 0 && { backgroundColor: COLORS.appleBlue }]} />
          <StepBadge num="3" label="Upload" active={readyToSubmit} done={false} />
        </View>

        {/* Name Input */}
        <Text style={styles.inputHeaderLabel}>SUBJECT NAME</Text>
        <TextInput
          mode="outlined"
          value={personName}
          onChangeText={(t) => setPersonName(t.replace(/\s+/g, '_'))}
          placeholder="e.g. John_Doe"
          autoCapitalize="words"
          left={<TextInput.Icon icon="account-outline" color={nameValid ? COLORS.appleGreen : COLORS.appleBlue} />}
          right={nameValid ? <TextInput.Icon icon="check-circle" color={COLORS.appleGreen} /> : null}
          outlineColor="rgba(255, 255, 255, 0.15)"
          activeOutlineColor={COLORS.appleBlue}
          textColor={COLORS.textPrimary}
          placeholderTextColor={COLORS.textTertiary}
          style={styles.glassInput}
          theme={{ colors: { onSurfaceVariant: COLORS.textSecondary } }}
        />

        {/* Epochs */}
        <Text style={styles.inputHeaderLabel}>TRAINING EPOCHS</Text>
        <View style={styles.epochRow}>
          <TextInput
            mode="outlined"
            value={epochs}
            onChangeText={setEpochs}
            placeholder="5"
            keyboardType="number-pad"
            left={<TextInput.Icon icon="sync" color={COLORS.appleBlue} />}
            outlineColor="rgba(255, 255, 255, 0.15)"
            activeOutlineColor={COLORS.appleBlue}
            textColor={COLORS.textPrimary}
            placeholderTextColor={COLORS.textTertiary}
            style={[styles.glassInput, { flex: 1 }]}
            theme={{ colors: { onSurfaceVariant: COLORS.textSecondary } }}
          />
          <Text style={styles.epochHint}>Higher = better accuracy, slower training</Text>
        </View>

        {/* Photo Capture Buttons */}
        <Text style={styles.inputHeaderLabel}>ADD FACE PHOTOS</Text>
        <View style={styles.photoActions}>
          <TouchableOpacity style={styles.photoActionBtn} onPress={pickImages}>
            <View style={[styles.photoActionIcon, { backgroundColor: 'rgba(10, 132, 255, 0.15)', borderColor: 'rgba(10, 132, 255, 0.30)' }]}>
              <MaterialCommunityIcons name="image-multiple" size={24} color={COLORS.appleBlue} />
            </View>
            <Text style={styles.photoActionTitle}>Gallery</Text>
            <Text style={styles.photoActionSub}>Select multiple</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.photoActionBtn} onPress={openCamera}>
            <View style={[styles.photoActionIcon, { backgroundColor: 'rgba(191, 90, 242, 0.15)', borderColor: 'rgba(191, 90, 242, 0.30)' }]}>
              <MaterialCommunityIcons name="camera" size={24} color={COLORS.applePurple} />
            </View>
            <Text style={styles.photoActionTitle}>Camera</Text>
            <Text style={styles.photoActionSub}>Take photo</Text>
          </TouchableOpacity>
        </View>

        {/* Photo Grid */}
        {images.length > 0 && (
          <>
            <View style={styles.photoCountRow}>
              <Text style={styles.photoCountLabel}>{images.length} photo{images.length !== 1 ? 's' : ''} added</Text>
              <TouchableOpacity onPress={() => setImages([])}>
                <Text style={{ color: COLORS.appleRed, fontSize: 12, fontWeight: '600' }}>Clear All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.photoGrid}>
              {images.map((uri, i) => (
                <View key={i} style={styles.photoThumb}>
                  <Image source={{ uri }} style={styles.thumbImage} />
                  <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(i)}>
                    <MaterialCommunityIcons name="close" size={12} color="#FFF" />
                  </TouchableOpacity>
                  <View style={styles.thumbIndex}>
                    <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '700' }}>{i + 1}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Tip */}
        {images.length > 0 && images.length < 3 && (
          <View style={styles.tipBanner}>
            <MaterialCommunityIcons name="lightbulb-outline" size={14} color={COLORS.appleBlue} />
            <Text style={styles.tipText}>
              Add at least 3 photos (frontal + side angles) for best accuracy.
            </Text>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!readyToSubmit}
          style={[styles.submitBtn, !readyToSubmit && { opacity: 0.35 }]}
        >
          {uploading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <ActivityIndicator color="#FFF" size="small" />
              <Text style={styles.submitBtnText}>Uploading...</Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="cloud-upload-outline" size={20} color="#FFF" />
              <Text style={styles.submitBtnText}>Upload & Train ({images.length} photos)</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={{ height: 100 }} />
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
    </View>
  );
}

function StepBadge({ num, label, active, done }) {
  const bgColor = done ? COLORS.appleBlue : active ? 'rgba(10, 132, 255, 0.25)' : 'rgba(255,255,255,0.08)';
  const textColor = done ? '#FFF' : active ? COLORS.appleBlue : COLORS.textTertiary;

  return (
    <View style={{ alignItems: 'center', gap: 3 }}>
      <View style={[styles.stepBadge, { backgroundColor: bgColor }]}>
        {done ? (
          <MaterialCommunityIcons name="check" size={14} color="#FFF" />
        ) : (
          <Text style={{ color: textColor, fontSize: 11, fontWeight: '700' }}>{num}</Text>
        )}
      </View>
      <Text style={{ color: textColor, fontSize: 9, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: SPACING.md },
  appleWallpaperOrbPurple: {
    position: 'absolute', top: 50, right: -100,
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(94, 44, 165, 0.22)',
  },
  stepsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.lg, gap: 0,
  },
  stepBadge: {
    width: 26, height: 26, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center',
  },
  stepLine: {
    width: 40, height: 2, backgroundColor: 'rgba(255,255,255,0.10)',
    marginHorizontal: 6, borderRadius: 1,
  },
  inputHeaderLabel: {
    color: COLORS.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1,
    marginBottom: 6, marginTop: SPACING.sm,
  },
  glassInput: { backgroundColor: 'rgba(255, 255, 255, 0.04)', marginBottom: SPACING.sm },
  epochRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: SPACING.sm },
  epochHint: { color: COLORS.textTertiary, fontSize: 10, flex: 1 },
  photoActions: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  photoActionBtn: {
    flex: 1, ...APPLE_GLASS_STYLE,
    paddingVertical: SPACING.md, alignItems: 'center', gap: 6,
  },
  photoActionIcon: {
    width: 48, height: 48, borderRadius: 14,
    borderWidth: 1, justifyContent: 'center', alignItems: 'center',
  },
  photoActionTitle: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '700' },
  photoActionSub: { color: COLORS.textTertiary, fontSize: 10 },
  photoCountRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  photoCountLabel: { color: COLORS.appleBlue, fontSize: 12, fontWeight: '700' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.md },
  photoThumb: {
    width: 72, height: 72, borderRadius: 12, overflow: 'hidden', position: 'relative',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  thumbImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  removeBtn: {
    position: 'absolute', top: 3, right: 3,
    backgroundColor: 'rgba(255, 69, 58, 0.85)', borderRadius: 10,
    width: 20, height: 20, justifyContent: 'center', alignItems: 'center',
  },
  thumbIndex: {
    position: 'absolute', bottom: 3, left: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', borderRadius: 6,
    paddingHorizontal: 5, paddingVertical: 1,
  },
  tipBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(10, 132, 255, 0.10)', borderRadius: 12,
    padding: SPACING.sm, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: 'rgba(10, 132, 255, 0.25)',
  },
  tipText: { color: COLORS.textSecondary, fontSize: 11, flex: 1 },
  submitBtn: {
    backgroundColor: COLORS.appleBlue, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 15, justifyContent: 'center', alignItems: 'center', marginTop: SPACING.sm,
  },
  submitBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  cameraBottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: SPACING.lg, paddingBottom: SPACING.xl, backgroundColor: 'rgba(0,0,0,0.55)',
  },
  cameraCancelBtn: {
    paddingVertical: 8, paddingHorizontal: 18, borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  cameraCaptureBtn: {
    width: 68, height: 68, borderRadius: 34,
    borderWidth: 3, borderColor: COLORS.appleBlue,
    justifyContent: 'center', alignItems: 'center',
  },
  cameraCaptureInner: {
    width: 54, height: 54, borderRadius: 27, backgroundColor: COLORS.appleBlue,
    justifyContent: 'center', alignItems: 'center',
  },
});
