import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { sendOTP } from '../../services/emailService';
import { Ionicons } from '@expo/vector-icons';
import { updatePassword } from 'firebase/auth';
import { auth } from '../../services/firebase';

// Same rules as RegisterScreen
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_#^()\-+=])[A-Za-z\d@$!%*?&_#^()\-+=]{8,}$/;

const PASSWORD_REQUIREMENTS = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'At least one uppercase letter (A–Z)', test: (p) => /[A-Z]/.test(p) },
  { label: 'At least one number (0–9)', test: (p) => /\d/.test(p) },
  { label: 'At least one special character (@$!%*?&#)', test: (p) => /[@$!%*?&_#^()\-+=]/.test(p) },
];

export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [sentOtp, setSentOtp] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userDocId, setUserDocId] = useState(null);

  // Step 1: Verify Email & Send OTP
  const handleVerifyEmail = async () => {
    if (!email) return Alert.alert('Error', 'Please enter your email.');
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase().trim()));
      const snap = await getDocs(q);
      if (snap.empty) {
        Alert.alert('Not Found', 'No account associated with this email.');
      } else {
        const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
        const emailResult = await sendOTP(email.toLowerCase().trim(), generatedOtp);
        if (emailResult.success) {
          setUserDocId(snap.docs[0].id);
          setSentOtp(generatedOtp);
          Alert.alert('OTP Sent 📧', 'A verification code has been sent to your email.');
          setStep(2);
        } else {
          Alert.alert('Email Error', 'Could not send OTP. Please check your connection and try again.');
        }
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = () => {
    if (otpInput === sentOtp) {
      setStep(3);
    } else {
      Alert.alert('Invalid OTP', 'The code you entered is incorrect.');
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async () => {
    if (!PASSWORD_REGEX.test(newPassword)) {
      Alert.alert(
        'Weak Password',
        'Password must be at least 8 characters and include:\n• One uppercase letter\n• One number\n• One special character (@$!%*?&#)'
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      return Alert.alert('Error', 'Passwords do not match.');
    }

    setLoading(true);
    try {
      const userRef = doc(db, 'users', userDocId);
      await updateDoc(userRef, { password: newPassword });

      // Also update Firebase Auth password if user is currently signed in
      if (auth.currentUser) {
        try {
          await updatePassword(auth.currentUser, newPassword);
        } catch (_) {
          // Not critical if auth update fails (user may not be signed in)
        }
      }

      Alert.alert('Success ✅', 'Your password has been updated! Please login with your new password.', [
        { text: 'Go to Login', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (e) {
      Alert.alert('Error', 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Password Recovery</Text>

      {/* Step 1: Email */}
      {step === 1 && (
        <View>
          <Text style={styles.label}>Enter your registered email</Text>
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.btn} onPress={handleVerifyEmail} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send OTP</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* Step 2: OTP */}
      {step === 2 && (
        <View>
          <Text style={styles.label}>Enter the 4-digit code sent to your email</Text>
          <TextInput
            style={[styles.input, styles.otpInput]}
            placeholder="0 0 0 0"
            value={otpInput}
            onChangeText={setOtpInput}
            keyboardType="number-pad"
            maxLength={4}
          />
          <TouchableOpacity style={styles.btn} onPress={handleVerifyOTP}>
            <Text style={styles.btnText}>Verify Code</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStep(1)} style={styles.changeEmailLink}>
            <Text style={styles.linkText}>Change Email</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step 3: New Password */}
      {step === 3 && (
        <View>
          <Text style={styles.label}>Enter your new password</Text>

          {/* New Password field */}
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              placeholder="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNew}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"
            />
            <TouchableOpacity
              onPress={() => setShowNew(!showNew)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.eyeBtn}
            >
              <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={22} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Confirm Password field */}
          <View style={[styles.passwordRow, { marginTop: 12 }]}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"
            />
            <TouchableOpacity
              onPress={() => setShowConfirm(!showConfirm)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.eyeBtn}
            >
              <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={22} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Password requirements */}
          <View style={styles.requirementsBox}>
            <Text style={styles.requirementsTitle}>Password requirements:</Text>
            {PASSWORD_REQUIREMENTS.map((req, i) => {
              const met = req.test(newPassword);
              return (
                <View key={i} style={styles.reqRow}>
                  <Ionicons
                    name={met ? 'checkmark-circle' : 'ellipse-outline'}
                    size={14}
                    color={met ? '#2E8B57' : '#aaa'}
                  />
                  <Text style={[styles.reqText, met && styles.reqMet]}>{req.label}</Text>
                </View>
              );
            })}
            <Text style={styles.caseNote}>
              Password is case-sensitive. Use the eye icon to verify what you typed.
            </Text>
          </View>

          <TouchableOpacity style={[styles.btn, { marginTop: 16 }]} onPress={handleResetPassword} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Update Password</Text>}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 30, backgroundColor: '#fff', justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#2E8B57', marginBottom: 30, textAlign: 'center' },
  label: { fontSize: 14, color: '#666', marginBottom: 12 },
  input: { backgroundColor: '#f9f9f9', padding: 18, borderRadius: 12, marginBottom: 20, fontSize: 16, borderWidth: 1, borderColor: '#eee' },
  otpInput: { textAlign: 'center', fontSize: 24, letterSpacing: 10, fontWeight: 'bold' },
  btn: { backgroundColor: '#2E8B57', padding: 18, borderRadius: 12, alignItems: 'center', elevation: 2 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  changeEmailLink: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#2E8B57', fontWeight: '600' },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    paddingHorizontal: 18,
  },
  passwordInput: { flex: 1, fontSize: 16, paddingVertical: 18 },
  eyeBtn: { paddingLeft: 10 },
  requirementsBox: { backgroundColor: '#F5F5F5', borderRadius: 8, padding: 12, marginTop: 14 },
  requirementsTitle: { fontSize: 12, fontWeight: '700', color: '#444', marginBottom: 6 },
  reqRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6 },
  reqText: { fontSize: 12, color: '#aaa' },
  reqMet: { color: '#2E8B57', fontWeight: '600' },
  caseNote: { fontSize: 11, color: '#888', marginTop: 8, lineHeight: 16 },
});
