import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '../../services/firebase';
import { signOut } from 'firebase/auth';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { AuthContext } from '../../contexts/AuthContext';

export default function ProfileScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- Logic: Fetch Real-time Profile Image ---
  useEffect(() => {
    if (!user?.uid) return;

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.photoURL) {
          setImageUri(data.photoURL);
        }
      }
    });

    return () => unsubscribe();
  }, [user]);

  // --- Logic: Logout ---
  const handleLogout = async () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: "destructive", 
          onPress: async () => {
            try {
              await signOut(auth);
            } catch (error) {
              console.error("Error signing out: ", error);
              Alert.alert("Error", "Could not log out.");
            }
          }
        }
      ]
    );
  };

  // --- Logic: Upload Image ---
  const handlePickAndUploadImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "Allow camera roll access to change profile picture.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2, // Low quality for Firestore limit
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      saveImageToFirestore(result.assets[0].base64);
    }
  };

  const saveImageToFirestore = async (base64String) => {
    const imageBase64 = `data:image/jpeg;base64,${base64String}`;
    if (imageBase64.length > 1000000) {
      Alert.alert("Image too large", "Please select a smaller image.");
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL: imageBase64
      });
      Alert.alert("Success", "Profile picture updated!");
    } catch (error) {
      console.error("Firestore Update Error:", error);
      Alert.alert("Error", "Could not save image.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  // --- Render Components ---
  const MenuOption = ({ icon, label, onPress, color = '#333' }) => (
    <TouchableOpacity style={styles.menuOption} onPress={onPress}>
      <View style={[styles.menuIconBox, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.menuText, { color }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* --- Header Section --- */}
        <LinearGradient
          colors={['#2E8B57', '#1B5E20']}
          style={styles.headerBackground}
        >
          <Text style={styles.headerTitle}>My Profile</Text>
        </LinearGradient>

        {/* --- Profile Card (Floating) --- */}
        <View style={styles.profileCard}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickAndUploadImage} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#2E8B57" style={styles.loadingIndicator} />
            ) : (
              <Image 
                source={imageUri ? { uri: imageUri } : require('../../assets/ZaraiVerse.png')} 
                style={styles.avatar} 
              />
            )}
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>

          <Text style={styles.userName}>{user.displayName || 'Zarai User'}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          
          <View style={styles.roleChip}>
            <Text style={styles.roleText}>
              {user.role ? user.role.toUpperCase() : 'FARMER'}
            </Text>
          </View>
        </View>

        {/* --- Settings Menu --- */}
        <View style={styles.menuContainer}>
          <Text style={styles.sectionHeader}>Account Settings</Text>
          
          <MenuOption 
            icon="person-outline" 
            label="Edit Profile Details" 
            onPress={() => Alert.alert("Coming Soon", "Edit Profile feature coming soon!")} 
            color="#2E8B57"
          />
          <MenuOption 
            icon="notifications-outline" 
            label="Notifications" 
            onPress={() => navigation.navigate('TaskReminders')} 
            color="#FFA726"
          />
          <MenuOption 
            icon="language-outline" 
            label="Language" 
            onPress={() => Alert.alert("Language", "Change language from Dashboard.")} 
            color="#42A5F5"
          />
          
          <Text style={[styles.sectionHeader, { marginTop: 20 }]}>Support</Text>
          
          <MenuOption 
            icon="help-circle-outline" 
            label="Help & Support" 
            onPress={() => Alert.alert("Support", "Contact us at support@zaraiverse.com")} 
            color="#78909C"
          />
          <MenuOption 
            icon="lock-closed-outline" 
            label="Privacy Policy" 
            onPress={() => {}} 
            color="#78909C"
          />
        </View>

        {/* --- Logout Button --- */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF5350" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  scrollContent: { paddingBottom: 40 },
  
  headerBackground: {
    height: 180,
    paddingTop: 60,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },

  profileCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -60, // Pull up over the header
    borderRadius: 20,
    paddingVertical: 25,
    paddingHorizontal: 20,
    alignItems: 'center',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#F5F7FA', // Matches background to look distinct
  },
  loadingIndicator: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2E8B57',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  roleChip: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  roleText: {
    color: '#2E8B57',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  menuContainer: {
    paddingHorizontal: 20,
    marginTop: 25,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#999',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    // Small shadow
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE', // Light red bg
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 30,
  },
  logoutText: {
    color: '#EF5350',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  versionText: {
    textAlign: 'center',
    color: '#ccc',
    marginTop: 20,
    fontSize: 12,
  },
});