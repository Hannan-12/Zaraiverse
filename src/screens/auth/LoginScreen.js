import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'; // Import signOut
import { auth, db } from '../../services/firebase';
import { doc, getDoc } from 'firebase/firestore'; // Import Firestore functions

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      // 1. Attempt Firebase Auth Login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Check Firestore Profile for Status
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const role = userData.role || 'user';
        // Treat missing status as 'pending' to match Admin panel logic
        const status = userData.status || 'pending'; 

        // 3. Logic: If NOT admin AND status is NOT active -> Block
        if (role !== 'admin' && status !== 'active') {
          await signOut(auth); // Log them out immediately
          
          if (status === 'blocked') {
             Alert.alert("Access Denied", "Your account has been blocked by an admin.");
          } else {
             Alert.alert("Access Denied", "Your account is pending approval by an admin.");
          }
          setLoading(false);
          return; // Stop execution, don't navigate
        }
        
        // If we get here, login is valid! AuthContext will handle navigation.
      } else {
        // Fallback if no profile exists yet (shouldn't happen often)
        console.warn("No user profile found in Firestore.");
      }

    } catch (e) {
      // Handle standard auth errors
      if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        Alert.alert("Login Error", "Invalid email or password.");
      } else {
        Alert.alert("Error", e.message);
      }
      setLoading(false);
    }
    // Note: If successful, AuthContext listener handles the redirect, so we don't set loading(false) here to prevent flicker.
  };

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/ZaraiVerse.png')} style={styles.logo} />
      <Text style={styles.title}>ZaraiVerse</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput 
          placeholder="Enter your email" 
          value={email} 
          onChangeText={setEmail} 
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <TextInput 
          placeholder="Enter your password" 
          value={password} 
          onChangeText={setPassword} 
          secureTextEntry 
          style={styles.input} 
        />
      </View>

      <TouchableOpacity 
        style={styles.signInButton} 
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.signInButtonText}>Sign In</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.signUpContainer} 
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={styles.signUpText}>
          Don't have an account? <Text style={styles.signUpLink}>Sign Up</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 25,
    backgroundColor: '#FFFFFF',
  },
  logo: { width: 150, height: 150, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#000' },
  inputContainer: { marginBottom: 15 },
  label: { fontSize: 14, color: '#333', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16 },
  signInButton: { backgroundColor: '#8BC34A', paddingVertical: 15, borderRadius: 8, alignItems: 'center', elevation: 2, marginTop: 10 },
  signInButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  signUpContainer: { marginTop: 20, alignItems: 'center' },
  signUpText: { fontSize: 14, color: '#555' },
  signUpLink: { fontWeight: 'bold', color: '#8BC34A' },
});