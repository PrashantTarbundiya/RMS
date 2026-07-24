/**
 * offlineQueue.js — Offline Queue for RMS Mobile App.
 *
 * Phase 9: Mobile Parity & Offline Resilience
 *
 * Provides:
 *   1. Queue management — stores recognition results locally when offline
 *   2. Network monitoring — detects connectivity changes
 *   3. Auto-sync — flushes queue when connectivity returns
 *   4. Conflict resolution — handles duplicates and ordering
 *   5. Persistence — survives app restarts via AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { api } from './api';

const QUEUE_STORAGE_KEY = '@rms_offline_queue';
const SYNC_STATUS_KEY = '@rms_sync_status';
const MAX_QUEUE_SIZE = 500;
const MAX_RETRY_ATTEMPTS = 3;
const SYNC_BATCH_SIZE = 20;

// ─── Queue State ──────────────────────────────────────────────────────

let _queue = [];
let _isOnline = true;
let _isSyncing = false;
let _listeners = [];
let _unsubscribeNetInfo = null;

/**
 * Initialize the offline queue system.
 * Call this once at app startup.
 */
export async function initOfflineQueue() {
  // Load persisted queue from storage
  try {
    const stored = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
    if (stored) {
      _queue = JSON.parse(stored);
      console.log(`[OfflineQueue] Loaded ${_queue.length} items from storage`);
    }
  } catch (e) {
    console.warn('[OfflineQueue] Failed to load persisted queue:', e);
    _queue = [];
  }

  // Start network monitoring
  _unsubscribeNetInfo = NetInfo.addEventListener(state => {
    const wasOffline = !_isOnline;
    _isOnline = state.isConnected && state.isInternetReachable !== false;

    if (wasOffline && _isOnline) {
      console.log('[OfflineQueue] Network restored — triggering sync');
      syncQueue();
    }

    _notifyListeners();
  });

  // Check initial state
  const state = await NetInfo.fetch();
  _isOnline = state.isConnected && state.isInternetReachable !== false;

  // If online and queue has items, sync immediately
  if (_isOnline && _queue.length > 0) {
    syncQueue();
  }

  return { queueSize: _queue.length, isOnline: _isOnline };
}

/**
 * Cleanup: remove network listener.
 */
export function destroyOfflineQueue() {
  if (_unsubscribeNetInfo) {
    _unsubscribeNetInfo();
    _unsubscribeNetInfo = null;
  }
}

// ─── Queue Operations ─────────────────────────────────────────────────

/**
 * Enqueue a recognition result for later sync.
 *
 * @param {Object} item - The recognition result to queue
 * @param {string} item.type - Event type ('recognition', 'attendance', 'feedback')
 * @param {Object} item.data - The actual data payload
 * @returns {Object} - { queued: boolean, queueSize: number }
 */
export async function enqueue(item) {
  if (_queue.length >= MAX_QUEUE_SIZE) {
    // Drop oldest item to make room
    _queue.shift();
    console.warn('[OfflineQueue] Queue full — dropped oldest item');
  }

  const entry = {
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: new Date().toISOString(),
    type: item.type || 'recognition',
    data: item.data,
    retryCount: 0,
    status: 'pending', // 'pending' | 'syncing' | 'synced' | 'failed'
  };

  _queue.push(entry);
  await _persistQueue();
  _notifyListeners();

  console.log(`[OfflineQueue] Enqueued ${entry.type} (${_queue.length} items in queue)`);

  return { queued: true, queueSize: _queue.length, entryId: entry.id };
}

/**
 * Get the current queue contents and status.
 */
export function getQueueStatus() {
  return {
    items: [..._queue],
    size: _queue.length,
    isOnline: _isOnline,
    isSyncing: _isSyncing,
    pending: _queue.filter(i => i.status === 'pending').length,
    failed: _queue.filter(i => i.status === 'failed').length,
  };
}

/**
 * Clear the entire queue (e.g., after confirmed data loss is acceptable).
 */
export async function clearQueue() {
  _queue = [];
  await _persistQueue();
  _notifyListeners();
  return { cleared: true };
}

/**
 * Subscribe to queue changes.
 * @param {Function} listener - Callback receiving { size, isOnline, isSyncing }
 * @returns {Function} - Unsubscribe function
 */
export function onQueueChange(listener) {
  _listeners.push(listener);
  return () => {
    _listeners = _listeners.filter(l => l !== listener);
  };
}

// ─── Sync Engine ──────────────────────────────────────────────────────

/**
 * Sync queued items to the server.
 * Called automatically when network restores, or manually.
 *
 * @returns {Object} - { synced: number, failed: number, remaining: number }
 */
export async function syncQueue() {
  if (_isSyncing) {
    console.log('[OfflineQueue] Sync already in progress');
    return { synced: 0, failed: 0, remaining: _queue.length };
  }

  if (!_isOnline) {
    console.log('[OfflineQueue] Cannot sync — offline');
    return { synced: 0, failed: 0, remaining: _queue.length };
  }

  if (_queue.length === 0) {
    return { synced: 0, failed: 0, remaining: 0 };
  }

  _isSyncing = true;
  _notifyListeners();

  let synced = 0;
  let failed = 0;

  // Process in batches
  const pendingItems = _queue.filter(i => i.status === 'pending' || i.status === 'failed');
  const batch = pendingItems.slice(0, SYNC_BATCH_SIZE);

  for (const item of batch) {
    try {
      item.status = 'syncing';
      await _syncItem(item);
      item.status = 'synced';
      synced++;
    } catch (error) {
      item.retryCount++;
      if (item.retryCount >= MAX_RETRY_ATTEMPTS) {
        item.status = 'failed';
        item.lastError = error.message || 'Unknown error';
        failed++;
      } else {
        item.status = 'pending'; // Will retry next sync
      }
      console.warn(`[OfflineQueue] Failed to sync item ${item.id}:`, error.message);
    }
  }

  // Remove synced items
  _queue = _queue.filter(i => i.status !== 'synced');
  await _persistQueue();

  _isSyncing = false;
  _notifyListeners();

  // Update sync status
  await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify({
    lastSync: new Date().toISOString(),
    synced,
    failed,
    remaining: _queue.length,
  }));

  console.log(`[OfflineQueue] Sync complete: ${synced} synced, ${failed} failed, ${_queue.length} remaining`);

  // If there are more items and we're still online, schedule another batch
  if (_queue.filter(i => i.status === 'pending').length > 0 && _isOnline) {
    setTimeout(() => syncQueue(), 1000);
  }

  return { synced, failed, remaining: _queue.length };
}

/**
 * Sync a single item to the server.
 */
async function _syncItem(item) {
  switch (item.type) {
    case 'recognition':
      return _syncRecognitionResult(item);
    case 'attendance':
      return _syncAttendanceLog(item);
    case 'feedback':
      return _syncFeedback(item);
    default:
      // Generic sync via bulk endpoint
      return _syncGeneric(item);
  }
}

async function _syncRecognitionResult(item) {
  const response = await api.post('/offline/sync', {
    type: 'recognition',
    items: [item.data],
    client_timestamp: item.timestamp,
  });
  return response.data;
}

async function _syncAttendanceLog(item) {
  const response = await api.post('/offline/sync', {
    type: 'attendance',
    items: [item.data],
    client_timestamp: item.timestamp,
  });
  return response.data;
}

async function _syncFeedback(item) {
  const response = await api.post('/predict/feedback', item.data);
  return response.data;
}

async function _syncGeneric(item) {
  const response = await api.post('/offline/sync', {
    type: item.type,
    items: [item.data],
    client_timestamp: item.timestamp,
  });
  return response.data;
}

// ─── Persistence ──────────────────────────────────────────────────────

async function _persistQueue() {
  try {
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(_queue));
  } catch (e) {
    console.warn('[OfflineQueue] Failed to persist queue:', e);
  }
}

function _notifyListeners() {
  const status = getQueueStatus();
  _listeners.forEach(l => {
    try { l(status); } catch (e) { /* ignore */ }
  });
}

// ─── Smart Recognition Wrapper ────────────────────────────────────────

/**
 * Wrapper around predictImage that handles offline scenarios.
 * If online, sends directly. If offline, queues for later sync.
 *
 * @param {Function} predictFn - The original predictImage function
 * @param {string} imageUri - URI of the captured image
 * @param {Object} metadata - Additional metadata (camera_id, location, etc.)
 * @returns {Object} - { result, offline: boolean }
 */
export async function predictWithOfflineSupport(predictFn, imageUri, metadata = {}) {
  if (_isOnline) {
    try {
      const result = await predictFn(imageUri);
      return { result, offline: false };
    } catch (error) {
      // Network error during request — queue it
      if (error.message?.includes('Network') || error.code === 'ECONNABORTED') {
        _isOnline = false;
        _notifyListeners();
      } else {
        throw error; // Non-network error, don't queue
      }
    }
  }

  // Offline: queue the recognition for later
  const offlineResult = {
    timestamp: new Date().toISOString(),
    imageUri,
    status: 'queued_offline',
    metadata,
  };

  await enqueue({
    type: 'recognition',
    data: offlineResult,
  });

  return {
    result: {
      label: '[Offline — Queued]',
      confidence: 0,
      status: 'offline',
      message: 'Recognition queued. Will sync when network returns.',
    },
    offline: true,
  };
}

// ─── Get Last Sync Info ───────────────────────────────────────────────

export async function getLastSyncInfo() {
  try {
    const stored = await AsyncStorage.getItem(SYNC_STATUS_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    return null;
  }
}
