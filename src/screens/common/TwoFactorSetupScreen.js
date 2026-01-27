/**
 * Two-Factor Authentication Setup Screen (SEC-2)
 * Allows sellers and admins to set up 2FA
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import {
  enable2FA,
  disable2FA,
  send2FAEmailCode,
  verify2FACode,
  get2FAStatus,
  regenerateBackupCodes,
  TwoFactorMethod,
} from '../../services/twoFactorAuthService';

const TwoFactorSetupScreen = ({ navigation }) => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [twoFAStatus, setTwoFAStatus] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(TwoFactorMethod.EMAIL);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [step, setStep] = useState('status'); // status, setup, verify, backup, disable
  const [codeSent, setCodeSent] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const status = await get2FAStatus(user.uid);
      setTwoFAStatus(status);
      setStep(status.enabled ? 'status' : 'setup');
    } catch (error) {
      Alert.alert('Error', 'Failed to load 2FA status');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async () => {
    setProcessing(true);
    try {
      await send2FAEmailCode(user.uid);
      setCodeSent(true);
      Alert.alert('Success', 'Verification code sent to your email');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleEnable2FA = async () => {
    setProcessing(true);
    try {
      const result = await enable2FA(user.uid, selectedMethod);
      setBackupCodes(result.backupCodes);
      setStep('backup');
      Alert.alert('Success', '2FA has been enabled on your account');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!verificationCode) {
      Alert.alert('Error', 'Please enter your verification code');
      return;
    }

    Alert.alert(
      'Disable 2FA',
      'Are you sure you want to disable two-factor authentication? This will make your account less secure.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            setProcessing(true);
            try {
              await disable2FA(user.uid, verificationCode);
              setTwoFAStatus({ ...twoFAStatus, enabled: false });
              setStep('setup');
              setVerificationCode('');
              Alert.alert('Success', '2FA has been disabled');
            } catch (error) {
              Alert.alert('Error', error.message);
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleRegenerateBackupCodes = async () => {
    if (!verificationCode) {
      Alert.alert('Error', 'Please enter your verification code');
      return;
    }

    setProcessing(true);
    try {
      const result = await regenerateBackupCodes(user.uid, verificationCode);
      setBackupCodes(result.backupCodes);
      setShowBackupCodes(true);
      setVerificationCode('');
      Alert.alert('Success', 'New backup codes generated');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setProcessing(false);
    }
  };

  const copyBackupCodes = () => {
    Clipboard.setString(backupCodes.join('\n'));
    Alert.alert('Copied', 'Backup codes copied to clipboard');
  };

  const renderMethodSelection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Choose 2FA Method</Text>

      <TouchableOpacity
        style={[
          styles.methodOption,
          selectedMethod === TwoFactorMethod.EMAIL && styles.methodOptionSelected,
        ]}
        onPress={() => setSelectedMethod(TwoFactorMethod.EMAIL)}
      >
        <View style={styles.methodIcon}>
          <Ionicons
            name="mail"
            size={24}
            color={selectedMethod === TwoFactorMethod.EMAIL ? '#4CAF50' : '#666'}
          />
        </View>
        <View style={styles.methodInfo}>
          <Text style={styles.methodTitle}>Email OTP</Text>
          <Text style={styles.methodDescription}>
            Receive verification codes via email
          </Text>
        </View>
        {selectedMethod === TwoFactorMethod.EMAIL && (
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.methodOption,
          selectedMethod === TwoFactorMethod.TOTP && styles.methodOptionSelected,
        ]}
        onPress={() => setSelectedMethod(TwoFactorMethod.TOTP)}
      >
        <View style={styles.methodIcon}>
          <Ionicons
            name="key"
            size={24}
            color={selectedMethod === TwoFactorMethod.TOTP ? '#4CAF50' : '#666'}
          />
        </View>
        <View style={styles.methodInfo}>
          <Text style={styles.methodTitle}>Authenticator App</Text>
          <Text style={styles.methodDescription}>
            Use Google Authenticator or similar apps
          </Text>
        </View>
        {selectedMethod === TwoFactorMethod.TOTP && (
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.enableButton}
        onPress={handleEnable2FA}
        disabled={processing}
      >
        {processing ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.enableButtonText}>Enable 2FA</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderStatus = () => (
    <View style={styles.section}>
      <View style={styles.statusCard}>
        <View style={[styles.statusIcon, styles.statusIconEnabled]}>
          <Ionicons name="shield-checkmark" size={32} color="#4CAF50" />
        </View>
        <Text style={styles.statusTitle}>2FA is Enabled</Text>
        <Text style={styles.statusDescription}>
          Your account is protected with {twoFAStatus?.method === TwoFactorMethod.EMAIL ? 'Email OTP' : 'Authenticator App'}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="key-outline" size={20} color="#666" />
        <Text style={styles.infoText}>
          {twoFAStatus?.backupCodesRemaining} backup codes remaining
        </Text>
      </View>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => {
          setStep('regenerate');
          handleSendCode();
        }}
      >
        <Ionicons name="refresh" size={20} color="#4CAF50" />
        <Text style={styles.actionButtonText}>Regenerate Backup Codes</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.dangerButton]}
        onPress={() => {
          setStep('disable');
          handleSendCode();
        }}
      >
        <Ionicons name="shield-outline" size={20} color="#F44336" />
        <Text style={[styles.actionButtonText, { color: '#F44336' }]}>
          Disable 2FA
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderDisable = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Disable 2FA</Text>
      <Text style={styles.warningText}>
        Enter the verification code sent to your email to disable 2FA.
      </Text>

      {!codeSent ? (
        <TouchableOpacity
          style={styles.sendCodeButton}
          onPress={handleSendCode}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.sendCodeButtonText}>Send Verification Code</Text>
          )}
        </TouchableOpacity>
      ) : (
        <>
          <TextInput
            style={styles.codeInput}
            placeholder="Enter 6-digit code"
            placeholderTextColor="#999"
            value={verificationCode}
            onChangeText={setVerificationCode}
            keyboardType="number-pad"
            maxLength={6}
          />

          <TouchableOpacity
            style={[styles.enableButton, { backgroundColor: '#F44336' }]}
            onPress={handleDisable2FA}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.enableButtonText}>Disable 2FA</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => {
          setStep('status');
          setCodeSent(false);
          setVerificationCode('');
        }}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRegenerate = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Regenerate Backup Codes</Text>
      <Text style={styles.infoText}>
        Enter the verification code to generate new backup codes. Your old codes will be invalidated.
      </Text>

      {!codeSent ? (
        <TouchableOpacity
          style={styles.sendCodeButton}
          onPress={handleSendCode}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.sendCodeButtonText}>Send Verification Code</Text>
          )}
        </TouchableOpacity>
      ) : (
        <>
          <TextInput
            style={styles.codeInput}
            placeholder="Enter 6-digit code"
            placeholderTextColor="#999"
            value={verificationCode}
            onChangeText={setVerificationCode}
            keyboardType="number-pad"
            maxLength={6}
          />

          <TouchableOpacity
            style={styles.enableButton}
            onPress={handleRegenerateBackupCodes}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.enableButtonText}>Generate New Codes</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      {showBackupCodes && (
        <View style={styles.backupCodesContainer}>
          <Text style={styles.backupCodesTitle}>Your New Backup Codes</Text>
          <View style={styles.backupCodesList}>
            {backupCodes.map((code, index) => (
              <Text key={index} style={styles.backupCode}>
                {index + 1}. {code}
              </Text>
            ))}
          </View>
          <TouchableOpacity style={styles.copyButton} onPress={copyBackupCodes}>
            <Ionicons name="copy" size={16} color="#4CAF50" />
            <Text style={styles.copyButtonText}>Copy All Codes</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => {
          setStep('status');
          setCodeSent(false);
          setVerificationCode('');
          setShowBackupCodes(false);
        }}
      >
        <Text style={styles.cancelButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );

  const renderBackupCodes = () => (
    <View style={styles.section}>
      <View style={styles.backupHeader}>
        <Ionicons name="document-text" size={48} color="#4CAF50" />
        <Text style={styles.backupTitle}>Save Your Backup Codes</Text>
        <Text style={styles.backupDescription}>
          Store these codes in a safe place. You can use them to access your account if you lose access to your 2FA method.
        </Text>
      </View>

      <View style={styles.backupCodesContainer}>
        {backupCodes.map((code, index) => (
          <Text key={index} style={styles.backupCode}>
            {index + 1}. {code}
          </Text>
        ))}
      </View>

      <TouchableOpacity style={styles.copyButton} onPress={copyBackupCodes}>
        <Ionicons name="copy" size={16} color="#4CAF50" />
        <Text style={styles.copyButtonText}>Copy All Codes</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.enableButton}
        onPress={() => {
          loadStatus();
          setStep('status');
        }}
      >
        <Text style={styles.enableButtonText}>I've Saved My Codes</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Two-Factor Auth</Text>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Section */}
        <View style={styles.infoSection}>
          <Ionicons name="shield-checkmark" size={32} color="#4CAF50" />
          <Text style={styles.infoTitle}>Protect Your Account</Text>
          <Text style={styles.infoDescription}>
            Two-factor authentication adds an extra layer of security to your account by requiring a verification code in addition to your password.
          </Text>
        </View>

        {/* Main Content */}
        {step === 'status' && twoFAStatus?.enabled && renderStatus()}
        {step === 'setup' && renderMethodSelection()}
        {step === 'backup' && renderBackupCodes()}
        {step === 'disable' && renderDisable()}
        {step === 'regenerate' && renderRegenerate()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoSection: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 8,
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginBottom: 12,
  },
  methodOptionSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8E9',
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  methodDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  enableButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  enableButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusCard: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 16,
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIconEnabled: {
    backgroundColor: '#E8F5E9',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
    color: '#666',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
    marginTop: 12,
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  dangerButton: {
    borderColor: '#F44336',
  },
  warningText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  sendCodeButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  sendCodeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  codeInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 16,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 12,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
  },
  backupHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  backupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  backupDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  backupCodesContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  backupCodesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  backupCodesList: {
    marginBottom: 12,
  },
  backupCode: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#333',
    paddingVertical: 6,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  copyButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
});

export default TwoFactorSetupScreen;
