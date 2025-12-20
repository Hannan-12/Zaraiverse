import React, { useContext, useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, TextInput 
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

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true, aspect: [1, 1], quality: 0.2, base64: true,
    });
    if (!result.canceled) {
      setLoading(true);
      try {
        await updateDoc(doc(db, 'users', user.uid), { 
          photoURL: `data:image/jpeg;base64,${result.assets[0].base64}` 
        });
      } catch (e) { Alert.alert("Error", "Photo update failed."); }
      finally { setLoading(false); }
    }
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#2E8B57', '#1B5E20']} style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </LinearGradient>

      <View style={styles.profileCard}>
        <TouchableOpacity onPress={handlePickImage}>
          <Image source={user?.photoURL ? { uri: user.photoURL } : require('../../assets/ZaraiVerse.png')} style={styles.avatar} />
          <View style={styles.cameraIcon}><Ionicons name="camera" size={14} color="#fff" /></View>
        </TouchableOpacity>
        
        {isEditing ? (
          <View style={styles.editSection}>
            <TextInput style={styles.input} value={newName} onChangeText={setNewName} placeholder="Edit Name" />
            <TouchableOpacity onPress={handleUpdateName} style={styles.saveBtn}>
              {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{color: '#fff', fontWeight: 'bold'}}>Save</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.userName}>{user?.name || 'Zarai User'}</Text>
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Text style={styles.editLink}>Edit Profile</Text>
            </TouchableOpacity>
          </>
        )}
        <Text style={styles.userEmail}>{user?.email}</Text>

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
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  profileCard: { backgroundColor: '#fff', marginHorizontal: 20, marginTop: -60, borderRadius: 20, padding: 25, alignItems: 'center', elevation: 5 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#fff' },
  cameraIcon: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#2E8B57', padding: 5, borderRadius: 15 },
  userName: { fontSize: 22, fontWeight: 'bold', marginTop: 10 },
  userEmail: { color: '#666', marginBottom: 5 },
  editLink: { color: '#2E8B57', fontWeight: 'bold', marginVertical: 5 },
  editSection: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  input: { borderBottomWidth: 1, borderColor: '#ccc', width: 140, marginRight: 10, padding: 5 },
  saveBtn: { backgroundColor: '#2E8B57', padding: 10, borderRadius: 8 },
  menuWrapper: { width: '100%', marginTop: 25 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  menuText: { flex: 1, marginLeft: 15, fontSize: 16, color: '#333' },
  logoutButton: { flexDirection: 'row', backgroundColor: '#FFEBEE', margin: 20, padding: 15, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  logoutText: { color: '#EF5350', fontWeight: 'bold', marginLeft: 10 }
});