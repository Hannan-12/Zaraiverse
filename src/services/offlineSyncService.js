/**
 * Offline Data Sync Service (CI-4)
 * Supports syncing cached crop data and blogs automatically once reconnected
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import { db } from './firebase';

// Storage keys
const STORAGE_KEYS = {
  SYNC_QUEUE: '@sync_queue',
  CACHED_CROPS: '@cached_crops',
  CACHED_BLOGS: '@cached_blogs',
  CACHED_PRODUCTS: '@cached_products',
  CACHED_WEATHER: '@cached_weather',
  LAST_SYNC: '@last_sync',
  OFFLINE_CHANGES: '@offline_changes',
};

// Sync operation types
export const SyncOperation = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
};

// Sync status
export const SyncStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CONFLICT: 'conflict',
};

// Configuration
const CONFIG = {
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
  cacheExpiryHours: 24,
  syncCollections: ['crops', 'blogs', 'products'],
};

// State
let isOnline = true;
let syncInProgress = false;
let networkListener = null;
let syncQueue = [];
let onSyncStatusChange = null;

/**
 * Initialize the offline sync service
 */
export const initializeOfflineSync = async (onStatusChange = null) => {
  try {
    onSyncStatusChange = onStatusChange;

    // Load sync queue from storage
    const savedQueue = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    if (savedQueue) {
      syncQueue = JSON.parse(savedQueue);
    }

    // Set up network listener
    networkListener = NetInfo.addEventListener(state => {
      const wasOffline = !isOnline;
      isOnline = state.isConnected && state.isInternetReachable;

      if (wasOffline && isOnline) {
        console.log('[OfflineSync] Network restored, starting sync...');
        processSyncQueue();
      }

      if (onSyncStatusChange) {
        onSyncStatusChange({ isOnline, pendingChanges: syncQueue.length });
      }
    });

    // Check initial network state
    const initialState = await NetInfo.fetch();
    isOnline = initialState.isConnected && initialState.isInternetReachable;

    // If online, process any pending changes
    if (isOnline && syncQueue.length > 0) {
      processSyncQueue();
    }

    console.log('[OfflineSync] Service initialized');
    return true;
  } catch (error) {
    console.error('[OfflineSync] Initialization error:', error);
    return false;
  }
};

/**
 * Cleanup sync service
 */
export const cleanupOfflineSync = () => {
  if (networkListener) {
    networkListener();
    networkListener = null;
  }
};

/**
 * Check if device is online
 */
export const checkOnlineStatus = async () => {
  const state = await NetInfo.fetch();
  isOnline = state.isConnected && state.isInternetReachable;
  return isOnline;
};

/**
 * Add operation to sync queue
 */
export const queueOperation = async ({
  collection: collectionName,
  operation,
  documentId = null,
  data,
  userId,
}) => {
  const queueItem = {
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    collection: collectionName,
    operation,
    documentId,
    data,
    userId,
    status: SyncStatus.PENDING,
    retries: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  syncQueue.push(queueItem);
  await saveSyncQueue();

  // If online, try to sync immediately
  if (isOnline && !syncInProgress) {
    processSyncQueue();
  }

  return queueItem.id;
};

/**
 * Save sync queue to storage
 */
const saveSyncQueue = async () => {
  await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(syncQueue));
};

/**
 * Process sync queue
 */
export const processSyncQueue = async () => {
  if (syncInProgress || !isOnline || syncQueue.length === 0) {
    return;
  }

  syncInProgress = true;

  if (onSyncStatusChange) {
    onSyncStatusChange({ isOnline, syncing: true, pendingChanges: syncQueue.length });
  }

  console.log(`[OfflineSync] Processing ${syncQueue.length} queued operations...`);

  const processedItems = [];
  const failedItems = [];

  for (const item of syncQueue) {
    if (item.status === SyncStatus.COMPLETED) {
      processedItems.push(item);
      continue;
    }

    try {
      item.status = SyncStatus.IN_PROGRESS;
      item.updatedAt = new Date().toISOString();

      await executeOperation(item);

      item.status = SyncStatus.COMPLETED;
      item.completedAt = new Date().toISOString();
      processedItems.push(item);

      console.log(`[OfflineSync] Synced: ${item.collection}/${item.operation}`);
    } catch (error) {
      item.retries += 1;
      item.lastError = error.message;
      item.updatedAt = new Date().toISOString();

      if (item.retries >= CONFIG.maxRetries) {
        item.status = SyncStatus.FAILED;
        failedItems.push(item);
        console.error(`[OfflineSync] Failed after ${CONFIG.maxRetries} retries:`, item);
      } else {
        item.status = SyncStatus.PENDING;
        console.log(`[OfflineSync] Retry ${item.retries}/${CONFIG.maxRetries} for:`, item.id);
      }
    }
  }

  // Remove completed items from queue
  syncQueue = syncQueue.filter(
    item => !processedItems.includes(item) || item.status !== SyncStatus.COMPLETED
  );

  await saveSyncQueue();

  // Update last sync time
  await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());

  syncInProgress = false;

  if (onSyncStatusChange) {
    onSyncStatusChange({
      isOnline,
      syncing: false,
      pendingChanges: syncQueue.length,
      failedChanges: failedItems.length,
    });
  }

  console.log(`[OfflineSync] Sync complete. Processed: ${processedItems.length}, Failed: ${failedItems.length}`);
};

/**
 * Execute a single sync operation
 */
const executeOperation = async (item) => {
  const { collection: collectionName, operation, documentId, data } = item;

  switch (operation) {
    case SyncOperation.CREATE: {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        syncedAt: serverTimestamp(),
      });
      return docRef.id;
    }

    case SyncOperation.UPDATE: {
      if (!documentId) throw new Error('Document ID required for update');
      const docRef = doc(db, collectionName, documentId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
        syncedAt: serverTimestamp(),
      });
      return documentId;
    }

    case SyncOperation.DELETE: {
      if (!documentId) throw new Error('Document ID required for delete');
      const docRef = doc(db, collectionName, documentId);
      await deleteDoc(docRef);
      return documentId;
    }

    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
};

/**
 * Cache data for offline use
 */
export const cacheData = async (key, data) => {
  const cacheEntry = {
    data,
    cachedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + CONFIG.cacheExpiryHours * 60 * 60 * 1000).toISOString(),
  };

  await AsyncStorage.setItem(key, JSON.stringify(cacheEntry));
};

/**
 * Get cached data
 */
export const getCachedData = async (key) => {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;

    const cacheEntry = JSON.parse(cached);
    const expiresAt = new Date(cacheEntry.expiresAt);

    if (expiresAt < new Date()) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    return cacheEntry.data;
  } catch {
    return null;
  }
};

/**
 * Cache crops for offline access
 */
export const cacheCrops = async (userId) => {
  if (!isOnline) return;

  try {
    const cropsQuery = query(
      collection(db, 'crops'),
      where('farmerId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(cropsQuery);
    const crops = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    await cacheData(`${STORAGE_KEYS.CACHED_CROPS}_${userId}`, crops);
    console.log(`[OfflineSync] Cached ${crops.length} crops`);

    return crops;
  } catch (error) {
    console.error('[OfflineSync] Error caching crops:', error);
    return null;
  }
};

/**
 * Get crops (with offline fallback)
 */
export const getCrops = async (userId) => {
  // Try to get fresh data if online
  if (isOnline) {
    try {
      const crops = await cacheCrops(userId);
      if (crops) return { data: crops, fromCache: false };
    } catch (error) {
      console.log('[OfflineSync] Online fetch failed, using cache');
    }
  }

  // Fallback to cache
  const cachedCrops = await getCachedData(`${STORAGE_KEYS.CACHED_CROPS}_${userId}`);
  return { data: cachedCrops || [], fromCache: true };
};

/**
 * Cache blogs for offline access
 */
export const cacheBlogs = async () => {
  if (!isOnline) return;

  try {
    const blogsQuery = query(
      collection(db, 'blogs'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(blogsQuery);
    const blogs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    await cacheData(STORAGE_KEYS.CACHED_BLOGS, blogs);
    console.log(`[OfflineSync] Cached ${blogs.length} blogs`);

    return blogs;
  } catch (error) {
    console.error('[OfflineSync] Error caching blogs:', error);
    return null;
  }
};

/**
 * Get blogs (with offline fallback)
 */
export const getBlogs = async () => {
  if (isOnline) {
    try {
      const blogs = await cacheBlogs();
      if (blogs) return { data: blogs, fromCache: false };
    } catch {
      console.log('[OfflineSync] Online fetch failed, using cache');
    }
  }

  const cachedBlogs = await getCachedData(STORAGE_KEYS.CACHED_BLOGS);
  return { data: cachedBlogs || [], fromCache: true };
};

/**
 * Cache products for offline access
 */
export const cacheProducts = async () => {
  if (!isOnline) return;

  try {
    const productsQuery = query(
      collection(db, 'products'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(productsQuery);
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    await cacheData(STORAGE_KEYS.CACHED_PRODUCTS, products);
    console.log(`[OfflineSync] Cached ${products.length} products`);

    return products;
  } catch (error) {
    console.error('[OfflineSync] Error caching products:', error);
    return null;
  }
};

/**
 * Get products (with offline fallback)
 */
export const getProducts = async () => {
  if (isOnline) {
    try {
      const products = await cacheProducts();
      if (products) return { data: products, fromCache: false };
    } catch {
      console.log('[OfflineSync] Online fetch failed, using cache');
    }
  }

  const cachedProducts = await getCachedData(STORAGE_KEYS.CACHED_PRODUCTS);
  return { data: cachedProducts || [], fromCache: true };
};

/**
 * Create crop with offline support
 */
export const createCropOffline = async (cropData, userId) => {
  if (isOnline) {
    try {
      const docRef = await addDoc(collection(db, 'crops'), {
        ...cropData,
        farmerId: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { id: docRef.id, queued: false };
    } catch (error) {
      console.log('[OfflineSync] Online create failed, queueing');
    }
  }

  // Queue for later sync
  const queueId = await queueOperation({
    collection: 'crops',
    operation: SyncOperation.CREATE,
    data: { ...cropData, farmerId: userId },
    userId,
  });

  return { id: queueId, queued: true };
};

/**
 * Update crop with offline support
 */
export const updateCropOffline = async (cropId, cropData, userId) => {
  if (isOnline) {
    try {
      const cropRef = doc(db, 'crops', cropId);
      await updateDoc(cropRef, {
        ...cropData,
        updatedAt: serverTimestamp(),
      });
      return { id: cropId, queued: false };
    } catch {
      console.log('[OfflineSync] Online update failed, queueing');
    }
  }

  const queueId = await queueOperation({
    collection: 'crops',
    operation: SyncOperation.UPDATE,
    documentId: cropId,
    data: cropData,
    userId,
  });

  return { id: queueId, queued: true };
};

/**
 * Get sync queue status
 */
export const getSyncQueueStatus = () => {
  return {
    isOnline,
    syncing: syncInProgress,
    pendingCount: syncQueue.filter(i => i.status === SyncStatus.PENDING).length,
    failedCount: syncQueue.filter(i => i.status === SyncStatus.FAILED).length,
    queue: syncQueue,
  };
};

/**
 * Get last sync time
 */
export const getLastSyncTime = async () => {
  const lastSync = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  return lastSync ? new Date(lastSync) : null;
};

/**
 * Clear all cached data
 */
export const clearCache = async () => {
  const keys = Object.values(STORAGE_KEYS);
  await AsyncStorage.multiRemove(keys);
  syncQueue = [];
  console.log('[OfflineSync] Cache cleared');
};

/**
 * Force sync now
 */
export const forceSyncNow = async () => {
  const isConnected = await checkOnlineStatus();
  if (!isConnected) {
    return { success: false, message: 'No internet connection' };
  }

  await processSyncQueue();
  return { success: true, pendingChanges: syncQueue.length };
};

export default {
  initializeOfflineSync,
  cleanupOfflineSync,
  checkOnlineStatus,
  queueOperation,
  processSyncQueue,
  cacheData,
  getCachedData,
  cacheCrops,
  getCrops,
  cacheBlogs,
  getBlogs,
  cacheProducts,
  getProducts,
  createCropOffline,
  updateCropOffline,
  getSyncQueueStatus,
  getLastSyncTime,
  clearCache,
  forceSyncNow,
  SyncOperation,
  SyncStatus,
};
