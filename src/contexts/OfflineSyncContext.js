/**
 * Offline Sync Context (CI-4)
 * Provides offline sync status and functionality across the app
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  initializeOfflineSync,
  cleanupOfflineSync,
  checkOnlineStatus,
  getSyncQueueStatus,
  getLastSyncTime,
  forceSyncNow,
  cacheCrops,
  cacheBlogs,
  cacheProducts,
} from '../services/offlineSyncService';
import { useAuth } from './AuthContext';

const OfflineSyncContext = createContext();

export const OfflineSyncProvider = ({ children }) => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [failedChanges, setFailedChanges] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Handle sync status updates from the service
  const handleSyncStatusChange = useCallback((status) => {
    setIsOnline(status.isOnline);
    setIsSyncing(status.syncing || false);
    setPendingChanges(status.pendingChanges || 0);
    setFailedChanges(status.failedChanges || 0);
  }, []);

  // Initialize the offline sync service
  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeOfflineSync(handleSyncStatusChange);
        const syncTime = await getLastSyncTime();
        setLastSyncTime(syncTime);
        setInitialized(true);
      } catch (error) {
        console.error('Failed to initialize offline sync:', error);
      }
    };

    initialize();

    return () => {
      cleanupOfflineSync();
    };
  }, [handleSyncStatusChange]);

  // Cache essential data when user logs in and is online
  useEffect(() => {
    const cacheEssentialData = async () => {
      if (user && isOnline && initialized) {
        try {
          await Promise.all([
            cacheCrops(user.uid),
            cacheBlogs(),
            cacheProducts(),
          ]);
          console.log('[OfflineSyncContext] Essential data cached');
        } catch (error) {
          console.error('Failed to cache essential data:', error);
        }
      }
    };

    cacheEssentialData();
  }, [user, isOnline, initialized]);

  // Update sync queue status periodically
  useEffect(() => {
    if (!initialized) return;

    const interval = setInterval(async () => {
      const status = getSyncQueueStatus();
      setPendingChanges(status.pendingCount);
      setFailedChanges(status.failedCount);
      setIsOnline(status.isOnline);
      setIsSyncing(status.syncing);
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [initialized]);

  /**
   * Manually trigger a sync
   */
  const triggerSync = useCallback(async () => {
    if (isSyncing) return { success: false, message: 'Sync already in progress' };

    setIsSyncing(true);
    try {
      const result = await forceSyncNow();
      const syncTime = await getLastSyncTime();
      setLastSyncTime(syncTime);
      return result;
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  /**
   * Refresh cache for all data
   */
  const refreshCache = useCallback(async () => {
    if (!user || !isOnline) {
      return { success: false, message: 'Cannot refresh cache while offline' };
    }

    try {
      await Promise.all([
        cacheCrops(user.uid),
        cacheBlogs(),
        cacheProducts(),
      ]);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }, [user, isOnline]);

  /**
   * Check current online status
   */
  const checkStatus = useCallback(async () => {
    const online = await checkOnlineStatus();
    setIsOnline(online);
    return online;
  }, []);

  const value = {
    // State
    isOnline,
    isSyncing,
    pendingChanges,
    failedChanges,
    lastSyncTime,
    initialized,

    // Computed
    hasPendingChanges: pendingChanges > 0,
    hasFailedChanges: failedChanges > 0,

    // Actions
    triggerSync,
    refreshCache,
    checkStatus,
  };

  return (
    <OfflineSyncContext.Provider value={value}>
      {children}
    </OfflineSyncContext.Provider>
  );
};

export const useOfflineSync = () => {
  const context = useContext(OfflineSyncContext);
  if (!context) {
    throw new Error('useOfflineSync must be used within an OfflineSyncProvider');
  }
  return context;
};

export default OfflineSyncContext;
