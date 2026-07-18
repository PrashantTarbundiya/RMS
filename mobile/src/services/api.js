// API service layer for communicating with the Flask backend
import { API_CONFIG } from '../theme';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// Helper to convert an image URI to the appropriate format for FormData
async function getFileObject(uri, defaultName = 'photo.jpg') {
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

  const files = await Promise.all(
    imageUris.map((uri, index) => getFileObject(uri, `photo_${index}.jpg`))
  );

  files.forEach((file, index) => {
    const filename = imageUris[index].split('/').pop() || `photo_${index}.jpg`;
    if (Platform.OS === 'web') {
      formData.append('extra_files', file, filename);
    } else {
      formData.append('extra_files', file);
    }
  });

  const res = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
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
  let filename = imageUri.split('/').pop() || 'photo.jpg';
  if (!/\.(jpg|jpeg|png|webp|bmp)$/i.test(filename)) filename += '.jpg';
  
  const file = await getFileObject(imageUri, filename);

  if (Platform.OS === 'web') {
    formData.append('image', file, filename);
  } else {
    formData.append('image', file);
  }

  const res = await fetch(`${BASE_URL}/predict`, {
    method: 'POST',
    body: formData,
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
// Get list of photos for a person
export async function getPersonPhotos(name) {
  const res = await fetch(`${BASE_URL}/persons/${name}/photos`);
  if (!res.ok) throw new Error('Failed to fetch person photos');
  return res.json();
}

// Serves a specific cleaned photo file URL
export function getPersonPhotoUrl(name, angle, filename) {
  return `${BASE_URL}/persons/${name}/photos/${angle}/${filename}`;
}

// Delete a specific photo
export async function deletePersonPhoto(name, angle, filename) {
  const res = await fetch(`${BASE_URL}/persons/${name}/photos/${angle}/${filename}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Delete photo failed' }));
    throw new Error(err.error || 'Delete photo failed');
  }
  return res.json();
}

// Move a photo to a different angle
export async function movePersonPhoto(name, sourceAngle, targetAngle, filename) {
  const res = await fetch(`${BASE_URL}/persons/${name}/photos/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source_angle: sourceAngle,
      target_angle: targetAngle,
      filename: filename
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Move photo failed' }));
    throw new Error(err.error || 'Move photo failed');
  }
  return res.json();
}

// Rename a person
export async function renamePerson(oldName, newName) {
  const res = await fetch(`${BASE_URL}/persons/${oldName}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ new_name: newName })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Rename person failed' }));
    throw new Error(err.error || 'Rename person failed');
  }
  return res.json();
}

// Delete a person entirely
export async function deletePerson(name) {
  const res = await fetch(`${BASE_URL}/persons/${name}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Delete person failed' }));
    throw new Error(err.error || 'Delete person failed');
  }
  return res.json();
}

// Trigger retraining
export async function triggerRetrain(name, epochs = 10) {
  const res = await fetch(`${BASE_URL}/persons/${name}/retrain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ epochs: parseInt(epochs) })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Retraining failed' }));
    throw new Error(err.error || 'Retraining failed');
  }
  return res.json();
}
