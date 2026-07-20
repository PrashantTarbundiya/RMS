// API service layer for communicating with the Flask backend
import { API_CONFIG } from '../theme';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import axios from 'axios';

// Helper to convert an image URI to the appropriate format for FormData
export async function getFileObject(uri, defaultName = 'photo.jpg') {
  let filename = uri.split('/').pop() || defaultName;
  // Ensure the filename has a valid image extension, which is required by the backend
  if (!/\.(jpg|jpeg|png|webp|bmp)$/i.test(filename)) {
    filename += '.jpg';
  }
  const match = /\.([^.]+)$/.exec(filename);
  const type = match ? `image/${match[1] === 'jpg' ? 'jpeg' : match[1]}` : 'image/jpeg';

  if (Platform.OS === 'web') {
    try {
      if (uri.startsWith('data:image')) {
        // Fast direct conversion of base64 to Blob
        const arr = uri.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
      } else {
        const response = await fetch(uri);
        const blob = await response.blob();
        return blob;
      }
    } catch (e) {
      console.warn("[API] Failed to convert URI to Blob on Web, falling back:", e);
    }
  }

  return {
    uri,
    name: filename,
    type,
  };
}

let BASE_URL = API_CONFIG.BASE_URL;

// Allow runtime override of server URL
export function setServerUrl(url) {
  BASE_URL = url.replace(/\/+$/, '');
  if (!BASE_URL.endsWith('/api')) {
    BASE_URL = BASE_URL + '/api';
  }
  api.defaults.baseURL = BASE_URL;
}

export function getServerUrl() {
  return BASE_URL;
}

// ─── Axios Instance ──────────────────────────────────────────────────────────

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

let _interceptorSetup = false;

export function setupAuthInterceptor(onTokenRefresh) {
  if (_interceptorSetup) return;
  
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          return await onTokenRefresh(originalRequest);
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    }
  );
  _interceptorSetup = true;
}

// ─── API Endpoints (rewritten to use Axios instance) ──────────────────────────

export async function checkHealth() {
  try {
    const response = await api.get('/health', { timeout: 3000 });
    return response.data;
  } catch (error) {
    throw new Error('Server unreachable');
  }
}

export async function getDashboardStats() {
  const response = await api.get('/dashboard');
  return response.data;
}

export async function clearHistory() {
  const response = await api.delete('/history');
  return response.data;
}

export async function predictImage(imageUri, config = {}) {
  const formData = new FormData();
  const fileObj = await getFileObject(imageUri, 'capture.jpg');
  formData.append('image', fileObj);

  const response = await api.post('/predict', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    ...config,
  });
  return response.data;
}

export async function getPersons() {
  const response = await api.get('/persons');
  return response.data;
}

export async function getPersonPhotos(name) {
  const response = await api.get(`/persons/${encodeURIComponent(name)}/photos`);
  return response.data;
}

export async function deletePersonPhoto(name, angle, filename) {
  const response = await api.delete(`/persons/${encodeURIComponent(name)}/photos/${angle}/${filename}`);
  return response.data;
}

export async function movePersonPhoto(name, sourceAngle, targetAngle, filename) {
  const response = await api.post(`/persons/${encodeURIComponent(name)}/photos/move`, {
    source_angle: sourceAngle,
    target_angle: targetAngle,
    filename: filename
  });
  return response.data;
}

export async function renamePerson(oldName, newName) {
  const response = await api.put(`/persons/${encodeURIComponent(oldName)}`, {
    new_name: newName
  });
  return response.data;
}

export async function deletePerson(name) {
  const response = await api.delete(`/persons/${encodeURIComponent(name)}`);
  return response.data;
}

export async function triggerRetrain(name, epochs = 5) {
  const response = await api.post(`/persons/${encodeURIComponent(name)}/retrain`, { epochs });
  return response.data;
}

export async function uploadPerson(personName, imageUris) {
  const formData = new FormData();
  formData.append('person_name', personName);

  for (let i = 0; i < imageUris.length; i++) {
    const fileObj = await getFileObject(imageUris[i], `photo_${i}.jpg`);
    formData.append('files[]', fileObj);
  }

  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function getTrainingStatus() {
  const response = await api.get('/train/status');
  return response.data;
}

export async function getConfig() {
  const response = await api.get('/config');
  return response.data;
}

export async function saveConfig(config) {
  const response = await api.post('/config', config);
  return response.data;
}

export async function exportOnnx() {
  const response = await api.post('/export-onnx');
  return response.data;
}

export async function resetModels(deleteDataset = false) {
  const response = await api.post('/models/reset', { delete_dataset: deleteDataset });
  return response.data;
}

export async function submitFeedback(predictionId, isCorrect, correctName = null, actionTaken = 'confirmed') {
  const response = await api.post('/predict/feedback', {
    prediction_id: predictionId,
    is_correct: isCorrect,
    correct_name: correctName,
    action_taken: actionTaken
  });
  return response.data;
}
