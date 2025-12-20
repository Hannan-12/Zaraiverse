import React, { useState } from 'react';
import { 
  View, Text, TextInput, StyleSheet, ScrollView, Image, 
  TouchableOpacity, Alert, ActivityIndicator 
} from 'react-native';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth'; // Added deleteUser for cleanup
import { auth, db } from '../../services/firebase';
import { doc, setDoc } from 'firebase/firestore';

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
    if (password.length < 6) {
      Alert.alert("Error", "Password should be at least 6 characters long.");
      return;
    }

    setLoading(true);
    let userCredential;

    try {
      const isAdminEmail = email.toLowerCase() === 'admin@zaraiverse.com';
      const finalRole = isAdminEmail ? 'admin' : role;
      const finalStatus = isAdminEmail ? 'active' : 'pending';

      // 1. Create User in Firebase Auth
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      try {
        // 2. Save user profile to Firestore
        await setDoc(doc(db, 'users', user.uid), { 
          name, 
          email, 
          role: finalRole,
          status: finalStatus,
          createdAt: new Date(),
        });

        // 3. Success Handling
        if (isAdminEmail) {
          Alert.alert("Welcome Admin", "Admin account created and activated.");
          navigation.navigate('Login'); 
        } else {
          Alert.alert(
            "Verification Required", 
            "A 6-digit code has been sent to your email for verification."
          );
          // Navigate to OTP screen as requested
          navigation.navigate('OTP', { email: email }); 
        }

      } catch (dbError) {
        // ✅ CRITICAL FIX: Delete Auth user if Firestore write fails
        // This prevents "Ghost Users" from being stuck in Auth without a DB profile
        if (user) {
          await deleteUser(user);
        }
        console.error("Firestore Write Error:", dbError);
        Alert.alert("Registration Error", "Database profile creation failed. Please check your internet and try again.");
      }

    } catch (e) {
      if (e.code === 'auth/email-already-in-use') {
        Alert.alert("Registration Failed", "This email address is already in use.");
      } else {
        Alert.alert("Registration Failed", e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
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
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <TextInput 
          placeholder="Enter your password" 
          style={styles.input} 
          value={password} 
          onChangeText={setPassword} 
          secureTextEntry 
        />
      </View>

      <Text style={styles.roleLabel}>Select Role:</Text>
      <View style={styles.roleButtonsContainer}>
        {roles.map(r => (
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
        {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.registerButtonText}>Register</Text>}
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.backToLoginContainer} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.backToLoginText}>
          Already have an account? <Text style={styles.backToLoginLink}>Sign In</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 25, backgroundColor: '#FFFFFF', paddingBottom: 20 },
  logo: { width: 120, height: 120, alignSelf: 'center', marginBottom: 15 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 25, color: '#000000' },
  inputContainer: { marginBottom: 15 },
  label: { fontSize: 14, color: '#333', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16 },
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