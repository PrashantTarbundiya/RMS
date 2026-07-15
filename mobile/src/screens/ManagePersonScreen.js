import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator, Image, Alert, FlatList,
  Modal
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme';
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

  // Modal states for moving photo
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [showMoveModal, setShowMoveModal] = useState(false);

  const fetchPhotos = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getPersonPhotos(originalName);
      setPhotos(data);
    } catch (err) {
      console.warn(err);
      Alert.alert('Error', 'Failed to fetch person photos.');
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
      Alert.alert('Validation', 'Name cannot be empty.');
      return;
    }
    if (trimmed === originalName) return;

    setIsActionLoading(true);
    try {
      await renamePerson(originalName, trimmed);
      setOriginalName(trimmed);
      setPersonName(trimmed);
      Alert.alert('Success', `Renamed successfully to ${trimmed.replace(/_/g, ' ')}`);
    } catch (err) {
      console.warn(err);
      Alert.alert('Error', err.message || 'Failed to rename person.');
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
              Alert.alert('Deleted', 'Profile deleted successfully.');
              navigation.goBack();
            } catch (err) {
              console.warn(err);
              Alert.alert('Error', err.message || 'Failed to delete profile.');
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
      Alert.alert('Validation', 'Epochs must be a number between 1 and 100.');
      return;
    }

    setIsActionLoading(true);
    try {
      const res = await triggerRetrain(originalName, numEpochs);
      Alert.alert('Fine-Tuning Started', res.message || 'Models are now training.', [
        { text: 'OK', onPress: () => navigation.navigate('Models') }
      ]);
    } catch (err) {
      console.warn(err);
      Alert.alert('Error', err.message || 'Failed to trigger training.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeletePhoto = (photo) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this cropped photo?',
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
            } catch (err) {
              console.warn(err);
              Alert.alert('Error', err.message || 'Failed to delete photo.');
            } finally {
              setIsActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleOpenMoveModal = (photo) => {
    setSelectedPhoto(photo);
    setShowMoveModal(true);
  };

  const handleMovePhoto = async (targetAngle) => {
    if (!selectedPhoto) return;
    if (selectedPhoto.angle === targetAngle) {
      setShowMoveModal(false);
      return;
    }

    setIsActionLoading(true);
    setShowMoveModal(false);
    try {
      await movePersonPhoto(originalName, selectedPhoto.angle, targetAngle, selectedPhoto.filename);
      fetchPhotos();
    } catch (err) {
      console.warn(err);
      Alert.alert('Error', err.message || 'Failed to move photo.');
    } finally {
      setIsActionLoading(false);
      setSelectedPhoto(null);
    }
  };

  const renderPhotoItem = ({ item }) => {
    const photoUrl = getPersonPhotoUrl(originalName, item.angle, item.filename);

    return (
      <View style={styles.photoCard}>
        <Image source={{ uri: photoUrl }} style={styles.photo} />
        <View style={styles.photoActions}>
          <TouchableOpacity
            style={styles.photoActionBtn}
            onPress={() => handleOpenMoveModal(item)}
            disabled={isActionLoading}
          >
            <Text style={styles.photoActionText}>🔄 Move</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.photoActionBtn, styles.photoDeleteBtn]}
            onPress={() => handleDeletePhoto(item)}
            disabled={isActionLoading}
          >
            <Text style={[styles.photoActionText, { color: COLORS.error }]}>🗑️ Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Group photos by angle
  const frontalPhotos = photos.filter(p => p.angle === 'frontal');
  const leftPhotos = photos.filter(p => p.angle === 'left');
  const rightPhotos = photos.filter(p => p.angle === 'right');
  const extraPhotos = photos.filter(p => p.angle === 'extra');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header Info */}
      <View style={styles.header}>
        <Text style={styles.title}>{originalName.replace(/_/g, ' ')}</Text>
        <Text style={styles.subtitle}>Database Profile Management</Text>
      </View>

      {/* Settings Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Profile Settings</Text>

        <Text style={styles.inputLabel}>RENAME PERSON</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={personName}
            onChangeText={setPersonName}
            placeholder="e.g. John_Doe"
            placeholderTextColor={COLORS.textTertiary}
            editable={!isActionLoading}
          />
          <TouchableOpacity
            style={[styles.saveBtn, isActionLoading && styles.disabledBtn]}
            onPress={handleRename}
            disabled={isActionLoading}
          >
            <Text style={styles.saveBtnText}>Rename</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.inputLabel, { marginTop: SPACING.md }]}>FINE-TUNING EPOCHS</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={epochs}
            onChangeText={setEpochs}
            keyboardType="number-pad"
            placeholder="e.g. 10"
            placeholderTextColor={COLORS.textTertiary}
            editable={!isActionLoading}
          />
          <TouchableOpacity
            style={[styles.retrainBtn, isActionLoading && styles.disabledBtn]}
            onPress={handleRetrain}
            disabled={isActionLoading}
          >
            <Text style={styles.retrainBtnText}>Retrain</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Cleaned Photos Section */}
      <Text style={styles.sectionTitle}>Trained Photo Database</Text>

      {isLoading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SPACING.lg }} />
      ) : photos.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No photos found for this person.</Text>
        </View>
      ) : (
        <View style={{ gap: SPACING.lg }}>
          {/* Frontal Angle */}
          {frontalPhotos.length > 0 && (
            <View>
              <Text style={styles.angleTitle}>FRONTAL PROFILE ({frontalPhotos.length})</Text>
              <FlatList
                data={frontalPhotos}
                renderItem={renderPhotoItem}
                keyExtractor={item => item.filename}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.photoList}
              />
            </View>
          )}

          {/* Left Profile */}
          {leftPhotos.length > 0 && (
            <View>
              <Text style={styles.angleTitle}>LEFT PROFILE ({leftPhotos.length})</Text>
              <FlatList
                data={leftPhotos}
                renderItem={renderPhotoItem}
                keyExtractor={item => item.filename}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.photoList}
              />
            </View>
          )}

          {/* Right Profile */}
          {rightPhotos.length > 0 && (
            <View>
              <Text style={styles.angleTitle}>RIGHT PROFILE ({rightPhotos.length})</Text>
              <FlatList
                data={rightPhotos}
                renderItem={renderPhotoItem}
                keyExtractor={item => item.filename}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.photoList}
              />
            </View>
          )}

          {/* Extra Angle */}
          {extraPhotos.length > 0 && (
            <View>
              <Text style={styles.angleTitle}>EXTRA PROFILE ({extraPhotos.length})</Text>
              <FlatList
                data={extraPhotos}
                renderItem={renderPhotoItem}
                keyExtractor={item => item.filename}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.photoList}
              />
            </View>
          )}
        </View>
      )}

      {/* Danger Zone */}
      <Text style={[styles.sectionTitle, { color: COLORS.danger, marginTop: SPACING.xl }]}>⚠️ Danger Zone</Text>
      <View style={[styles.card, { borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
        <Text style={styles.cardDesc}>
          Delete this person entirely from the dataset and remove all trained classifications.
        </Text>
        <TouchableOpacity
          style={[styles.dangerBtn, isActionLoading && styles.disabledBtn]}
          onPress={handleDeletePerson}
          disabled={isActionLoading}
        >
          <Text style={styles.dangerBtnText}>Delete Entire Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Move Angle Modal */}
      <Modal
        visible={showMoveModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMoveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Face Angle Category</Text>
            <Text style={styles.modalDesc}>Select the correct face angle for this cropped photo:</Text>

            {['frontal', 'left', 'right', 'extra'].map(angle => (
              <TouchableOpacity
                key={angle}
                style={[
                  styles.modalOption,
                  selectedPhoto?.angle === angle && styles.selectedOption
                ]}
                onPress={() => handleMovePhoto(angle)}
              >
                <Text style={[
                  styles.modalOptionText,
                  selectedPhoto?.angle === angle && styles.selectedOptionText
                ]}>
                  {angle.toUpperCase()} PROFILE
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowMoveModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingBottom: SPACING.xxl,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  cardTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.xs,
  },
  cardDesc: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.bgInput,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.md,
    height: 40,
    fontSize: FONT_SIZES.sm,
  },
  saveBtn: {
    backgroundColor: COLORS.bgCardHover,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },
  saveBtnText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontSize: FONT_SIZES.sm,
  },
  retrainBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },
  retrainBtnText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: FONT_SIZES.sm,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  angleTitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.primaryLight,
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  photoList: {
    paddingVertical: SPACING.xs,
    gap: SPACING.sm,
  },
  photoCard: {
    backgroundColor: COLORS.bgInput,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    width: 100,
  },
  photo: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
  },
  photoActions: {
    padding: 4,
    gap: 4,
  },
  photoActionBtn: {
    paddingVertical: 4,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.bgCard,
  },
  photoActionText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  photoDeleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  emptyCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textTertiary,
    fontSize: FONT_SIZES.sm,
  },
  dangerBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dangerBtnText: {
    color: COLORS.error,
    fontWeight: '700',
    fontSize: FONT_SIZES.md,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  modalDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  modalOption: {
    backgroundColor: COLORS.bgInput,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  selectedOption: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
  },
  modalOptionText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  selectedOptionText: {
    color: COLORS.primaryLight,
  },
  modalCancel: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  modalCancelText: {
    color: COLORS.textTertiary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
});
