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
import { LanguageContext } from '../../contexts/LanguageContext';
import axios from 'axios';
import { GROQ_API_KEY, GROQ_BASE } from '../../config/keys';

export default function RequestPrescriptionScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  
  const [cropName, setCropName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState(null); // Display URI
  const [imageBase64, setImageBase64] = useState(null); // Data for Firestore
  const [rawBase64, setRawBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [imageValid, setImageValid] = useState(null); // null | true | false

  // --- Validate image with Groq Vision ---
  const validateImageWithAI = async (base64) => {
    setValidating(true);
    setImageValid(null);
    try {
      const prompt = `You are an image validator for an agricultural advisory app.
Look at this image carefully and determine if it shows a crop, plant, leaf, seed, agricultural field, or a farming-related problem (such as pest damage, disease, yellowing, wilting, or soil issues).

Answer with ONLY one of:
- "VALID" if the image clearly shows a crop, plant, or agricultural issue
- "INVALID" if the image does NOT match (e.g. it shows a person, child, animal, random object, indoor scene, or anything unrelated to farming/plants)

Your answer (VALID or INVALID):`;

      const payload = {
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
            ],
          },
        ],
        temperature: 0,
        max_tokens: 10,
      };

      const res = await axios.post(
        `${GROQ_BASE}/chat/completions`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          timeout: 20000,
        }
      );

      const text = res.data?.choices?.[0]?.message?.content || '';
      console.log('Groq response text:', text);
      const isValid = text.trim().toUpperCase().startsWith('VALID');
      setImageValid(isValid);
      return isValid;
    } catch (e) {
      console.log('Image validation error:', e?.response?.status, JSON.stringify(e?.response?.data));
      setImageValid(null);
      return false;
    } finally {
      setValidating(false);
    }
  };

  // --- Validation badge UI ---
  const getValidationBadge = () => {
    if (validating) {
      return (
        <View style={styles.validationBadge}>
          <ActivityIndicator size="small" color="#2E7D32" />
          <Text style={styles.validatingText}>{t('validatingImage')}</Text>
        </View>
      );
    }
    if (imageValid === true) {
      return (
        <View style={[styles.validationBadge, { backgroundColor: '#E8F5E9' }]}>
          <Ionicons name="checkmark-circle" size={18} color="#2E7D32" />
          <Text style={[styles.validatingText, { color: '#2E7D32' }]}>{t('imageGood')}</Text>
        </View>
      );
    }
    if (imageValid === false) {
      return (
        <View style={[styles.validationBadge, { backgroundColor: '#FFEBEE' }]}>
          <Ionicons name="close-circle" size={18} color="#E53935" />
          <Text style={[styles.validatingText, { color: '#E53935' }]}>
            {t('invalidImageMsg')}
          </Text>
        </View>
      );
    }
    return null;
  };

  // --- Pick Image ---
  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(t('permissionRequired'), t('allowPhotoAccess'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.3, // Low quality to fit in Firestore (1MB limit)
      base64: true,
    });

    if (!result.canceled && result.assets) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setRawBase64(asset.base64);
      setImageBase64(`data:image/jpeg;base64,${asset.base64}`);
      setImageValid(null);
      await validateImageWithAI(asset.base64);
    }
  };

  // --- Submit Request ---
  const handleSubmit = async () => {
    if (!cropName || !description) {
      Alert.alert(t('missingDetails'), t('enterCropDetails'));
      return;
    }

    if (imageValid === false) {
      Alert.alert(t('invalidImage'), t('invalidImageBody'));
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

      Alert.alert(t('success'), t('requestSentSuccess'));
      navigation.goBack();
    } catch (error) {
      console.error("Error submitting request:", error);
      Alert.alert(t('error'), t('couldNotSendRequest'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>{t('askAnExpert')}</Text>
      <Text style={styles.subHeader}>
        {t('prescriptionSubtext')}
      </Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('cropNameLabel')}</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. Wheat, Rice, Cotton"
          value={cropName}
          onChangeText={setCropName}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('problemDescription')}</Text>
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
        <Text style={styles.label}>{t('attachment')}</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="camera-outline" size={32} color="#666" />
              <Text style={styles.placeholderText}>{t('tapToAddPhoto')}</Text>
            </View>
          )}
        </TouchableOpacity>
        {imageUri && getValidationBadge()}
      </View>

      <TouchableOpacity
        style={[styles.submitButton, (loading || validating) && { backgroundColor: '#aaa' }]}
        onPress={handleSubmit}
        disabled={loading || validating}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>{t('submitRequest')}</Text>
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
  validationBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F5F5F5', borderRadius: 8, padding: 10, marginTop: 8,
  },
  validatingText: { fontSize: 13, color: '#555', flex: 1 },

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