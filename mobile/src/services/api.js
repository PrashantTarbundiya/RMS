// API service layer for communicating with the Flask backend
import { API_CONFIG } from '../theme';
import * as FileSystem from 'expo-file-system';

let BASE_URL = API_CONFIG.BASE_URL;

// Allow runtime override of server URL
export function setServerUrl(url) {
  BASE_URL = url.replace(/\/+$/, '');
  if (!BASE_URL.endsWith('/api')) {
    BASE_URL = BASE_URL + '/api';
  }
}

export function getServerUrl() {
  return BASE_URL;
}

// Check if server is reachable
export async function pingServer() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${BASE_URL}/ping`, { signal: controller.signal });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

// Get list of all trained persons
export async function getPersons() {
  const res = await fetch(`${BASE_URL}/persons`);
  if (!res.ok) throw new Error('Failed to fetch persons');
  return res.json();
}

// Upload images and trigger training for a new person
export async function uploadPerson(personName, imageUris, epochs = 5) {
  const formData = new FormData();
  formData.append('person_name', personName);
  formData.append('epochs', String(epochs));

  imageUris.forEach((uri, index) => {
    const filename = uri.split('/').pop() || `photo_${index}.jpg`;
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('extra_files', {
      uri,
      name: filename,
      type,
    });
  });

  const res = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error || 'Upload failed');
  }

  return res.json();
}

// Run face recognition prediction on an image
export async function predict(imageUri) {
  const formData = new FormData();
  const filename = imageUri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('image', {
    uri: imageUri,
    name: filename,
    type,
  });

  const res = await fetch(`${BASE_URL}/predict`, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Prediction failed' }));
    throw new Error(err.error || 'Prediction failed');
  }

  return res.json();
}

// Export ONNX model on server
export async function exportOnnx() {
  const res = await fetch(`${BASE_URL}/export-onnx`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Export failed' }));
    throw new Error(err.error || 'Export failed');
  }
  return res.json();
}

// Reset all models on server
export async function resetModels() {
  const res = await fetch(`${BASE_URL}/models/reset`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Reset failed' }));
    throw new Error(err.error || 'Reset failed');
  }
  return res.json();
}

// Get training status (polling-based since SSE is complex in React Native)
export async function getTrainingStatus() {
  try {
    const res = await fetch(`${BASE_URL}/train/status`, {
      headers: { 'Accept': 'text/event-stream' },
    });
    const text = await res.text();
    const lines = text.split('\n')
      .filter(line => line.startsWith('data: '))
      .map(line => line.replace('data: ', ''));
    const isDone = lines.includes('[DONE]');
    return {
      logs: lines.filter(l => l !== '[DONE]'),
      isDone,
    };
  } catch {
    return { logs: [], isDone: true };
  }
}

// Download a model artifact file
export async function downloadModelFile(filename) {
  const url = `${BASE_URL}/download-file?name=${filename}`;
  const localPath = FileSystem.documentDirectory + filename;

  const download = FileSystem.createDownloadResumable(url, localPath);
  const result = await download.downloadAsync();

  return result.uri;
}

// Get dashboard stats
export async function getDashboard() {
  const res = await fetch(`${BASE_URL}/dashboard`);
  if (!res.ok) throw new Error('Failed to fetch dashboard data');
  return res.json();
}

// Clear recognition history
export async function clearHistory() {
  const res = await fetch(`${BASE_URL}/history`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to clear history');
  return res.json();
}

