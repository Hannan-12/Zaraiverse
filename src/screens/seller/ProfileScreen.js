import React, { useContext, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Alert, 
  ActivityIndicator, 
  TextInput 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { db } from '../../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { AuthContext } from '../../contexts/AuthContext';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');

  // Update the Seller's name in Firestore
  const handleUpdateName = async () => {
    if (!newName.trim()) return Alert.alert("Error", "Name cannot be empty.");
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { name: newName });
      setIsEditing(false);
      Alert.alert("Success", "Name updated!");
    } catch (e) {
      Alert.alert("Error", "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  // Pick and upload profile image as Base64 string
  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "Allow access to your photos to change profile picture.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2, // Low quality to stay under Firestore 1MB limit
      base64: true,
    });

    if (!result.canceled) {
      setLoading(true);
      try {
        const imageBase64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
        await updateDoc(doc(db, 'users', user.uid), { photoURL: imageBase64 });
      } catch (e) {
        Alert.alert("Error", "Photo update failed.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#2E8B57', '#1B5E20']} style={styles.header}>
        <Text style={styles.headerTitle}>Seller Profile</Text>
      </LinearGradient>

      <View style={styles.profileCard}>
        {/* Profile Image Section */}
        <TouchableOpacity onPress={handlePickImage} disabled={loading}>
          <Image 
            source={user?.photoURL ? { uri: user.photoURL } : require('../../assets/ZaraiVerse.png')} 
            style={styles.avatar} 
          />
          <View style={styles.cameraIcon}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color="#fff" />
            </View>
          )}
        </TouchableOpacity>
        
        {/* Name Editing Section */}
        {isEditing ? (
          <View style={styles.editSection}>
            <TextInput 
              style={styles.input} 
              value={newName} 
              onChangeText={setNewName} 
              placeholder="Edit Name" 
            />
            <TouchableOpacity onPress={handleUpdateName} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.userName}>{user?.name || 'Seller User'}</Text>
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Text style={styles.editLink}>Edit Profile</Text>
            </TouchableOpacity>
          </>
        )}
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role?.toUpperCase() || 'SELLER'}</Text>
        </View>

        {/* --- NAVIGATION MENU --- */}
        <View style={styles.menuWrapper}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('HelpCenter')}>
            <Ionicons name="help-circle-outline" size={24} color="#333" />
            <Text style={styles.menuText}>Help Center</Text>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('PrivacyPolicy')}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#333" />
            <Text style={styles.menuText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Ionicons name="log-out-outline" size={20} color="#EF5350" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { height: 180, paddingTop: 60, alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  profileCard: { 
    backgroundColor: '#fff', 
    marginHorizontal: 20, 
    marginTop: -60, 
    borderRadius: 20, 
    padding: 25, 
    alignItems: 'center', 
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 }
  },
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, borderColor: '#fff' },
  loadingOverlay: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: 'rgba(0,0,0,0.3)', 
    borderRadius: 55, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  cameraIcon: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#2E8B57', padding: 7, borderRadius: 20, borderWidth: 2, borderColor: '#fff' },
  userName: { fontSize: 24, fontWeight: 'bold', marginTop: 10, color: '#333' },
  userEmail: { color: '#666', marginBottom: 10, fontSize: 14 },
  roleBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 10 },
  roleText: { color: '#2E8B57', fontSize: 12, fontWeight: 'bold' },
  editLink: { color: '#2E8B57', fontWeight: 'bold', marginVertical: 8 },
  editSection: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  input: { borderBottomWidth: 1, borderColor: '#ccc', width: 160, marginRight: 10, padding: 8, fontSize: 16 },
  saveBtn: { backgroundColor: '#2E8B57', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },
  menuWrapper: { width: '100%', marginTop: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  menuText: { flex: 1, marginLeft: 15, fontSize: 16, color: '#333' },
  logoutButton: { 
    flexDirection: 'row', 
    backgroundColor: '#FFEBEE', 
    margin: 20, 
    padding: 16, 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  logoutText: { color: '#EF5350', fontWeight: 'bold', marginLeft: 10, fontSize: 16 }
});