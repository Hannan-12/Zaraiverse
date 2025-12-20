// src/screens/auth/RegisterScreen.js
import React, { useState } from 'react';
import { 
  View, Text, TextInput, StyleSheet, ScrollView, Image, 
  TouchableOpacity, Alert, ActivityIndicator 
} from 'react-native';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { auth, db } from '../../services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { sendOTP } from '../../services/emailService';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('farmer');
  const [loading, setLoading] = useState(false);

  const roles = ['farmer', 'seller', 'expert']; 

  const register = async () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    setLoading(true);

    try {
      const isAdminEmail = email.toLowerCase() === 'admin@zaraiverse.com';
      const finalRole = isAdminEmail ? 'admin' : role;
      const finalStatus = isAdminEmail ? 'active' : 'pending';

      // 1. Generate 6-digit OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

      // 2. Create Auth User
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;
      
      try {
        // 3. Save to Firestore
        await setDoc(doc(db, 'users', user.uid), { 
          name, email, role: finalRole, status: finalStatus, createdAt: new Date()
        });

        if (isAdminEmail) {
          Alert.alert("Welcome Admin", "Admin account activated.");
          navigation.navigate('Login'); 
        } else {
          // 4. Send Real OTP via EmailJS
          const emailResult = await sendOTP(email, generatedOtp);
          if (emailResult.success) {
            Alert.alert("Verify Email", "A 6-digit code has been sent.");
            navigation.navigate('OTP', { email, correctOtp: generatedOtp });
          } else {
            throw new Error("Failed to send verification email.");
          }
        }
      } catch (dbError) {
        if (user) await deleteUser(user); // Cleanup ghost user
        throw dbError;
      }
    } catch (e) {
      Alert.alert("Registration Failed", e.message);
    } finally { setLoading(false); }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={require('../../assets/ZaraiVerse.png')} style={styles.logo} />
      <Text style={styles.title}>Create Account</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} autoCapitalize="words" />
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
      </View>
      <View style={styles.roleButtonsContainer}>
        {roles.map(r => (
          <TouchableOpacity key={r} style={[styles.roleButton, role === r && styles.roleButtonActive]} onPress={() => setRole(r)}>
            <Text style={[styles.roleButtonText, role === r && styles.roleButtonTextActive]}>{r.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.registerButton} onPress={register} disabled={loading}>
        {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.registerButtonText}>Register</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 25, backgroundColor: '#FFFFFF' },
  logo: { width: 120, height: 120, alignSelf: 'center', marginBottom: 15 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 25 },
  inputContainer: { marginBottom: 15 },
  label: { fontSize: 14, color: '#333' },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 12 },
  roleButtonsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 20 },
  roleButton: { backgroundColor: '#F0F0F0', padding: 10, borderRadius: 20, minWidth: 80, alignItems: 'center' },
  roleButtonActive: { backgroundColor: '#8BC34A' },
  roleButtonText: { fontSize: 12, fontWeight: 'bold' },
  roleButtonTextActive: { color: '#FFFFFF' },
  registerButton: { backgroundColor: '#8BC34A', padding: 15, borderRadius: 8, alignItems: 'center' },
  registerButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }
});