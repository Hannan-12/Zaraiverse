/**
 * Payment Gateway Service (SI-4 / FR-10)
 * Integration with Pakistani payment services: JazzCash and Easypaisa
 *
 * Note: This service provides the integration structure.
 * Actual credentials should be obtained from:
 * - JazzCash: https://sandbox.jazzcash.com.pk/
 * - Easypaisa: https://easypay.easypaisa.com.pk/
 */

import axios from 'axios';
import * as Crypto from 'expo-crypto';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// Payment Gateway Configuration
// Replace with actual credentials in production
const PAYMENT_CONFIG = {
  jazzcash: {
    merchantId: 'MC12345', // Replace with actual merchant ID
    password: 'your_password', // Replace with actual password
    integritySalt: 'your_salt', // Replace with actual salt
    sandboxUrl: 'https://sandbox.jazzcash.com.pk/ApplicationAPI/API/Payment/DoTransaction',
    productionUrl: 'https://payments.jazzcash.com.pk/ApplicationAPI/API/Payment/DoTransaction',
    returnUrl: 'zaraiverse://payment/callback',
  },
  easypaisa: {
    storeId: 'your_store_id', // Replace with actual store ID
    accountNum: 'your_account', // Replace with actual account number
    hashKey: 'your_hash_key', // Replace with actual hash key
    sandboxUrl: 'https://easypay.easypaisa.com.pk/easypay-service/rest/v4/initiate-ma-transaction',
    productionUrl: 'https://easypay.easypaisa.com.pk/easypay-service/rest/v4/initiate-ma-transaction',
  },
};

// Environment flag
const IS_SANDBOX = true; // Set to false for production

// Payment Status Enum
export const PaymentStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

// Payment Method Enum
export const PaymentMethod = {
  JAZZCASH: 'jazzcash',
  EASYPAISA: 'easypaisa',
  COD: 'cod', // Cash on Delivery
};

/**
 * Generate unique transaction reference
 */
const generateTransactionRef = () => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ZV${timestamp}${random}`;
};

/**
 * Generate secure hash for JazzCash
 */
const generateJazzCashHash = async (params, integritySalt) => {
  const sortedKeys = Object.keys(params).sort();
  let hashString = integritySalt;

  sortedKeys.forEach(key => {
    if (params[key] !== '' && params[key] !== null) {
      hashString += '&' + params[key];
    }
  });

  const hashBuffer = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    hashString
  );

  return hashBuffer.toUpperCase();
};

/**
 * Generate secure hash for Easypaisa
 */
const generateEasypaisaHash = async (params, hashKey) => {
  const dataString = Object.values(params).join('');
  const hashString = hashKey + dataString;

  const hashBuffer = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    hashString
  );

  return hashBuffer;
};

/**
 * Create a payment record in Firestore
 */
const createPaymentRecord = async (paymentData) => {
  try {
    const paymentRef = await addDoc(collection(db, 'payments'), {
      ...paymentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return paymentRef.id;
  } catch (error) {
    console.error('Error creating payment record:', error);
    throw error;
  }
};

/**
 * Update payment record status
 */
const updatePaymentRecord = async (paymentId, updateData) => {
  try {
    const paymentRef = doc(db, 'payments', paymentId);
    await updateDoc(paymentRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating payment record:', error);
    throw error;
  }
};

/**
 * Initialize JazzCash payment
 */
export const initializeJazzCashPayment = async ({
  amount,
  orderId,
  userId,
  userPhone,
  description = 'ZaraiVerse Order Payment',
}) => {
  try {
    const config = PAYMENT_CONFIG.jazzcash;
    const txnRefNo = generateTransactionRef();
    const txnDateTime = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const expiryDateTime = new Date(Date.now() + 3600000).toISOString().replace(/[-:T]/g, '').slice(0, 14);

    // Create payment parameters
    const params = {
      pp_Version: '1.1',
      pp_TxnType: 'MWALLET',
      pp_Language: 'EN',
      pp_MerchantID: config.merchantId,
      pp_SubMerchantID: '',
      pp_Password: config.password,
      pp_BankID: 'TBANK',
      pp_ProductID: 'RETL',
      pp_TxnRefNo: txnRefNo,
      pp_Amount: Math.round(amount * 100).toString(), // Amount in paisa
      pp_TxnCurrency: 'PKR',
      pp_TxnDateTime: txnDateTime,
      pp_BillReference: orderId,
      pp_Description: description,
      pp_TxnExpiryDateTime: expiryDateTime,
      pp_ReturnURL: config.returnUrl,
      pp_MobileNumber: userPhone,
      ppmpf_1: userId,
      ppmpf_2: '',
      ppmpf_3: '',
      ppmpf_4: '',
      ppmpf_5: '',
    };

    // Generate secure hash
    params.pp_SecureHash = await generateJazzCashHash(params, config.integritySalt);

    // Create payment record in Firestore
    const paymentId = await createPaymentRecord({
      transactionRef: txnRefNo,
      orderId,
      userId,
      amount,
      method: PaymentMethod.JAZZCASH,
      status: PaymentStatus.PENDING,
      params,
    });

    // In production, you would make an API call here
    // For sandbox/demo, we return the payment URL
    const apiUrl = IS_SANDBOX ? config.sandboxUrl : config.productionUrl;

    return {
      success: true,
      paymentId,
      transactionRef: txnRefNo,
      paymentUrl: apiUrl,
      params,
      message: 'JazzCash payment initialized',
    };
  } catch (error) {
    console.error('JazzCash initialization error:', error);
    throw error;
  }
};

/**
 * Initialize Easypaisa payment
 */
export const initializeEasypaisaPayment = async ({
  amount,
  orderId,
  userId,
  userPhone,
  userEmail,
  description = 'ZaraiVerse Order Payment',
}) => {
  try {
    const config = PAYMENT_CONFIG.easypaisa;
    const txnRefNo = generateTransactionRef();
    const txnDateTime = new Date().toISOString();
    const expiryDate = new Date(Date.now() + 3600000).toISOString();

    // Create payment parameters
    const params = {
      storeId: config.storeId,
      amount: amount.toFixed(2),
      postBackURL: 'https://zaraiverse.com/payment/callback',
      orderRefNum: txnRefNo,
      expiryDate,
      autoRedirect: '1',
      paymentMethod: 'MA_PAYMENT_METHOD', // Mobile Account
      emailAddr: userEmail || '',
      mobileNum: userPhone,
      merchantPaymentMethod: '',
    };

    // Generate secure hash
    params.merchantHashedReq = await generateEasypaisaHash(params, config.hashKey);

    // Create payment record in Firestore
    const paymentId = await createPaymentRecord({
      transactionRef: txnRefNo,
      orderId,
      userId,
      amount,
      method: PaymentMethod.EASYPAISA,
      status: PaymentStatus.PENDING,
      params,
    });

    const apiUrl = IS_SANDBOX ? config.sandboxUrl : config.productionUrl;

    return {
      success: true,
      paymentId,
      transactionRef: txnRefNo,
      paymentUrl: apiUrl,
      params,
      message: 'Easypaisa payment initialized',
    };
  } catch (error) {
    console.error('Easypaisa initialization error:', error);
    throw error;
  }
};

/**
 * Process Cash on Delivery order
 */
export const initializeCODPayment = async ({
  amount,
  orderId,
  userId,
}) => {
  try {
    const txnRefNo = generateTransactionRef();

    // Create payment record in Firestore
    const paymentId = await createPaymentRecord({
      transactionRef: txnRefNo,
      orderId,
      userId,
      amount,
      method: PaymentMethod.COD,
      status: PaymentStatus.PENDING,
      codVerified: false,
    });

    return {
      success: true,
      paymentId,
      transactionRef: txnRefNo,
      message: 'Cash on Delivery order created',
    };
  } catch (error) {
    console.error('COD initialization error:', error);
    throw error;
  }
};

/**
 * Verify JazzCash payment callback
 */
export const verifyJazzCashPayment = async (callbackParams) => {
  try {
    const { pp_TxnRefNo, pp_ResponseCode, pp_ResponseMessage, pp_SecureHash } = callbackParams;

    // Verify the secure hash
    const calculatedHash = await generateJazzCashHash(
      { ...callbackParams, pp_SecureHash: '' },
      PAYMENT_CONFIG.jazzcash.integritySalt
    );

    if (calculatedHash !== pp_SecureHash) {
      throw new Error('Invalid payment signature');
    }

    // Check response code
    const isSuccess = pp_ResponseCode === '000';

    // Update payment record
    // Find payment by transaction ref and update
    // In production, implement proper lookup

    return {
      success: isSuccess,
      transactionRef: pp_TxnRefNo,
      responseCode: pp_ResponseCode,
      message: pp_ResponseMessage,
    };
  } catch (error) {
    console.error('JazzCash verification error:', error);
    throw error;
  }
};

/**
 * Verify Easypaisa payment callback
 */
export const verifyEasypaisaPayment = async (callbackParams) => {
  try {
    const { orderRefNumber, transactionStatus, transactionId } = callbackParams;

    // Verify status
    const isSuccess = transactionStatus === '0000';

    return {
      success: isSuccess,
      transactionRef: orderRefNumber,
      transactionId,
      status: transactionStatus,
    };
  } catch (error) {
    console.error('Easypaisa verification error:', error);
    throw error;
  }
};

/**
 * Get payment status
 */
export const getPaymentStatus = async (paymentId) => {
  try {
    const paymentRef = doc(db, 'payments', paymentId);
    const paymentDoc = await getDoc(paymentRef);

    if (!paymentDoc.exists()) {
      throw new Error('Payment not found');
    }

    return {
      id: paymentDoc.id,
      ...paymentDoc.data(),
    };
  } catch (error) {
    console.error('Error getting payment status:', error);
    throw error;
  }
};

/**
 * Mark payment as completed (for testing/admin)
 */
export const markPaymentCompleted = async (paymentId, transactionDetails = {}) => {
  try {
    await updatePaymentRecord(paymentId, {
      status: PaymentStatus.COMPLETED,
      completedAt: serverTimestamp(),
      transactionDetails,
    });

    return { success: true };
  } catch (error) {
    console.error('Error marking payment completed:', error);
    throw error;
  }
};

/**
 * Mark payment as failed
 */
export const markPaymentFailed = async (paymentId, reason = '') => {
  try {
    await updatePaymentRecord(paymentId, {
      status: PaymentStatus.FAILED,
      failureReason: reason,
    });

    return { success: true };
  } catch (error) {
    console.error('Error marking payment failed:', error);
    throw error;
  }
};

/**
 * Process refund
 */
export const processRefund = async (paymentId, amount, reason = '') => {
  try {
    const payment = await getPaymentStatus(paymentId);

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new Error('Can only refund completed payments');
    }

    if (amount > payment.amount) {
      throw new Error('Refund amount cannot exceed payment amount');
    }

    // Create refund record
    const refundRef = await addDoc(collection(db, 'refunds'), {
      paymentId,
      originalAmount: payment.amount,
      refundAmount: amount,
      reason,
      method: payment.method,
      status: 'pending',
      createdAt: serverTimestamp(),
    });

    // Update payment status
    await updatePaymentRecord(paymentId, {
      status: PaymentStatus.REFUNDED,
      refundId: refundRef.id,
      refundAmount: amount,
      refundReason: reason,
    });

    // In production, implement actual refund API calls
    // For JazzCash: Use their refund API
    // For Easypaisa: Use their refund API

    return {
      success: true,
      refundId: refundRef.id,
      message: 'Refund initiated',
    };
  } catch (error) {
    console.error('Error processing refund:', error);
    throw error;
  }
};

/**
 * Get available payment methods
 */
export const getAvailablePaymentMethods = () => {
  return [
    {
      id: PaymentMethod.JAZZCASH,
      name: 'JazzCash',
      icon: 'phone-portrait-outline',
      description: 'Pay with JazzCash Mobile Account',
      enabled: true,
    },
    {
      id: PaymentMethod.EASYPAISA,
      name: 'Easypaisa',
      icon: 'phone-portrait-outline',
      description: 'Pay with Easypaisa Mobile Account',
      enabled: true,
    },
    {
      id: PaymentMethod.COD,
      name: 'Cash on Delivery',
      icon: 'cash-outline',
      description: 'Pay when you receive your order',
      enabled: true,
    },
  ];
};

export default {
  initializeJazzCashPayment,
  initializeEasypaisaPayment,
  initializeCODPayment,
  verifyJazzCashPayment,
  verifyEasypaisaPayment,
  getPaymentStatus,
  markPaymentCompleted,
  markPaymentFailed,
  processRefund,
  getAvailablePaymentMethods,
  PaymentStatus,
  PaymentMethod,
};
