/**
 * Data Deletion Service (SEC-5)
 * Handles user data deletion requests
 * Must be honored within 7 days per security requirements
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { ref, deleteObject, listAll } from 'firebase/storage';
import { db, auth, storage } from './firebase';
import { sendEmail } from './emailService';

// Collection for deletion requests
const DELETION_REQUESTS_COLLECTION = 'deletion_requests';

// Status enum for deletion requests
export const DeletionRequestStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
};

/**
 * Submit a data deletion request
 */
export const submitDeletionRequest = async (userId, reason = '') => {
  try {
    // Get user data
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();

    // Check if there's already a pending request
    const existingRequestQuery = query(
      collection(db, DELETION_REQUESTS_COLLECTION),
      where('userId', '==', userId),
      where('status', 'in', [DeletionRequestStatus.PENDING, DeletionRequestStatus.IN_PROGRESS])
    );
    const existingRequests = await getDocs(existingRequestQuery);

    if (!existingRequests.empty) {
      throw new Error('You already have a pending deletion request');
    }

    // Calculate deadline (7 days from now)
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);

    // Create deletion request
    const requestData = {
      userId,
      userEmail: userData.email,
      userName: userData.name,
      userRole: userData.role,
      reason,
      status: DeletionRequestStatus.PENDING,
      createdAt: serverTimestamp(),
      deadline: deadline,
      completedAt: null,
      processedBy: null,
      notes: '',
    };

    const requestRef = await addDoc(
      collection(db, DELETION_REQUESTS_COLLECTION),
      requestData
    );

    // Send confirmation email to user
    try {
      await sendEmail({
        to_email: userData.email,
        to_name: userData.name,
        subject: 'Data Deletion Request Received - ZaraiVerse',
        message: `Dear ${userData.name},

We have received your request to delete your account and all associated data from ZaraiVerse.

Request ID: ${requestRef.id}
Submitted: ${new Date().toLocaleDateString()}
Deadline: ${deadline.toLocaleDateString()}

Your request will be processed within 7 days as per our privacy policy. You will receive a confirmation email once the deletion is complete.

If you did not make this request or wish to cancel it, please contact our support team immediately.

Best regards,
ZaraiVerse Team`,
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    // Notify admin
    try {
      await sendEmail({
        to_email: 'admin@zaraiverse.com',
        to_name: 'Admin',
        subject: 'New Data Deletion Request',
        message: `A new data deletion request has been submitted.

User: ${userData.name} (${userData.email})
Role: ${userData.role}
Request ID: ${requestRef.id}
Deadline: ${deadline.toLocaleDateString()}
Reason: ${reason || 'No reason provided'}

Please process this request within the 7-day deadline.`,
      });
    } catch (emailError) {
      console.error('Failed to notify admin:', emailError);
    }

    return {
      success: true,
      requestId: requestRef.id,
      deadline,
    };
  } catch (error) {
    console.error('Error submitting deletion request:', error);
    throw error;
  }
};

/**
 * Cancel a deletion request (user action)
 */
export const cancelDeletionRequest = async (requestId, userId) => {
  try {
    const requestRef = doc(db, DELETION_REQUESTS_COLLECTION, requestId);
    const requestDoc = await getDoc(requestRef);

    if (!requestDoc.exists()) {
      throw new Error('Request not found');
    }

    const requestData = requestDoc.data();

    if (requestData.userId !== userId) {
      throw new Error('Unauthorized');
    }

    if (requestData.status !== DeletionRequestStatus.PENDING) {
      throw new Error('This request can no longer be cancelled');
    }

    await updateDoc(requestRef, {
      status: DeletionRequestStatus.CANCELLED,
      cancelledAt: serverTimestamp(),
      notes: 'Cancelled by user',
    });

    return { success: true };
  } catch (error) {
    console.error('Error cancelling deletion request:', error);
    throw error;
  }
};

/**
 * Get deletion requests for a user
 */
export const getUserDeletionRequests = async (userId) => {
  try {
    const requestsQuery = query(
      collection(db, DELETION_REQUESTS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(requestsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching user deletion requests:', error);
    throw error;
  }
};

/**
 * Get all deletion requests (admin)
 */
export const getAllDeletionRequests = async (statusFilter = null) => {
  try {
    let requestsQuery;

    if (statusFilter) {
      requestsQuery = query(
        collection(db, DELETION_REQUESTS_COLLECTION),
        where('status', '==', statusFilter),
        orderBy('createdAt', 'desc')
      );
    } else {
      requestsQuery = query(
        collection(db, DELETION_REQUESTS_COLLECTION),
        orderBy('createdAt', 'desc')
      );
    }

    const snapshot = await getDocs(requestsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching deletion requests:', error);
    throw error;
  }
};

/**
 * Process a deletion request (admin action)
 * Deletes all user data from Firestore and Storage
 */
export const processDeletionRequest = async (requestId, adminId) => {
  const requestRef = doc(db, DELETION_REQUESTS_COLLECTION, requestId);

  try {
    // Get request data
    const requestDoc = await getDoc(requestRef);
    if (!requestDoc.exists()) {
      throw new Error('Request not found');
    }

    const requestData = requestDoc.data();
    const userId = requestData.userId;

    // Update status to in_progress
    await updateDoc(requestRef, {
      status: DeletionRequestStatus.IN_PROGRESS,
      processedBy: adminId,
      processingStartedAt: serverTimestamp(),
    });

    // Delete user data in batches
    const batch = writeBatch(db);

    // 1. Delete user's orders
    const ordersQuery = query(
      collection(db, 'orders'),
      where('userId', '==', userId)
    );
    const ordersSnapshot = await getDocs(ordersQuery);
    ordersSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    // 2. Delete user's crops
    const cropsQuery = query(
      collection(db, 'crops'),
      where('farmerId', '==', userId)
    );
    const cropsSnapshot = await getDocs(cropsQuery);
    cropsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    // 3. Delete user's products (if seller)
    const productsQuery = query(
      collection(db, 'products'),
      where('sellerId', '==', userId)
    );
    const productsSnapshot = await getDocs(productsQuery);
    productsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    // 4. Delete user's chat history
    const chatHistoryRef = collection(db, 'users', userId, 'chat_history');
    const chatHistorySnapshot = await getDocs(chatHistoryRef);
    chatHistorySnapshot.docs.forEach(doc => batch.delete(doc.ref));

    // 5. Delete user document
    batch.delete(doc(db, 'users', userId));

    // Commit batch delete
    await batch.commit();

    // 6. Delete user's storage files
    try {
      const userStorageRef = ref(storage, `users/${userId}`);
      const storageList = await listAll(userStorageRef);
      const deletePromises = storageList.items.map(item => deleteObject(item));
      await Promise.all(deletePromises);
    } catch (storageError) {
      console.log('No storage files to delete or error:', storageError.message);
    }

    // 7. Update request as completed
    await updateDoc(requestRef, {
      status: DeletionRequestStatus.COMPLETED,
      completedAt: serverTimestamp(),
      notes: 'All user data has been deleted successfully',
    });

    // 8. Send completion email to user
    try {
      await sendEmail({
        to_email: requestData.userEmail,
        to_name: requestData.userName,
        subject: 'Data Deletion Complete - ZaraiVerse',
        message: `Dear ${requestData.userName},

Your data deletion request has been processed and completed.

Request ID: ${requestId}
Completed: ${new Date().toLocaleDateString()}

The following data has been permanently deleted:
- Your user profile and account
- Order history
- Crop data
- Products (if applicable)
- Chat history
- Uploaded files and images

Thank you for using ZaraiVerse. We're sorry to see you go.

Best regards,
ZaraiVerse Team`,
      });
    } catch (emailError) {
      console.error('Failed to send completion email:', emailError);
    }

    return {
      success: true,
      message: 'User data deleted successfully',
    };
  } catch (error) {
    console.error('Error processing deletion request:', error);

    // Update request status to failed
    await updateDoc(requestRef, {
      status: DeletionRequestStatus.FAILED,
      notes: `Failed: ${error.message}`,
    });

    throw error;
  }
};

/**
 * Get deletion request statistics (admin)
 */
export const getDeletionRequestStats = async () => {
  try {
    const allRequests = await getAllDeletionRequests();

    const stats = {
      total: allRequests.length,
      pending: allRequests.filter(r => r.status === DeletionRequestStatus.PENDING).length,
      inProgress: allRequests.filter(r => r.status === DeletionRequestStatus.IN_PROGRESS).length,
      completed: allRequests.filter(r => r.status === DeletionRequestStatus.COMPLETED).length,
      cancelled: allRequests.filter(r => r.status === DeletionRequestStatus.CANCELLED).length,
      failed: allRequests.filter(r => r.status === DeletionRequestStatus.FAILED).length,
      overdue: allRequests.filter(r => {
        if (r.status !== DeletionRequestStatus.PENDING) return false;
        const deadline = r.deadline?.toDate ? r.deadline.toDate() : new Date(r.deadline);
        return deadline < new Date();
      }).length,
    };

    return stats;
  } catch (error) {
    console.error('Error getting deletion stats:', error);
    throw error;
  }
};

/**
 * Check for overdue deletion requests and send alerts
 */
export const checkOverdueRequests = async () => {
  try {
    const pendingRequests = await getAllDeletionRequests(DeletionRequestStatus.PENDING);
    const overdueRequests = pendingRequests.filter(r => {
      const deadline = r.deadline?.toDate ? r.deadline.toDate() : new Date(r.deadline);
      return deadline < new Date();
    });

    if (overdueRequests.length > 0) {
      // Send alert to admin
      await sendEmail({
        to_email: 'admin@zaraiverse.com',
        to_name: 'Admin',
        subject: 'URGENT: Overdue Data Deletion Requests',
        message: `There are ${overdueRequests.length} overdue data deletion requests that need immediate attention.

Overdue requests:
${overdueRequests.map(r => `- ${r.userName} (${r.userEmail}) - Request ID: ${r.id}`).join('\n')}

Please process these requests immediately to comply with data protection regulations.`,
      });
    }

    return overdueRequests;
  } catch (error) {
    console.error('Error checking overdue requests:', error);
    throw error;
  }
};

export default {
  submitDeletionRequest,
  cancelDeletionRequest,
  getUserDeletionRequests,
  getAllDeletionRequests,
  processDeletionRequest,
  getDeletionRequestStats,
  checkOverdueRequests,
  DeletionRequestStatus,
};
