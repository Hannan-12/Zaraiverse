import React, { useState, useRef, useContext } from 'react';
import { 
  View, Text, TextInput, StyleSheet, TouchableOpacity, 
  Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform 
} from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';

export default function OTPScreen() {
  const { user, logout } = useContext(AuthContext);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);

  const handleVerify = async () => {
    const enteredCode = otp.join('');
    
    // 1. Verify against the real code saved in Firestore
    if (enteredCode !== user?.otpCode) {
      Alert.alert("Verification Failed", "The OTP entered is incorrect. Please check your email.");
      return;
    }

    setLoading(true);
    
    // 2. Logic for Admin Approval workflow
    setTimeout(async () => {
      setLoading(false);
      Alert.alert(
        "Verification Successful", 
        "Your email has been verified! Your account is now waiting for Admin approval. You will be able to log in once the admin activates your account.",
        [
          { 
            text: "Go to Login", 
            onPress: async () => {
              await logout(); // This takes the user back to the Login screen
            } 
          }
        ]
      );
    }, 1000);
  };

  const updateOtpValue = (text, index) => {
    let newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 5) {
      inputs.current[index + 1].focus();
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <Image source={require('../../assets/ZaraiVerse.png')} style={styles.logo} />
      <Text style={styles.title}>Verify Email</Text>
      <Text style={styles.subtitle}>A 6-digit code was sent to:{"\n"}{user?.email}</Text>
      
      <View style={styles.otpContainer}>
        {otp.map((digit, i) => (
          <TextInput
            key={i}
            ref={(ref) => inputs.current[i] = ref}
            style={styles.otpBox}
            keyboardType="numeric"
            maxLength={1}
            value={digit}
            onChangeText={(text) => updateOtpValue(text, i)}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify & Submit</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.backLink} onPress={logout}>
        <Text style={styles.backText}>Cancel & <Text style={{fontWeight:'bold', color: '#8BC34A'}}>Go Back</Text></Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 25, justifyContent: 'center', alignItems: 'center' },
  logo: { width: 100, height: 100, marginBottom: 20 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { textAlign: 'center', color: '#666', marginBottom: 30, lineHeight: 20 },
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 30 },
  otpBox: { width: 45, height: 55, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 10, textAlign: 'center', fontSize: 22, fontWeight: 'bold' },
  button: { backgroundColor: '#8BC34A', padding: 15, borderRadius: 10, width: '100%', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  backLink: { marginTop: 25 },
  backText: { color: '#555' }
});