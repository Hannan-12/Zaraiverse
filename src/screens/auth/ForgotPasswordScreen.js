import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { sendOTP } from '../../services/emailService'; // ✅ Integrated your service

export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [sentOtp, setSentOtp] = useState(null); // To store the generated code
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [userDocId, setUserDocId] = useState(null);

  // --- Step 1: Verify Email & Send Real OTP ---
  const handleVerifyEmail = async () => {
    if (!email) return Alert.alert("Error", "Please enter your email.");
    
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase().trim()));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        Alert.alert("Not Found", "No account associated with this email.");
      } else {
        // 1. Generate a random 4-digit OTP
        const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
        
        // 2. Send the OTP via EmailJS
        const emailResult = await sendOTP(email.toLowerCase().trim(), generatedOtp);
        
        if (emailResult.success) {
          setUserDocId(snap.docs[0].id);
          setSentOtp(generatedOtp); // Save for verification
          Alert.alert("OTP Sent 📧", "A verification code has been sent to your email.");
          setStep(2);
        } else {
          Alert.alert("Email Error", "Could not send OTP. Please check your EmailJS setup.");
        }
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- Step 2: Verify the OTP ---
  const handleVerifyOTP = () => {
    if (otpInput === sentOtp) {
      setStep(3);
    } else {
      Alert.alert("Invalid OTP", "The code you entered is incorrect.");
    }
  };

  // --- Step 3: Update Password in Database ---
  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) return Alert.alert("Error", "Passwords do not match.");
    if (newPassword.length < 6) return Alert.alert("Error", "Password must be at least 6 characters.");

    setLoading(true);
    try {
      const userRef = doc(db, 'users', userDocId);
      await updateDoc(userRef, { password: newPassword });
      
      Alert.alert("Success ✅", "Your password has been updated! Please login with your new password.", [
        { text: "Go to Login", onPress: () => navigation.navigate('Login') }
      ]);
    } catch (e) {
      Alert.alert("Error", "Failed to update password in database.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Password Recovery</Text>
      
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
          />
          <TouchableOpacity style={styles.btn} onPress={handleVerifyEmail} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send OTP</Text>}
          </TouchableOpacity>
        </View>
      )}

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
          <TouchableOpacity onPress={() => setStep(1)} style={{marginTop: 20, alignItems: 'center'}}>
            <Text style={{color: '#2E8B57'}}>Change Email</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 3 && (
        <View>
          <Text style={styles.label}>Enter your new password</Text>
          <TextInput 
            style={styles.input} 
            placeholder="New Password" 
            value={newPassword} 
            onChangeText={setNewPassword} 
            secureTextEntry 
          />
          <TextInput 
            style={styles.input} 
            placeholder="Confirm New Password" 
            value={confirmPassword} 
            onChangeText={setConfirmPassword} 
            secureTextEntry 
          />
          <TouchableOpacity style={styles.btn} onPress={handleResetPassword} disabled={loading}>
             {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Update Password</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30, backgroundColor: '#fff', justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#2E8B57', marginBottom: 30, textAlign: 'center' },
  label: { fontSize: 14, color: '#666', marginBottom: 12 },
  input: { backgroundColor: '#f9f9f9', padding: 18, borderRadius: 12, marginBottom: 20, fontSize: 16, borderWidth: 1, borderColor: '#eee' },
  otpInput: { textAlign: 'center', fontSize: 24, letterSpacing: 10, fontWeight: 'bold' },
  btn: { backgroundColor: '#2E8B57', padding: 18, borderRadius: 12, alignItems: 'center', elevation: 2 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});