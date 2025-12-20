import React, { useContext, useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '../../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { AuthContext } from '../../contexts/AuthContext';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

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
      } catch (e) { Alert.alert("Error", "Failed to update photo."); }
      finally { setLoading(false); }
    }
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#2E8B57', '#1B5E20']} style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </LinearGradient>

      <View style={styles.profileCard}>
        <TouchableOpacity onPress={handlePickImage}>
          <Image 
            source={user?.photoURL ? { uri: user.photoURL } : require('../../assets/ZaraiVerse.png')} 
            style={styles.avatar} 
          />
          <View style={styles.cameraIcon}><Ionicons name="camera" size={14} color="#fff" /></View>
        </TouchableOpacity>
        
        {/* Displaying the name entered at signup */}
        <Text style={styles.userName}>{user?.name || 'Zarai User'}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={styles.roleChip}><Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text></View>
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
  userEmail: { color: '#666', marginBottom: 10 },
  roleChip: { backgroundColor: '#E8F5E9', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20 },
  roleText: { color: '#2E8B57', fontSize: 12, fontWeight: 'bold' },
  logoutButton: { flexDirection: 'row', backgroundColor: '#FFEBEE', margin: 20, padding: 15, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  logoutText: { color: '#EF5350', fontWeight: 'bold', marginLeft: 10 }
});