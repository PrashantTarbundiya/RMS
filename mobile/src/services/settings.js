// Settings service for managing app & model preferences across Mobile app
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getConfig, saveConfig } from './api';

export const DEFAULT_SETTINGS = {
  showConfidence: true,
  enableDeepFace: false,
  confirmThreshold: 0.55,
};

export async function getLocalSettings() {
  try {
    const showConf = await AsyncStorage.getItem('showConfidence');
    const deepFace = await AsyncStorage.getItem('enableDeepFace');
    const thresh = await AsyncStorage.getItem('confirmThreshold');

    return {
      showConfidence: showConf !== null ? showConf === 'true' : DEFAULT_SETTINGS.showConfidence,
      enableDeepFace: deepFace !== null ? deepFace === 'true' : DEFAULT_SETTINGS.enableDeepFace,
      confirmThreshold: thresh !== null ? parseFloat(thresh) : DEFAULT_SETTINGS.confirmThreshold,
    };
  } catch (err) {
    return DEFAULT_SETTINGS;
  }
}

export async function saveLocalSettings(settings) {
  try {
    if (settings.showConfidence !== undefined) {
      await AsyncStorage.setItem('showConfidence', settings.showConfidence ? 'true' : 'false');
    }
    if (settings.enableDeepFace !== undefined) {
      await AsyncStorage.setItem('enableDeepFace', settings.enableDeepFace ? 'true' : 'false');
    }
    if (settings.confirmThreshold !== undefined) {
      await AsyncStorage.setItem('confirmThreshold', settings.confirmThreshold.toString());
    }
  } catch (err) {
    console.warn('Failed to save local settings to AsyncStorage', err);
  }
}

export async function syncSettingsWithServer() {
  try {
    const serverConfig = await getConfig();
    const local = await getLocalSettings();

    const confirmThreshold = serverConfig.CONFIRM_THRESHOLD !== undefined
      ? parseFloat(serverConfig.CONFIRM_THRESHOLD)
      : local.confirmThreshold;
    const enableDeepFace = serverConfig.ENABLE_DEEPFACE !== undefined
      ? !!serverConfig.ENABLE_DEEPFACE
      : local.enableDeepFace;

    await saveLocalSettings({
      confirmThreshold,
      enableDeepFace,
    });

    return {
      ...local,
      confirmThreshold,
      enableDeepFace,
    };
  } catch (err) {
    return await getLocalSettings();
  }
}
