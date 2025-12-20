// src/screens/auth/OTPScreen.js
import React, { useState, useRef, useEffect, useContext } from 'react';
import { 
  View, Text, TextInput, StyleSheet, TouchableOpacity, 
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image 
} from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import { sendOTP } from '../../services/emailService';
import { AuthContext } from '../../contexts/AuthContext';

export default function OTPScreen({ route, navigation }) {
  const { email, correctOtp: initialOtp } = route.params;
  const { logout } = useContext(AuthContext);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [currentCorrectOtp, setCurrentCorrectOtp] = useState(initialOtp);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const inputs = useRef([]);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async () => {
    const enteredCode = otp.join('');
    if (enteredCode !== currentCorrectOtp) return Alert.alert("Error", "Incorrect code.");

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), { status: 'active' });
        Alert.alert("Success", "Account activated!");
      }
    } catch (error) {
      Alert.alert("Error", "Activation failed.");
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setLoading(true);
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const result = await sendOTP(email, newOtp);
    setLoading(false);
    if (result.success) {
      setCurrentCorrectOtp(newOtp);
      setTimer(60);
      setCanResend(false);
      Alert.alert("Sent", "New code sent!");
    }
  };

  const handleChange = (text, index) => {
    let newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text.length !== 0 && index < 5) inputs.current[index + 1].focus();
  };

  const handleBackspace = (event, index) => {
    if (event.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <Image source={require('../../assets/ZaraiVerse.png')} style={styles.logo} />
      <Text style={styles.title}>Verify Email</Text>
      <Text style={styles.subtitle}>Enter code sent to {email}</Text>
      
      <View style={styles.otpContainer}>
        {otp.map((digit, i) => (
          <TextInput
            key={i}
            ref={(ref) => inputs.current[i] = ref}
            style={styles.otpBox}
            keyboardType="numeric"
            maxLength={1}
            value={digit}
            onChangeText={(text) => handleChange(text, i)}
            onKeyPress={(e) => handleBackspace(e, i)}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify & Activate</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.resendBtn} onPress={handleResend} disabled={!canResend}>
        <Text style={[styles.resendText, !canResend && styles.disabledText]}>
          {canResend ? "Resend OTP" : `Resend in ${timer}s`}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backContainer} onPress={logout}>
        <Text style={styles.backText}>Cancel & <Text style={styles.backLink}>Go Back</Text></Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 25, justifyContent: 'center' },
  logo: { width: 100, height: 100, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { textAlign: 'center', color: '#666', marginBottom: 30 },
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  otpBox: { width: 45, height: 55, borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 10, textAlign: 'center', fontSize: 22, fontWeight: 'bold' },
  button: { backgroundColor: '#8BC34A', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  resendBtn: { marginTop: 20, alignSelf: 'center' },
  resendText: { color: '#8BC34A', fontWeight: 'bold' },
  disabledText: { color: '#ccc' },
  backContainer: { marginTop: 25, alignItems: 'center' },
  backLink: { color: '#8BC34A', fontWeight: 'bold' }
});