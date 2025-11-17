// src/screens/farmer/ProfileScreen.js
import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Removed: import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '../../services/firebase'; // Assuming you export db from firebase
import { signOut } from 'firebase/auth';
// Removed: import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// Removed: import { doc, updateDoc } from 'firebase/firestore';
import { AuthContext } from '../../contexts/AuthContext'; //

export default function ProfileScreen() {
  const { user } = useContext(AuthContext);
  // Initialize image state to null as photoURL may not be set and we aren't loading it
  const [imageUri, setImageUri] = useState(null); // <-- CHANGED: Default to null

  if (!user) {
    // This is a fallback, in case the screen renders before user is loaded
    return null; 
  }

  // --- LOGOUT FUNCTION (Unchanged) ---
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // The onAuthStateChanged listener in AuthContext will handle navigation
    } catch (error) {
      console.error("Error signing out: ", error);
      Alert.alert("Logout Error", "Could not log you out. Please try again.");
    }
  };

  // --- MODIFIED: IMAGE PICKER FUNCTION (Now shows a disabled message) ---
  const handlePickImage = async () => {
    Alert.alert("Feature Disabled", "Profile picture upload is disabled as Firebase Storage is not in use."); //
  };

  // --- REMOVED: IMAGE UPLOAD FUNCTION ---
  // The 'uploadImage' function is removed entirely.


  return (
    <ScrollView style={styles.outerContainer} contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.avatarContainer} onPress={handlePickImage}>
        {/* Always show placeholder since we can't save/load images */}
        <View style={styles.placeholder}>
            <Ionicons name="person" size={50} color="#ccc" />
        </View>
        <View style={styles.editIcon}>
            <Ionicons name="eye-off-outline" size={18} color="#fff" />
        </View>
      </TouchableOpacity>

      <Text style={styles.userName}>{user.displayName || 'Seller'}</Text>
      <Text style={styles.userEmail}>{user.email}</Text>

      <View style={styles.roleBadge}>
        <Text style={styles.roleText}>{user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}</Text>
      </View>
      
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#F8F9FA' },
  container: { 
    flexGrow: 1,
    alignItems: 'center', 
    paddingTop: 40,
    paddingBottom: 20
  },
  avatarContainer: {
    marginBottom: 20,
    position: 'relative'
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#2e7d32',
  },
  placeholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e9e9e9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ddd',
  },
  editIcon: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#2e7d32',
    borderRadius: 15,
    padding: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF'
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  roleBadge: {
    backgroundColor: 'rgba(46, 125, 50, 0.1)', // Light green background
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 15,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.3)',
  },
  roleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e7d32', // Dark green text
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d9534f', // A nice red for logout
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});