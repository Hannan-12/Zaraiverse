import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // --- NEW: State for loading and error messages ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Successful login is handled automatically by the AuthContext
    } catch (e) {
      // Provide more user-friendly error messages
      if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        setError("Invalid email or password.");
      } else {
        setError("An error occurred. Please try again.");
      }
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* ... */}
      <Image 
        source={require('../../assets/ZaraiVerse.png')}
        style={styles.logo} 
      />
      {/* ... */}

      <Text style={styles.title}>ZaraiVerse</Text>
      
      {/* --- NEW: Display error messages on screen --- */}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

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

      <TouchableOpacity onPress={() => {/* Add forgot password logic here */}}>
        <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
      </TouchableOpacity>

      {/* --- UPDATED: Button now shows loading indicator --- */}
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
  logo: {
    width: 150,
    height: 150,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20, // Adjusted margin
    color: '#000000',
  },
  // --- NEW STYLE for error text ---
  errorText: {
    color: '#d9534f', // Red color for errors
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  forgotPasswordText: {
    textAlign: 'right',
    color: '#555',
    marginBottom: 25,
    fontSize: 14,
  },
  signInButton: {
    backgroundColor: '#8BC34A',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signUpContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 14,
    color: '#555',
  },
  signUpLink: {
    fontWeight: 'bold',
    color: '#8BC34A',
  },
});