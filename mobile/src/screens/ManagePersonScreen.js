import React, { useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, Image, Alert, FlatList, TouchableOpacity,
} from 'react-native';
import {
  Text, TextInput, Portal, Dialog, RadioButton, ActivityIndicator, Snackbar, IconButton
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, APPLE_GLASS_STYLE } from '../theme';
import {
  getPersonPhotos,
  getPersonPhotoUrl,
  deletePersonPhoto,
  movePersonPhoto,
  renamePerson,
  deletePerson,
  triggerRetrain
} from '../services/api';

export default function ManagePersonScreen({ route, navigation }) {
  const { personName: routePersonName } = route.params;

  const [personName, setPersonName] = useState(routePersonName || '');
  const [originalName, setOriginalName] = useState(routePersonName || '');
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [epochs, setEpochs] = useState('10');

  // Dialog states for moving photo
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [moveTarget, setMoveTarget] = useState('');

  // Snackbar
  const [snackVisible, setSnackVisible] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [snackType, setSnackType] = useState('success');

  function showSnack(type, message) {
    setSnackType(type);
    setSnackMessage(message);
    setSnackVisible(true);
  }

  const fetchPhotos = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getPersonPhotos(originalName);
      setPhotos(data);
    } catch (err) {
      console.warn(err);
      showSnack('error', 'Failed to fetch subject photos.');
    } finally {
      setIsLoading(false);
    }
  }, [originalName]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const handleRename = async () => {
    const trimmed = personName.trim().replace(/\s+/g, '_');
    if (!trimmed) {
      showSnack('error', 'Subject name cannot be empty.');
      return;
    }
    if (trimmed === originalName) return;

    setIsActionLoading(true);
    try {
      await renamePerson(originalName, trimmed);
      setOriginalName(trimmed);
      setPersonName(trimmed);
      showSnack('success', `Renamed record to ${trimmed.replace(/_/g, ' ')}`);
    } catch (err) {
      console.warn(err);
      showSnack('error', err.message || 'Failed to rename.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeletePerson = () => {
    Alert.alert(
      'Delete Profile',
      `Are you sure you want to delete ${originalName.replace(/_/g, ' ')} entirely? This removes all training photos.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsActionLoading(true);
            try {
              await deletePerson(originalName);
              showSnack('success', 'Profile deleted successfully.');
              navigation.goBack();
            } catch (err) {
              console.warn(err);
              showSnack('error', err.message || 'Failed to delete profile.');
            } finally {
              setIsActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleRetrain = async () => {
    const numEpochs = parseInt(epochs);
    if (isNaN(numEpochs) || numEpochs < 1 || numEpochs > 100) {
      showSnack('error', 'Epochs must be between 1 and 100.');
      return;
    }

    setIsActionLoading(true);
    try {
      const res = await triggerRetrain(originalName, numEpochs);
      Alert.alert('Fine-Tuning Started', res.message || 'Models are training in background.', [
        { text: 'OK', onPress: () => navigation.navigate('Models') }
      ]);
    } catch (err) {
      console.warn(err);
      showSnack('error', err.message || 'Failed to trigger training.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeletePhoto = (photo) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this cropped dataset photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsActionLoading(true);
            try {
              await deletePersonPhoto(originalName, photo.angle, photo.filename);
              fetchPhotos();
              showSnack('success', 'Photo deleted.');
            } catch (err) {
              console.warn(err);
              showSnack('error', err.message || 'Failed to delete photo.');
            } finally {
              setIsActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleOpenMoveDialog = (photo) => {
    setSelectedPhoto(photo);
    setMoveTarget(photo.angle);
    setShowMoveDialog(true);
  };

  const handleMovePhoto = async () => {
    if (!selectedPhoto) return;
    if (selectedPhoto.angle === moveTarget) {
      setShowMoveDialog(false);
      return;
    }

    setIsActionLoading(true);
    setShowMoveDialog(false);
    try {
      await movePersonPhoto(originalName, selectedPhoto.angle, moveTarget, selectedPhoto.filename);
      fetchPhotos();
      showSnack('success', `Moved photo to ${moveTarget} profile.`);
    } catch (err) {
      console.warn(err);
      showSnack('error', err.message || 'Failed to move photo.');
    } finally {
      setIsActionLoading(false);
      setSelectedPhoto(null);
    }
  };

  const renderPhotoItem = ({ item }) => {
    const photoUrl = getPersonPhotoUrl(originalName, item.angle, item.filename);

    return (
      <View style={styles.photoGlassCard}>
        <Image source={{ uri: photoUrl }} style={styles.photo} />
        <View style={styles.photoActionsRow}>
          <IconButton
            icon="swap-horizontal"
            iconColor={COLORS.appleBlue}
            size={16}
            style={styles.photoActionGlassBtn}
            onPress={() => handleOpenMoveDialog(item)}
            disabled={isActionLoading}
          />
          <IconButton
            icon="delete-outline"
            iconColor={COLORS.appleRed}
            size={16}
            style={[styles.photoActionGlassBtn, { backgroundColor: 'rgba(255, 69, 58, 0.15)' }]}
            onPress={() => handleDeletePhoto(item)}
            disabled={isActionLoading}
          />
        </View>
      </View>
    );
  };

  const frontalPhotos = photos.filter(p => p.angle === 'frontal');
  const leftPhotos = photos.filter(p => p.angle === 'left');
  const rightPhotos = photos.filter(p => p.angle === 'right');
  const extraPhotos = photos.filter(p => p.angle === 'extra');

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary }}>
      <View style={styles.appleWallpaperOrbPurple} />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Header Profile Glass Widget */}
        <View style={styles.profileHeaderGlass}>
          <View style={styles.avatarGlassCircle}>
            <MaterialCommunityIcons name="account" size={32} color={COLORS.appleBlue} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileTitle}>{originalName.replace(/_/g, ' ')}</Text>
            <Text style={styles.profileSubtitle}>Database Subject Profile</Text>
          </View>
        </View>

        {/* Profile Controls Card */}
        <View style={styles.appleGlassCard}>
          <Text style={styles.cardHeaderTitle}>PROFILE SETTINGS</Text>
          <View style={styles.divider} />

          <Text style={styles.inputHeaderLabel}>RENAME SUBJECT</Text>
          <View style={styles.inputRow}>
            <TextInput
              mode="outlined"
              value={personName}
              onChangeText={setPersonName}
              placeholder="e.g. John_Doe"
              dense
              left={<TextInput.Icon icon="account-edit-outline" color={COLORS.appleBlue} />}
              outlineColor="rgba(255, 255, 255, 0.15)"
              activeOutlineColor={COLORS.appleBlue}
              textColor={COLORS.textPrimary}
              placeholderTextColor={COLORS.textTertiary}
              style={styles.glassInput}
              editable={!isActionLoading}
              theme={{ colors: { onSurfaceVariant: COLORS.textSecondary } }}
            />
            <TouchableOpacity
              onPress={handleRename}
              disabled={isActionLoading}
              style={styles.saveGlassBtn}
            >
              <Text style={{ color: COLORS.textPrimary, fontSize: 13, fontWeight: '700' }}>Rename</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.inputHeaderLabel, { marginTop: SPACING.md }]}>FINE-TUNING EPOCHS</Text>
          <View style={styles.inputRow}>
            <TextInput
              mode="outlined"
              value={epochs}
              onChangeText={setEpochs}
              keyboardType="number-pad"
              placeholder="e.g. 10"
              dense
              left={<TextInput.Icon icon="sync" color={COLORS.appleBlue} />}
              outlineColor="rgba(255, 255, 255, 0.15)"
              activeOutlineColor={COLORS.appleBlue}
              textColor={COLORS.textPrimary}
              placeholderTextColor={COLORS.textTertiary}
              style={styles.glassInput}
              editable={!isActionLoading}
              theme={{ colors: { onSurfaceVariant: COLORS.textSecondary } }}
            />
            <TouchableOpacity
              onPress={handleRetrain}
              disabled={isActionLoading}
              style={styles.retrainAppleBtn}
            >
              <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>Retrain</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Photo Database Section */}
        <Text style={styles.sectionHeaderTitle}>TRAINED PHOTO DATABASE</Text>

        {isLoading ? (
          <ActivityIndicator color={COLORS.appleBlue} style={{ marginVertical: SPACING.lg }} animating />
        ) : photos.length === 0 ? (
          <View style={styles.appleGlassCard}>
            <Text style={styles.emptyText}>No dataset photos found for this subject.</Text>
          </View>
        ) : (
          <View style={{ gap: SPACING.lg }}>
            {frontalPhotos.length > 0 && (
              <AngleSection title="FRONTAL" count={frontalPhotos.length} data={frontalPhotos} renderItem={renderPhotoItem} />
            )}
            {leftPhotos.length > 0 && (
              <AngleSection title="LEFT" count={leftPhotos.length} data={leftPhotos} renderItem={renderPhotoItem} />
            )}
            {rightPhotos.length > 0 && (
              <AngleSection title="RIGHT" count={rightPhotos.length} data={rightPhotos} renderItem={renderPhotoItem} />
            )}
            {extraPhotos.length > 0 && (
              <AngleSection title="EXTRA" count={extraPhotos.length} data={extraPhotos} renderItem={renderPhotoItem} />
            )}
          </View>
        )}

        {/* Danger Zone */}
        <Text style={[styles.sectionHeaderTitle, { color: COLORS.appleRed, marginTop: SPACING.xl }]}>⚠️ DANGER ZONE</Text>
        <View style={[styles.appleGlassCard, { borderColor: 'rgba(255, 69, 58, 0.35)' }]}>
          <Text style={styles.cardDescText}>
            Delete this subject profile entirely from dataset and remove all trained classifications.
          </Text>
          <TouchableOpacity style={styles.appleDangerBtn} onPress={handleDeletePerson} disabled={isActionLoading}>
            <MaterialCommunityIcons name="delete-forever-outline" size={20} color={COLORS.appleRed} />
            <Text style={styles.dangerBtnText}>Delete Entire Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Move Angle Dialog */}
      <Portal>
        <Dialog
          visible={showMoveDialog}
          onDismiss={() => setShowMoveDialog(false)}
          style={styles.appleGlassDialog}
        >
          <Dialog.Title style={{ color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' }}>
            Change Face Angle
          </Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginBottom: SPACING.md }}>
              Select correct face angle classification:
            </Text>
            <RadioButton.Group onValueChange={setMoveTarget} value={moveTarget}>
              {['frontal', 'left', 'right', 'extra'].map(angle => (
                <RadioButton.Item
                  key={angle}
                  label={`${angle.toUpperCase()} PROFILE`}
                  value={angle}
                  color={COLORS.appleBlue}
                  uncheckedColor={COLORS.textTertiary}
                  labelStyle={{ color: COLORS.textPrimary, fontSize: 13, fontWeight: '600' }}
                  style={styles.radioItem}
                />
              ))}
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <TouchableOpacity onPress={() => setShowMoveDialog(false)} style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text style={{ color: COLORS.textTertiary, fontWeight: '600', fontSize: 13 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleMovePhoto} style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text style={{ color: COLORS.appleBlue, fontWeight: '700', fontSize: 13 }}>Move</Text>
            </TouchableOpacity>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackVisible}
        onDismiss={() => setSnackVisible(false)}
        duration={3000}
        style={{
          backgroundColor: snackType === 'error' ? COLORS.errorContainer : COLORS.successContainer,
          borderWidth: 1,
          borderColor: snackType === 'error' ? COLORS.error + '40' : COLORS.success + '40',
        }}
      >
        <Text style={{ color: snackType === 'error' ? COLORS.appleRed : COLORS.appleGreen, fontSize: 12, fontWeight: '700' }}>
          {snackMessage}
        </Text>
      </Snackbar>
    </View>
  );
}

function AngleSection({ title, count, data, renderItem }) {
  return (
    <View>
      <View style={styles.angleTitleRow}>
        <MaterialCommunityIcons
          name={title === 'FRONTAL' ? 'face-man' : title === 'LEFT' ? 'arrow-left-bold' : title === 'RIGHT' ? 'arrow-right-bold' : 'dots-horizontal'}
          size={16}
          color={COLORS.appleBlue}
        />
        <Text style={styles.angleTitleText}>
          {title} PROFILE ({count})
        </Text>
      </View>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={item => item.filename}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.photoList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: SPACING.md },
  appleWallpaperOrbPurple: {
    position: 'absolute', top: -50, right: -50,
    width: 250, height: 250, borderRadius: 125,
    backgroundColor: 'rgba(94, 44, 165, 0.25)',
  },
  profileHeaderGlass: {
    ...APPLE_GLASS_STYLE,
    padding: SPACING.md, flexDirection: 'row', alignItems: 'center', gap: 12,
    marginBottom: SPACING.md,
  },
  avatarGlassCircle: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: 'rgba(10, 132, 255, 0.15)', borderWidth: 1, borderColor: 'rgba(10, 132, 255, 0.35)',
    justifyContent: 'center', alignItems: 'center',
  },
  profileTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '700' },
  profileSubtitle: { color: COLORS.textSecondary, fontSize: 12 },
  appleGlassCard: {
    ...APPLE_GLASS_STYLE, padding: SPACING.md, marginBottom: SPACING.md,
  },
  cardHeaderTitle: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 13, letterSpacing: 0.5, marginBottom: 4 },
  divider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)', marginBottom: SPACING.md },
  inputHeaderLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6 },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  glassInput: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.04)' },
  saveGlassBtn: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.12)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  retrainAppleBtn: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.appleBlue,
  },
  sectionHeaderTitle: {
    color: COLORS.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1,
    marginTop: SPACING.xs, marginBottom: SPACING.sm,
  },
  emptyText: { color: COLORS.textTertiary, fontSize: 13, textAlign: 'center' },
  angleTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  angleTitleText: { color: COLORS.appleBlue, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  photoList: { gap: 10 },
  photoGlassCard: {
    ...APPLE_GLASS_STYLE,
    width: 105, overflow: 'hidden',
  },
  photo: { width: 105, height: 105, resizeMode: 'cover' },
  photoActionsRow: { flexDirection: 'row', justifyContent: 'center', padding: 2, gap: 2 },
  photoActionGlassBtn: { backgroundColor: 'rgba(255, 255, 255, 0.12)', margin: 0, width: 32, height: 32 },
  cardDescText: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 18, marginBottom: SPACING.md },
  appleDangerBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    paddingVertical: 12, borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255, 69, 58, 0.15)', borderWidth: 1, borderColor: 'rgba(255, 69, 58, 0.35)',
  },
  dangerBtnText: { color: COLORS.appleRed, fontSize: 13, fontWeight: '700' },
  appleGlassDialog: {
    backgroundColor: 'rgba(24, 26, 42, 0.90)', borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.20)',
    borderTopColor: 'rgba(255, 255, 255, 0.42)',
  },
  radioItem: { paddingVertical: 2 },
});
