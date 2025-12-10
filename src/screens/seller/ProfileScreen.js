// src/screens/seller/ProfileScreen.js
import React, { useContext, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '../../services/firebase';
import { signOut } from 'firebase/auth';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { AuthContext } from '../../contexts/AuthContext';

export default function ProfileScreen() {
  const { user } = useContext(AuthContext);
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);

  // 1. Listen to real-time changes in Firestore to update the image automatically
  useEffect(() => {
    if (!user?.uid) return;

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // If photoURL exists (base64 string), set it
        if (data.photoURL) {
          setImageUri(data.photoURL);
        }
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
      Alert.alert("Error", "Could not log out.");
    }
  };

  // 2. Pick Image and Convert to Base64 (Text)
  const handlePickAndUploadImage = async () => {
    // Request Permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "Allow camera roll access to change profile picture.");
      return;
    }

    // Launch Picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Corrected Enum
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2, // ⚠️ LOW QUALITY REQUIRED: Firestore has a 1MB limit per document
      base64: true, // <--- This gives us the text string
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      saveImageToFirestore(result.assets[0].base64);
    }
  };

  // 3. Save "Text" Image to Firestore
  const saveImageToFirestore = async (base64String) => {
    // Construct the data URL
    const imageBase64 = `data:image/jpeg;base64,${base64String}`;

    // Safety Check: 1MB limit (approx 1,048,576 bytes)
    if (imageBase64.length > 1000000) {
      Alert.alert("Image too large", "Please select a smaller or simpler image.");
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      
      // Update the 'photoURL' field with the long text string
      await updateDoc(userRef, {
        photoURL: imageBase64
      });

      Alert.alert("Success", "Profile picture updated!");
    } catch (error) {
      console.error("Firestore Update Error:", error);
      Alert.alert("Error", "Could not save image. It might be too large for the database.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <ScrollView style={styles.outerContainer} contentContainerStyle={styles.container}>
      
      <View style={styles.headerSection}>
        <TouchableOpacity style={styles.avatarContainer} onPress={handlePickAndUploadImage} disabled={loading}>
          {loading ? (
            <View style={[styles.avatar, styles.loadingAvatar]}>
              <ActivityIndicator size="small" color="#2E8B57" />
            </View>
          ) : imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.avatar} />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="person" size={50} color="#ccc" />
            </View>
          )}

          <View style={styles.editIcon}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>

        <Text style={styles.userName}>{user.displayName || 'Admin User'}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user.role ? user.role.toUpperCase() : 'USER'}</Text>
        </View>
      </View>

      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#F4F6F8' },
  container: { flexGrow: 1, alignItems: 'center', paddingBottom: 30 },
  
  headerSection: {
    width: '100%',
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginBottom: 20,
  },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#2E8B57',
  },
  loadingAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eee'
  },
  placeholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ccc',
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2E8B57',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  userEmail: { fontSize: 14, color: '#666', marginBottom: 10 },
  roleBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  roleText: { color: '#2E8B57', fontSize: 12, fontWeight: '700' },

  menuSection: { width: '90%' },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#D32F2F',
    paddingVertical: 15,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    elevation: 2,
  },
  logoutButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});