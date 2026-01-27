/**
 * Two-Factor Authentication Service (SEC-2)
 * Implements 2FA for seller and admin accounts
 * Uses TOTP (Time-based One-Time Password) and Email OTP
 */

import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  doc,
  updateDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { sendEmail } from './emailService';

// 2FA Configuration
const TWO_FA_CONFIG = {
  totpDigits: 6,
  totpPeriod: 30, // seconds
  otpExpiryMinutes: 10,
  maxAttempts: 5,
  lockoutMinutes: 30,
};

// 2FA Methods
export const TwoFactorMethod = {
  EMAIL: 'email',
  TOTP: 'totp',
  NONE: 'none',
};

// Storage keys
const STORAGE_KEYS = {
  TOTP_SECRET: '@2fa_totp_secret',
  BACKUP_CODES: '@2fa_backup_codes',
};

/**
 * Generate a random secret for TOTP
 */
const generateTOTPSecret = async () => {
  const randomBytes = await Crypto.getRandomBytesAsync(20);
  const secret = Array.from(randomBytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
  return secret;
};

/**
 * Generate TOTP code based on secret and time
 */
const generateTOTPCode = async (secret, timestamp = Date.now()) => {
  const period = TWO_FA_CONFIG.totpPeriod;
  const counter = Math.floor(timestamp / 1000 / period);

  // Convert counter to 8-byte buffer
  const counterHex = counter.toString(16).padStart(16, '0');
  const message = secret + counterHex;

  // Generate HMAC-SHA1 hash
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    message
  );

  // Extract dynamic binary code (last 4 bits of hash determine offset)
  const offset = parseInt(hash.slice(-1), 16);
  const binaryCode = parseInt(hash.slice(offset * 2, offset * 2 + 8), 16) & 0x7fffffff;

  // Generate OTP
  const otp = (binaryCode % Math.pow(10, TWO_FA_CONFIG.totpDigits))
    .toString()
    .padStart(TWO_FA_CONFIG.totpDigits, '0');

  return otp;
};

/**
 * Generate random OTP code
 */
const generateRandomOTP = () => {
  const digits = TWO_FA_CONFIG.totpDigits;
  let otp = '';
  for (let i = 0; i < digits; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
};

/**
 * Generate backup codes
 */
const generateBackupCodes = (count = 10) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = Array.from({ length: 8 }, () =>
      Math.random().toString(36).charAt(2)
    ).join('').toUpperCase();
    codes.push({
      code,
      used: false,
      usedAt: null,
    });
  }
  return codes;
};

/**
 * Enable 2FA for a user
 */
export const enable2FA = async (userId, method = TwoFactorMethod.EMAIL) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const backupCodes = generateBackupCodes();

    const twoFactorData = {
      twoFactorEnabled: true,
      twoFactorMethod: method,
      twoFactorSetupAt: serverTimestamp(),
      backupCodes,
      failedAttempts: 0,
      lockedUntil: null,
    };

    if (method === TwoFactorMethod.TOTP) {
      const secret = await generateTOTPSecret();
      twoFactorData.totpSecret = secret;

      // Store secret locally as well
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.TOTP_SECRET}_${userId}`,
        secret
      );
    }

    await updateDoc(userRef, twoFactorData);

    // Store backup codes locally
    await AsyncStorage.setItem(
      `${STORAGE_KEYS.BACKUP_CODES}_${userId}`,
      JSON.stringify(backupCodes)
    );

    // Send confirmation email
    await sendEmail({
      to_email: userData.email,
      to_name: userData.name,
      subject: 'Two-Factor Authentication Enabled - ZaraiVerse',
      message: `Dear ${userData.name},

Two-factor authentication has been enabled on your ZaraiVerse account.

Method: ${method === TwoFactorMethod.EMAIL ? 'Email OTP' : 'Authenticator App'}

Your backup codes (save these in a secure place):
${backupCodes.map((c, i) => `${i + 1}. ${c.code}`).join('\n')}

If you did not enable 2FA, please contact support immediately.

Best regards,
ZaraiVerse Team`,
    });

    return {
      success: true,
      method,
      backupCodes: backupCodes.map(c => c.code),
      totpSecret: method === TwoFactorMethod.TOTP ? twoFactorData.totpSecret : null,
    };
  } catch (error) {
    console.error('Error enabling 2FA:', error);
    throw error;
  }
};

/**
 * Disable 2FA for a user
 */
export const disable2FA = async (userId, verificationCode) => {
  try {
    // First verify the code
    const isValid = await verify2FACode(userId, verificationCode);
    if (!isValid.success) {
      throw new Error('Invalid verification code');
    }

    const userRef = doc(db, 'users', userId);

    await updateDoc(userRef, {
      twoFactorEnabled: false,
      twoFactorMethod: TwoFactorMethod.NONE,
      totpSecret: null,
      backupCodes: [],
      twoFactorDisabledAt: serverTimestamp(),
    });

    // Clear local storage
    await AsyncStorage.removeItem(`${STORAGE_KEYS.TOTP_SECRET}_${userId}`);
    await AsyncStorage.removeItem(`${STORAGE_KEYS.BACKUP_CODES}_${userId}`);

    return { success: true };
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    throw error;
  }
};

/**
 * Send 2FA verification code via email
 */
export const send2FAEmailCode = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();

    // Check if user is locked out
    if (userData.lockedUntil) {
      const lockedUntil = userData.lockedUntil.toDate ? userData.lockedUntil.toDate() : new Date(userData.lockedUntil);
      if (lockedUntil > new Date()) {
        throw new Error(`Account locked. Try again after ${lockedUntil.toLocaleTimeString()}`);
      }
    }

    // Generate OTP
    const otp = generateRandomOTP();
    const expiresAt = new Date(Date.now() + TWO_FA_CONFIG.otpExpiryMinutes * 60 * 1000);

    // Store OTP in database
    await updateDoc(userRef, {
      pendingOTP: otp,
      otpExpiresAt: expiresAt,
      otpSentAt: serverTimestamp(),
    });

    // Send OTP via email
    await sendEmail({
      to_email: userData.email,
      to_name: userData.name,
      subject: 'Your Verification Code - ZaraiVerse',
      message: `Dear ${userData.name},

Your verification code is: ${otp}

This code will expire in ${TWO_FA_CONFIG.otpExpiryMinutes} minutes.

If you did not request this code, please secure your account immediately.

Best regards,
ZaraiVerse Team`,
    });

    return {
      success: true,
      message: 'Verification code sent to your email',
      expiresAt,
    };
  } catch (error) {
    console.error('Error sending 2FA code:', error);
    throw error;
  }
};

/**
 * Verify 2FA code
 */
export const verify2FACode = async (userId, code, isBackupCode = false) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();

    // Check if user is locked out
    if (userData.lockedUntil) {
      const lockedUntil = userData.lockedUntil.toDate ? userData.lockedUntil.toDate() : new Date(userData.lockedUntil);
      if (lockedUntil > new Date()) {
        throw new Error(`Account locked. Try again after ${lockedUntil.toLocaleTimeString()}`);
      } else {
        // Reset lockout
        await updateDoc(userRef, {
          lockedUntil: null,
          failedAttempts: 0,
        });
      }
    }

    let isValid = false;

    // Check backup code
    if (isBackupCode) {
      const backupCodes = userData.backupCodes || [];
      const codeIndex = backupCodes.findIndex(
        c => c.code === code.toUpperCase() && !c.used
      );

      if (codeIndex !== -1) {
        isValid = true;
        // Mark backup code as used
        backupCodes[codeIndex].used = true;
        backupCodes[codeIndex].usedAt = new Date().toISOString();
        await updateDoc(userRef, { backupCodes });
      }
    } else if (userData.twoFactorMethod === TwoFactorMethod.EMAIL) {
      // Verify email OTP
      const otpExpiresAt = userData.otpExpiresAt?.toDate
        ? userData.otpExpiresAt.toDate()
        : new Date(userData.otpExpiresAt);

      if (userData.pendingOTP === code && otpExpiresAt > new Date()) {
        isValid = true;
        // Clear the OTP
        await updateDoc(userRef, {
          pendingOTP: null,
          otpExpiresAt: null,
        });
      }
    } else if (userData.twoFactorMethod === TwoFactorMethod.TOTP) {
      // Verify TOTP
      const secret = userData.totpSecret;
      if (secret) {
        // Check current and previous/next time windows
        const windows = [-1, 0, 1];
        for (const window of windows) {
          const timestamp = Date.now() + window * TWO_FA_CONFIG.totpPeriod * 1000;
          const expectedCode = await generateTOTPCode(secret, timestamp);
          if (expectedCode === code) {
            isValid = true;
            break;
          }
        }
      }
    }

    if (isValid) {
      // Reset failed attempts
      await updateDoc(userRef, {
        failedAttempts: 0,
        lastSuccessful2FA: serverTimestamp(),
      });

      return { success: true };
    } else {
      // Increment failed attempts
      const failedAttempts = (userData.failedAttempts || 0) + 1;
      const updates = { failedAttempts };

      if (failedAttempts >= TWO_FA_CONFIG.maxAttempts) {
        updates.lockedUntil = new Date(Date.now() + TWO_FA_CONFIG.lockoutMinutes * 60 * 1000);
      }

      await updateDoc(userRef, updates);

      const remainingAttempts = TWO_FA_CONFIG.maxAttempts - failedAttempts;
      throw new Error(
        remainingAttempts > 0
          ? `Invalid code. ${remainingAttempts} attempts remaining.`
          : `Too many failed attempts. Account locked for ${TWO_FA_CONFIG.lockoutMinutes} minutes.`
      );
    }
  } catch (error) {
    console.error('Error verifying 2FA code:', error);
    throw error;
  }
};

/**
 * Get 2FA status for a user
 */
export const get2FAStatus = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();

    return {
      enabled: userData.twoFactorEnabled || false,
      method: userData.twoFactorMethod || TwoFactorMethod.NONE,
      setupAt: userData.twoFactorSetupAt,
      backupCodesRemaining: (userData.backupCodes || []).filter(c => !c.used).length,
    };
  } catch (error) {
    console.error('Error getting 2FA status:', error);
    throw error;
  }
};

/**
 * Regenerate backup codes
 */
export const regenerateBackupCodes = async (userId, verificationCode) => {
  try {
    // Verify current 2FA code first
    const isValid = await verify2FACode(userId, verificationCode);
    if (!isValid.success) {
      throw new Error('Invalid verification code');
    }

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();

    const newBackupCodes = generateBackupCodes();

    await updateDoc(userRef, {
      backupCodes: newBackupCodes,
      backupCodesRegeneratedAt: serverTimestamp(),
    });

    // Send notification email
    await sendEmail({
      to_email: userData.email,
      to_name: userData.name,
      subject: 'Backup Codes Regenerated - ZaraiVerse',
      message: `Dear ${userData.name},

Your 2FA backup codes have been regenerated. Your old backup codes are no longer valid.

New backup codes (save these in a secure place):
${newBackupCodes.map((c, i) => `${i + 1}. ${c.code}`).join('\n')}

If you did not request new backup codes, please secure your account immediately.

Best regards,
ZaraiVerse Team`,
    });

    return {
      success: true,
      backupCodes: newBackupCodes.map(c => c.code),
    };
  } catch (error) {
    console.error('Error regenerating backup codes:', error);
    throw error;
  }
};

/**
 * Check if 2FA is required for a user role
 */
export const is2FARequired = (userRole) => {
  // 2FA is required for sellers and admins per SEC-2
  return ['seller', 'admin'].includes(userRole);
};

/**
 * Generate TOTP URI for authenticator apps
 */
export const generateTOTPUri = (email, secret) => {
  const issuer = 'ZaraiVerse';
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);

  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&digits=${TWO_FA_CONFIG.totpDigits}&period=${TWO_FA_CONFIG.totpPeriod}`;
};

export default {
  enable2FA,
  disable2FA,
  send2FAEmailCode,
  verify2FACode,
  get2FAStatus,
  regenerateBackupCodes,
  is2FARequired,
  generateTOTPUri,
  TwoFactorMethod,
};
