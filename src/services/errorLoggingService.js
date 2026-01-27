/**
 * Error Logging Service (REL-3)
 * Automated system error logging and reporting
 * Reports errors to admin within 60 seconds
 */

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from './firebase';
import { sendEmail } from './emailService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Error severity levels
export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

// Error categories
export const ErrorCategory = {
  NETWORK: 'network',
  AUTHENTICATION: 'authentication',
  DATABASE: 'database',
  PAYMENT: 'payment',
  UI: 'ui',
  NAVIGATION: 'navigation',
  API: 'api',
  STORAGE: 'storage',
  PERMISSION: 'permission',
  UNKNOWN: 'unknown',
};

// Configuration
const CONFIG = {
  adminEmail: 'admin@zaraiverse.com',
  criticalAlertThreshold: 60000, // 60 seconds in ms
  errorCollectionName: 'system_errors',
  maxLocalErrors: 100,
  batchReportInterval: 300000, // 5 minutes
};

// Local error queue for offline scenarios
let errorQueue = [];
let isReportingInProgress = false;

/**
 * Initialize error logging service
 */
export const initializeErrorLogging = async () => {
  try {
    // Load any cached errors from local storage
    const cachedErrors = await AsyncStorage.getItem('@error_queue');
    if (cachedErrors) {
      errorQueue = JSON.parse(cachedErrors);
    }

    // Set up global error handler
    const originalConsoleError = console.error;
    console.error = (...args) => {
      originalConsoleError.apply(console, args);
      // Auto-log console errors
      const errorMessage = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');

      if (!errorMessage.includes('[ErrorLogging]')) {
        logError({
          message: errorMessage,
          category: ErrorCategory.UNKNOWN,
          severity: ErrorSeverity.MEDIUM,
          source: 'console.error',
        }).catch(() => {}); // Silent fail for logging errors
      }
    };

    // Process any queued errors
    processErrorQueue();

    console.log('[ErrorLogging] Service initialized');
    return true;
  } catch (error) {
    console.log('[ErrorLogging] Initialization error:', error);
    return false;
  }
};

/**
 * Log an error
 */
export const logError = async ({
  message,
  stack = null,
  category = ErrorCategory.UNKNOWN,
  severity = ErrorSeverity.MEDIUM,
  userId = null,
  screenName = null,
  additionalData = {},
  source = 'app',
}) => {
  try {
    const errorData = {
      message,
      stack,
      category,
      severity,
      userId,
      screenName,
      additionalData,
      source,
      timestamp: new Date().toISOString(),
      deviceInfo: {
        platform: 'react-native',
        // Add more device info as needed
      },
      resolved: false,
      resolvedAt: null,
      resolvedBy: null,
    };

    // Add to queue
    errorQueue.push(errorData);

    // Keep queue size manageable
    if (errorQueue.length > CONFIG.maxLocalErrors) {
      errorQueue = errorQueue.slice(-CONFIG.maxLocalErrors);
    }

    // Save to local storage for persistence
    await AsyncStorage.setItem('@error_queue', JSON.stringify(errorQueue));

    // For critical errors, send immediate alert
    if (severity === ErrorSeverity.CRITICAL) {
      await sendCriticalAlert(errorData);
    }

    // Try to save to database
    await saveErrorToDatabase(errorData);

    return { success: true };
  } catch (err) {
    console.log('[ErrorLogging] Failed to log error:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Save error to Firestore
 */
const saveErrorToDatabase = async (errorData) => {
  try {
    const docRef = await addDoc(collection(db, CONFIG.errorCollectionName), {
      ...errorData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.log('[ErrorLogging] Database save failed:', error);
    throw error;
  }
};

/**
 * Send critical error alert to admin
 */
const sendCriticalAlert = async (errorData) => {
  try {
    await sendEmail({
      to_email: CONFIG.adminEmail,
      to_name: 'Admin',
      subject: `[CRITICAL] System Error Alert - ZaraiVerse`,
      message: `CRITICAL SYSTEM ERROR DETECTED

Time: ${errorData.timestamp}
Category: ${errorData.category}
Severity: ${errorData.severity}

Error Message:
${errorData.message}

${errorData.stack ? `Stack Trace:\n${errorData.stack}` : ''}

User ID: ${errorData.userId || 'Not logged in'}
Screen: ${errorData.screenName || 'Unknown'}

Additional Data:
${JSON.stringify(errorData.additionalData, null, 2)}

---
This is an automated alert from ZaraiVerse Error Logging System.
Please investigate immediately.`,
    });

    console.log('[ErrorLogging] Critical alert sent to admin');
  } catch (error) {
    console.log('[ErrorLogging] Failed to send critical alert:', error);
  }
};

/**
 * Process queued errors (for offline scenarios)
 */
const processErrorQueue = async () => {
  if (isReportingInProgress || errorQueue.length === 0) return;

  isReportingInProgress = true;

  try {
    const processedErrors = [];

    for (const error of errorQueue) {
      try {
        await saveErrorToDatabase(error);
        processedErrors.push(error);
      } catch {
        // Keep in queue if save fails
      }
    }

    // Remove processed errors from queue
    errorQueue = errorQueue.filter(e => !processedErrors.includes(e));
    await AsyncStorage.setItem('@error_queue', JSON.stringify(errorQueue));
  } catch (error) {
    console.log('[ErrorLogging] Queue processing error:', error);
  } finally {
    isReportingInProgress = false;
  }
};

/**
 * Get recent errors (for admin dashboard)
 */
export const getRecentErrors = async (options = {}) => {
  const {
    limitCount = 50,
    severity = null,
    category = null,
    resolved = null,
    startDate = null,
  } = options;

  try {
    let q = collection(db, CONFIG.errorCollectionName);
    const constraints = [orderBy('createdAt', 'desc'), limit(limitCount)];

    if (severity) {
      constraints.unshift(where('severity', '==', severity));
    }

    if (category) {
      constraints.unshift(where('category', '==', category));
    }

    if (resolved !== null) {
      constraints.unshift(where('resolved', '==', resolved));
    }

    q = query(q, ...constraints);

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('[ErrorLogging] Failed to fetch errors:', error);
    throw error;
  }
};

/**
 * Get error statistics
 */
export const getErrorStats = async () => {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const allErrors = await getRecentErrors({ limitCount: 1000 });

    const stats = {
      total: allErrors.length,
      unresolved: allErrors.filter(e => !e.resolved).length,
      last24Hours: allErrors.filter(e => {
        const timestamp = e.createdAt?.toDate ? e.createdAt.toDate() : new Date(e.timestamp);
        return timestamp > last24Hours;
      }).length,
      last7Days: allErrors.filter(e => {
        const timestamp = e.createdAt?.toDate ? e.createdAt.toDate() : new Date(e.timestamp);
        return timestamp > last7Days;
      }).length,
      bySeverity: {
        critical: allErrors.filter(e => e.severity === ErrorSeverity.CRITICAL).length,
        high: allErrors.filter(e => e.severity === ErrorSeverity.HIGH).length,
        medium: allErrors.filter(e => e.severity === ErrorSeverity.MEDIUM).length,
        low: allErrors.filter(e => e.severity === ErrorSeverity.LOW).length,
      },
      byCategory: {},
    };

    // Count by category
    Object.values(ErrorCategory).forEach(cat => {
      stats.byCategory[cat] = allErrors.filter(e => e.category === cat).length;
    });

    return stats;
  } catch (error) {
    console.error('[ErrorLogging] Failed to get stats:', error);
    throw error;
  }
};

/**
 * Mark error as resolved
 */
export const resolveError = async (errorId, adminId, resolution = '') => {
  try {
    const errorRef = doc(db, CONFIG.errorCollectionName, errorId);
    await updateDoc(errorRef, {
      resolved: true,
      resolvedAt: serverTimestamp(),
      resolvedBy: adminId,
      resolution,
    });
    return { success: true };
  } catch (error) {
    console.error('[ErrorLogging] Failed to resolve error:', error);
    throw error;
  }
};

/**
 * Create error boundary handler
 */
export const createErrorBoundaryHandler = (componentName) => {
  return (error, errorInfo) => {
    logError({
      message: error.message,
      stack: error.stack || errorInfo?.componentStack,
      category: ErrorCategory.UI,
      severity: ErrorSeverity.HIGH,
      screenName: componentName,
      additionalData: {
        componentStack: errorInfo?.componentStack,
      },
      source: 'ErrorBoundary',
    });
  };
};

/**
 * Log API error
 */
export const logAPIError = async (endpoint, method, statusCode, errorMessage, userId = null) => {
  return logError({
    message: `API Error: ${method} ${endpoint} - ${statusCode}: ${errorMessage}`,
    category: ErrorCategory.API,
    severity: statusCode >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
    userId,
    additionalData: {
      endpoint,
      method,
      statusCode,
    },
    source: 'api',
  });
};

/**
 * Log network error
 */
export const logNetworkError = async (url, errorMessage, userId = null) => {
  return logError({
    message: `Network Error: ${url} - ${errorMessage}`,
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.MEDIUM,
    userId,
    additionalData: { url },
    source: 'network',
  });
};

/**
 * Log authentication error
 */
export const logAuthError = async (action, errorMessage, userId = null) => {
  return logError({
    message: `Auth Error: ${action} - ${errorMessage}`,
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.HIGH,
    userId,
    additionalData: { action },
    source: 'auth',
  });
};

/**
 * Log payment error
 */
export const logPaymentError = async (paymentMethod, errorMessage, userId = null, orderId = null) => {
  return logError({
    message: `Payment Error: ${paymentMethod} - ${errorMessage}`,
    category: ErrorCategory.PAYMENT,
    severity: ErrorSeverity.CRITICAL,
    userId,
    additionalData: {
      paymentMethod,
      orderId,
    },
    source: 'payment',
  });
};

export default {
  initializeErrorLogging,
  logError,
  getRecentErrors,
  getErrorStats,
  resolveError,
  createErrorBoundaryHandler,
  logAPIError,
  logNetworkError,
  logAuthError,
  logPaymentError,
  ErrorSeverity,
  ErrorCategory,
};
