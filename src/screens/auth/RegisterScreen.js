import { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, Image,
  TouchableOpacity, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { auth, db } from '../../services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { sendOTP } from '../../services/emailService';
import { Ionicons } from '@expo/vector-icons';

// Password must be 8+ chars, 1 uppercase, 1 digit, 1 special character
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_#^()\-+=])[A-Za-z\d@$!%*?&_#^()\-+=]{8,}$/;

const PASSWORD_REQUIREMENTS = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'At least one uppercase letter (A–Z)', test: (p) => /[A-Z]/.test(p) },
  { label: 'At least one number (0–9)', test: (p) => /\d/.test(p) },
  { label: 'At least one special character (@$!%*?&#)', test: (p) => /[@$!%*?&_#^()\-+=]/.test(p) },
];

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('farmer');
  const [loading, setLoading] = useState(false);

  const roles = ['farmer', 'seller', 'expert'];

  const register = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    if (!PASSWORD_REGEX.test(password)) {
      Alert.alert(
        'Weak Password',
        'Password must be at least 8 characters and include:\n• One uppercase letter\n• One number\n• One special character (@$!%*?&#)'
      );
      return;
    }

    setLoading(true);

    try {
      const isAdminEmail = email.toLowerCase() === 'admin@zaraiverse.com';
      const finalRole = isAdminEmail ? 'admin' : role;
      const finalStatus = isAdminEmail ? 'active' : 'pending';

      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      try {
        await setDoc(doc(db, 'users', user.uid), {
          name,
          email,
          role: finalRole,
          status: finalStatus,
          otpCode: generatedOtp,
          createdAt: new Date(),
        });

        if (isAdminEmail) {
          Alert.alert('Welcome Admin', 'Admin account created and activated.');
        } else {
          const emailResult = await sendOTP(email, generatedOtp);
          if (emailResult.success) {
            Alert.alert(
              'Verification Required',
              'A 6-digit code has been sent to your email for verification.'
            );
          } else {
            throw new Error('Failed to send verification email. ' + emailResult.error);
          }
        }
      } catch (dbError) {
        if (user) await deleteUser(user);
        console.error('Firestore/Email Error:', dbError);
        Alert.alert('Registration Error', dbError.message || 'Failed to create profile.');
      }
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') {
        Alert.alert('Registration Failed', 'This email address is already in use.');
      } else {
        Alert.alert('Registration Failed', e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Image source={require('../../assets/ZaraiVerse.png')} style={styles.logo} />
      <Text style={styles.title}>Create Account</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          placeholder="Enter your full name"
          style={styles.input}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          placeholder="Enter your email"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordRow}>
          <TextInput
            placeholder="Enter your password"
            style={styles.passwordInput}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.eyeBtn}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        {/* Live password requirements */}
        <View style={styles.requirementsBox}>
          <Text style={styles.requirementsTitle}>Password requirements:</Text>
          {PASSWORD_REQUIREMENTS.map((req, i) => {
            const met = req.test(password);
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
            <Ionicons name="information-circle-outline" size={13} color="#888" /> Password is case-sensitive. Use the eye icon to verify what you typed.
          </Text>
        </View>
      </View>

      <Text style={styles.roleLabel}>Select Role:</Text>
      <View style={styles.roleButtonsContainer}>
        {roles.map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.roleButton, role === r && styles.roleButtonActive]}
            onPress={() => setRole(r)}
          >
            <Text style={[styles.roleButtonText, role === r && styles.roleButtonTextActive]}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.registerButton} onPress={register} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.registerButtonText}>Register</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.backToLoginContainer} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.backToLoginText}>
          Already have an account?{' '}
          <Text style={styles.backToLoginLink}>Sign In</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 25, backgroundColor: '#FFFFFF', paddingBottom: 30, paddingTop: 20 },
  logo: { width: 120, height: 120, alignSelf: 'center', marginBottom: 15 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 25, color: '#000000' },
  inputContainer: { marginBottom: 15 },
  label: { fontSize: 14, color: '#333', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, paddingHorizontal: 15 },
  passwordInput: { flex: 1, fontSize: 16, paddingVertical: 12 },
  eyeBtn: { paddingLeft: 8 },
  requirementsBox: { backgroundColor: '#F5F5F5', borderRadius: 8, padding: 12, marginTop: 8 },
  requirementsTitle: { fontSize: 12, fontWeight: '700', color: '#444', marginBottom: 6 },
  reqRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6 },
  reqText: { fontSize: 12, color: '#aaa' },
  reqMet: { color: '#2E8B57', fontWeight: '600' },
  caseNote: { fontSize: 11, color: '#888', marginTop: 8, lineHeight: 16 },
  roleLabel: { fontSize: 14, color: '#333', marginTop: 5, marginBottom: 10, textAlign: 'center' },
  roleButtonsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 25, flexWrap: 'wrap' },
  roleButton: { backgroundColor: '#F0F0F0', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, marginHorizontal: 5, marginBottom: 10 },
  roleButtonActive: { backgroundColor: '#8BC34A' },
  roleButtonText: { color: '#555', fontSize: 14, fontWeight: '600' },
  roleButtonTextActive: { color: '#FFFFFF' },
  registerButton: { backgroundColor: '#8BC34A', paddingVertical: 15, borderRadius: 8, alignItems: 'center', elevation: 2, marginBottom: 15 },
  registerButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  backToLoginContainer: { alignItems: 'center', marginTop: 10 },
  backToLoginText: { fontSize: 14, color: '#555' },
  backToLoginLink: { fontWeight: 'bold', color: '#8BC34A' },
});
