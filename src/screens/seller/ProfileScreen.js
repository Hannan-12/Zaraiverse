import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
// ...
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../../contexts/AuthContext'; // ✅ Correct relative path


// ...

export default function ProfileScreen({ navigation }) {
  const { user, logout, setUser } = useContext(AuthContext);
  const [profileImage, setProfileImage] = useState(null);
  const [editVisible, setEditVisible] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          logout(); // ✅ clears user from context
          navigation.replace('Login'); // ✅ navigate to Login screen
        },
      },
    ]);
  };

  const handleSaveProfile = () => {
    setUser({ ...user, ...editData }); // update context with new data
    setEditVisible(false);
    Alert.alert('Profile Updated', 'Your profile details have been updated.');
  };

  return (
    <View style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleImagePick}>
          <Image
            source={
              profileImage
                ? { uri: profileImage }
                : { uri: 'https://cdn-icons-png.flaticon.com/512/847/847969.png' }
            }
            style={styles.profileImage}
          />
        </TouchableOpacity>
        <Text style={styles.name}>{user?.name || 'User Name'}</Text>
        <Text style={styles.role}>{user?.role || 'Seller'}</Text>
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={22} color="#4CAF50" />
          <Text style={styles.infoText}>{user?.email || 'user@example.com'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={22} color="#4CAF50" />
          <Text style={styles.infoText}>{user?.phone || '+92 000 0000000'}</Text>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.editButton} onPress={() => setEditVisible(true)}>
          <MaterialCommunityIcons name="account-edit-outline" size={20} color="#fff" />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Edit Profile Modal */}
      <Modal visible={editVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <TextInput
              style={styles.input}
              placeholder="Name"
              value={editData.name}
              onChangeText={(text) => setEditData({ ...editData, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={editData.email}
              onChangeText={(text) => setEditData({ ...editData, email: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone"
              value={editData.phone}
              onChangeText={(text) => setEditData({ ...editData, phone: text })}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#4CAF50' }]}
                onPress={handleSaveProfile}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#E53935' }]}
                onPress={() => setEditVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF9', padding: 20 },
  header: { alignItems: 'center', marginTop: 30 },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#4CAF50',
    marginBottom: 10,
  },
  name: { fontSize: 20, fontWeight: '700', color: '#333' },
  role: { fontSize: 15, color: '#777', marginTop: 4 },
  infoContainer: {
    marginTop: 30,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  infoText: { fontSize: 16, marginLeft: 10, color: '#444' },
  buttonContainer: { marginTop: 40 },
  editButton: {
    backgroundColor: '#2E8B57',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  editButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  logoutButton: {
    backgroundColor: '#E53935',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    width: '85%',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-around' },
  modalButton: { flex: 1, marginHorizontal: 5, padding: 10, borderRadius: 8 },
  modalButtonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
});
