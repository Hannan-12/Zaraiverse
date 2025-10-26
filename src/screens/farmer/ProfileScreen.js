// src/screens/farmer/ProfileScreen.js
import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '../../services/firebase'; // Assuming you export db from firebase
import { signOut } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { AuthContext } from '../../contexts/AuthContext';

export default function ProfileScreen() {
  const { user } = useContext(AuthContext);
  // Initialize image state with user's existing photoURL
  const [imageUri, setImageUri] = useState(user?.photoURL || null);

  if (!user) {
    // This is a fallback, in case the screen renders before user is loaded
    return null; 
  }

  // --- LOGOUT FUNCTION ---
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // The onAuthStateChanged listener in AuthContext will handle navigation
    } catch (error) {
      console.error("Error signing out: ", error);
      Alert.alert("Logout Error", "Could not log you out. Please try again.");
    }
  };

  // --- IMAGE PICKER FUNCTION ---
  const handlePickImage = async () => {
    // Request permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You need to allow access to your photos to upload an image.");
      return;
    }

    // Launch image picker
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Square aspect ratio for profile pictures
      quality: 0.5,
    });

    if (!pickerResult.canceled) {
      const uri = pickerResult.assets[0].uri;
      setImageUri(uri); // Show the new image immediately
      uploadImage(uri); // Start uploading to Firebase
    }
  };

  // --- IMAGE UPLOAD FUNCTION ---
  const uploadImage = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const storage = getStorage();
      // Create a unique path for the image using the user's ID
      const storageRef = ref(storage, `profile_pictures/${user.uid}`);

      // Upload the file
      await uploadBytes(storageRef, blob);

      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Update the user's document in Firestore with the new photoURL
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        photoURL: downloadURL,
      });

      Alert.alert("Success", "Profile picture updated!");

    } catch (error) {
      console.error("Error uploading image: ", error);
      Alert.alert("Upload Failed", "Could not upload your profile picture.");
    }
  };


  return (
    <ScrollView style={styles.outerContainer} contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.avatarContainer} onPress={handlePickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.avatar} />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="camera" size={40} color="#ccc" />
          </View>
        )}
        <View style={styles.editIcon}>
            <Ionicons name="pencil" size={18} color="#fff" />
        </View>
      </TouchableOpacity>

      <Text style={styles.userName}>{user.displayName || 'Farmer'}</Text>
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