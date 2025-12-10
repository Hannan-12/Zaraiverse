// src/screens/farmer/RequestPrescriptionScreen.js
import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { db } from '../../services/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { AuthContext } from '../../contexts/AuthContext';

export default function RequestPrescriptionScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  
  const [cropName, setCropName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState(null); // Display URI
  const [imageBase64, setImageBase64] = useState(null); // Data for Firestore
  const [loading, setLoading] = useState(false);

  // --- Pick Image ---
  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Please allow access to photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.3, // Low quality to fit in Firestore (1MB limit)
      base64: true,
    });

    if (!result.canceled && result.assets) {
      setImageUri(result.assets[0].uri);
      setImageBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  // --- Submit Request ---
  const handleSubmit = async () => {
    if (!cropName || !description) {
      Alert.alert("Missing Details", "Please enter crop name and description.");
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        userId: user.uid,
        userName: user.displayName || user.email, // Show who asked
        cropName,
        description,
        image: imageBase64 || null, // Optional image
        status: 'pending', // Default status
        response: '', // Empty until expert replies
        createdAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'expert_requests'), requestData);

      Alert.alert("Success", "Your request has been sent to an expert!");
      navigation.goBack();
    } catch (error) {
      console.error("Error submitting request:", error);
      Alert.alert("Error", "Could not send request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Ask an Expert</Text>
      <Text style={styles.subHeader}>
        Describe your crop issue and attach a photo for better advice.
      </Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Crop Name</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. Wheat, Rice, Cotton"
          value={cropName}
          onChangeText={setCropName}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Problem Description</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          placeholder="Describe the symptoms (e.g. yellow leaves, pests)..."
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Attachment (Optional)</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="camera-outline" size={32} color="#666" />
              <Text style={styles.placeholderText}>Tap to add photo</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.submitButton} 
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Submit Request</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FFF9' },
  content: { padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#2E7D32', marginBottom: 5 },
  subHeader: { fontSize: 14, color: '#555', marginBottom: 20 },
  
  formGroup: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  textArea: { height: 100 },
  
  imagePicker: {
    height: 150,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: { width: '100%', height: '100%' },
  placeholder: { alignItems: 'center' },
  placeholderText: { color: '#666', marginTop: 5 },

  submitButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    elevation: 3,
  },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});