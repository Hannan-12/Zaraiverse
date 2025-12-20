import React, { useState } from 'react';
import { 
  View, TextInput, Text, StyleSheet, Image, TouchableOpacity, 
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'; 
import { auth, db } from '../../services/firebase';
import { doc, getDoc } from 'firebase/firestore'; 
import { Ionicons } from '@expo/vector-icons'; // Added for eye icon

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false); // New state

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const role = userData.role || 'user';
        const status = userData.status || 'pending'; 

        if (role !== 'admin' && status !== 'active') {
          await signOut(auth); 
          
          if (status === 'blocked') {
             Alert.alert("Access Denied", "Your account has been blocked by an admin.");
          } else {
             Alert.alert("Access Denied", "Your account is pending approval by an admin.");
          }
          setLoading(false);
          return; 
        }
      } else {
        Alert.alert("Login Error", "User profile not found.");
        await signOut(auth);
        setLoading(false);
        return;
      }

    } catch (e) {
      Alert.alert("Error", e.message);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
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
          <View style={styles.passwordWrapper}>
            <TextInput 
              placeholder="Enter your password" 
              value={password} 
              onChangeText={setPassword} 
              secureTextEntry={!passwordVisible} 
              style={[styles.input, { flex: 1, borderBottomWidth: 0 }]} 
            />
            <TouchableOpacity 
              onPress={() => setPasswordVisible(!passwordVisible)} 
              style={styles.eyeIcon}
            >
              <Ionicons 
                name={passwordVisible ? "eye-off" : "eye"} 
                size={22} 
                color="#888" 
              />
            </TouchableOpacity>
          </View>
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 25, backgroundColor: '#FFFFFF', paddingBottom: 30 },
  logo: { width: 150, height: 150, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#000' },
  inputContainer: { marginBottom: 15 },
  label: { fontSize: 14, color: '#333', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16 },
  passwordWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#E0E0E0', 
    borderRadius: 8 
  },
  eyeIcon: { paddingHorizontal: 10 },
  signInButton: { backgroundColor: '#8BC34A', paddingVertical: 15, borderRadius: 8, alignItems: 'center', elevation: 2, marginTop: 10 },
  signInButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  signUpContainer: { marginTop: 20, alignItems: 'center' },
  signUpText: { fontSize: 14, color: '#555' },
  signUpLink: { fontWeight: 'bold', color: '#8BC34A' },
});