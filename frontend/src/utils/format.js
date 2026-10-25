/**
 * format.js - Global formatting utilities for RMS Face AI.
 */

/**
 * Format a person's dataset/model label into a clean, human-readable Title Case name.
 * Example: 'vatsal_vadgama' -> 'Vatsal Vadgama'
 * Example: 'dhruvik' -> 'Dhruvik'
 * Example: 'john-doe_smith' -> 'John Doe Smith'
 */
export function formatPersonName(name) {
  if (!name || typeof name !== 'string') return 'Unknown';
  const trimmed = name.trim();
  if (
    ['Unknown', '[UNTRAINED]', 'Not Trained', 'Not Loaded', 'Error', 'Disabled', 'SPOOF', 'SPOOF DETECTED', 'NOT FOUND'].includes(trimmed)
  ) {
    return trimmed;
  }
  // Remove file extensions if any (.jpg, .png, etc.)
  const noExt = trimmed.replace(/\.(jpg|jpeg|png|webp)$/i, '');
  // Replace underscores and dashes with spaces
  const cleaned = noExt.replace(/[_-]+/g, ' ').trim();
  if (!cleaned) return 'Unknown';

  // Title-case each word
  return cleaned
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
