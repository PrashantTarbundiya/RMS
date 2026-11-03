import { API_BASE } from '../config';

/**
 * Constructs an authenticated photo URL for person reference photos.
 * Browser <img> tags do not send Authorization headers, so we attach
 * ?token=<access_token> query parameter which middleware.py validates.
 */
export function getAuthenticatedPhotoUrl(personName, angle, filename, explicitToken = null) {
  if (!personName || !filename) return '';
  const token = explicitToken 
    || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('rms_access_token') : null)
    || (typeof localStorage !== 'undefined' ? localStorage.getItem('rms_access_token') : null)
    || '';

  const cleanName = encodeURIComponent(personName.trim());
  const cleanAngle = encodeURIComponent(angle || 'frontal');
  const cleanFilename = encodeURIComponent(filename.trim());
  const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';

  return `${API_BASE}/persons/${cleanName}/photos/${cleanAngle}/${cleanFilename}${tokenParam}`;
}

