import React, { useState, useRef, useEffect } from 'react';
import {
  View, StyleSheet, Platform, TouchableOpacity, Text
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS } from '../theme';

export default function CameraCaptureScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const returnScreen = route.params?.returnScreen || 'Recognize';

  const [permission, requestPermission] = useCameraPermissions();
  const [cameraAvailable, setCameraAvailable] = useState(true);
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
    return () => {
      if (Platform.OS === 'web') stopWebCamera();
    };
  }, [permission?.granted]);

  async function startWebCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      setWebStream(stream);
      setCameraAvailable(true);
      setTimeout(() => {
        if (webVideoRef.current) webVideoRef.current.srcObject = stream;
      }, 300);
    } catch (err) {
      setCameraAvailable(false);
    }
  }

  function stopWebCamera() {
    if (webStream) {
      webStream.getTracks().forEach(t => t.stop());
      setWebStream(null);
    }
  }

  async function takePicture() {
    if (Platform.OS === 'web') {
      if (!webVideoRef.current) return;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = webVideoRef.current.videoWidth || 640;
        canvas.height = webVideoRef.current.videoHeight || 480;
        canvas.getContext('2d').drawImage(webVideoRef.current, 0, 0);
        const uri = canvas.toDataURL('image/jpeg');
        navigateBackWithImage(uri);
      } catch (err) { console.warn('Web capture error:', err); }
      return;
    }

    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      navigateBackWithImage(photo.uri);
    } catch (err) {
      alert('Camera Error: ' + err.message);
    }
  }

  function navigateBackWithImage(uri) {
    if (Platform.OS === 'web') stopWebCamera();
    navigation.navigate({
      name: returnScreen,
      params: { capturedImage: uri },
      merge: true,
    });
  }

  function handleClose() {
    if (Platform.OS === 'web') stopWebCamera();
    navigation.goBack();
  }

  const canUseCamera = cameraAvailable && (Platform.OS === 'web' || permission?.granted);

  return (
    <View style={styles.container}>
      {/* Header Overlay */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <MaterialCommunityIcons name="close" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {canUseCamera ? (
        Platform.OS === 'web' ? (
          <View style={styles.camera}>
            <video
              ref={webVideoRef}
              autoPlay playsInline muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </View>
        ) : (
          <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
            {returnScreen === 'Recognize' && (
              <View style={styles.cameraOverlay}>
                <View style={styles.faceGuideFrame}>
                  <View style={[styles.cornerBracket, styles.cornerTL]} />
                  <View style={[styles.cornerBracket, styles.cornerTR]} />
                  <View style={[styles.cornerBracket, styles.cornerBL]} />
                  <View style={[styles.cornerBracket, styles.cornerBR]} />
                </View>
                <Text style={styles.guideText}>Align face within frame</Text>
              </View>
            )}
          </CameraView>
        )
      ) : (
        <View style={styles.permissionBox}>
          <MaterialCommunityIcons name="camera-off-outline" size={48} color={COLORS.textTertiary} />
          <Text style={styles.permissionTitle}>Camera Access Needed</Text>
          <Text style={styles.permissionDesc}>
            {!cameraAvailable ? 'No camera detected.' : 'Allow camera to scan faces.'}
          </Text>
          {cameraAvailable && (
            <TouchableOpacity onPress={Platform.OS === 'web' ? startWebCamera : requestPermission} style={styles.grantBtn}>
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 13 }}>Allow Camera</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Bottom Controls */}
      {canUseCamera && (
        <View style={styles.bottomControls}>
          <View style={{ flex: 1 }} />
          
          <TouchableOpacity style={styles.captureOuterRing} onPress={takePicture}>
            <View style={styles.captureInnerCircle}>
              <MaterialCommunityIcons name="camera" size={28} color={COLORS.appleBlue} />
            </View>
          </TouchableOpacity>

          <View style={styles.flipContainer}>
            {Platform.OS !== 'web' && (
              <TouchableOpacity style={styles.flipBtn} onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}>
                <MaterialCommunityIcons name="camera-flip-outline" size={26} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    zIndex: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceGuideFrame: { width: 180, height: 210, position: 'relative' },
  cornerBracket: { position: 'absolute', width: 28, height: 28, borderColor: COLORS.appleBlue },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },
  guideText: { color: COLORS.appleBlue, fontSize: 12, fontWeight: '600', marginTop: 14 },
  permissionBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#000',
  },
  permissionTitle: { color: '#FFF', fontSize: 16, fontWeight: '700', marginTop: 10 },
  permissionDesc: { color: '#AAA', textAlign: 'center', fontSize: 13, marginVertical: 10 },
  grantBtn: {
    backgroundColor: COLORS.appleBlue, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 10, paddingHorizontal: 20, marginTop: 4,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  captureOuterRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInnerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipContainer: {
    flex: 1,
    alignItems: 'center',
  },
  flipBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
