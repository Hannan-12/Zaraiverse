import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, Image,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { db, auth } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import axios from 'axios';

// Gemini API key (same as chatbot)
const GEMINI_API_KEY = 'AIzaSyAijKvAx1ylHNu_XadcGPWz7A0NJ_tCFfs';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// Validation keywords that must appear in the image for each category
const CATEGORY_VALIDATION = {
  Pesticide: 'a pesticide bottle, chemical spray can, agrochemical product, insecticide, herbicide, or fungicide container',
  Seed: 'seeds, grain, seed packets, seedlings, or agricultural seeds',
  Machine: 'agricultural machinery, farming equipment, tractor, harvester, sprayer, or farm tool',
};

const CATEGORIES = ['Seed', 'Machine', 'Pesticide'];

export default function AddNewProduct({ navigation }) {
  const [product, setProduct] = useState({
    name: '',
    price: '',
    description: '',
    category: 'Seed',
  });
  const [imageUri, setImageUri] = useState(null);
  const [base64Image, setBase64Image] = useState(null);
  const [rawBase64, setRawBase64] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [imageValid, setImageValid] = useState(null); // null | true | false

  // Validate image using Gemini Vision
  const validateImageWithAI = async (base64, category) => {
    setValidating(true);
    setImageValid(null);
    try {
      const expectedContent = CATEGORY_VALIDATION[category] || category;
      const prompt = `You are an image validator for an agricultural marketplace app.
Look at this image carefully and determine if it shows ${expectedContent}.

Answer with ONLY one of:
- "VALID" if the image clearly shows the expected product type
- "INVALID" if the image does NOT match (e.g. it shows a person, random object, landscape, or unrelated item)

Your answer (VALID or INVALID):`;

      const payload = {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: base64,
                },
              },
            ],
          },
        ],
        generationConfig: { temperature: 0, maxOutputTokens: 10 },
      };

      // Discover model name (use flash for speed)
      const res = await axios.post(
        `${GEMINI_BASE}/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
        payload,
        { headers: { 'Content-Type': 'application/json' }, timeout: 20000 }
      );

      const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log('Gemini response text:', text);
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

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2,
      base64: true,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setRawBase64(asset.base64);
      setBase64Image(`data:image/jpeg;base64,${asset.base64}`);
      setImageValid(null);
      // Auto-validate image against selected category
      await validateImageWithAI(asset.base64, product.category);
    }
  };

  const handleCategoryChange = async (cat) => {
    setProduct({ ...product, category: cat });
    setImageValid(null);
    // Re-validate existing image if one is already selected
    if (rawBase64) {
      await validateImageWithAI(rawBase64, cat);
    }
  };

  const handleSubmit = async () => {
    if (!product.name || !product.price || !base64Image) {
      Alert.alert('Error', 'Please fill all fields and add an image.');
      return;
    }

    if (imageValid === false) {
      Alert.alert(
        'Invalid Image',
        `The image does not appear to be a valid ${product.category} image. Please upload an image that clearly shows your ${product.category.toLowerCase()} product.`
      );
      return;
    }

    setIsLoading(true);
    try {
      await addDoc(collection(db, 'products'), {
        ...product,
        price: parseFloat(product.price),
        image: base64Image,
        sellerId: auth.currentUser.uid,
        stockStatus: 'In Stock',
        createdAt: serverTimestamp(),
      });
      Alert.alert('Success', 'Product listed successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to add product.');
    } finally {
      setIsLoading(false);
    }
  };

  const getValidationBadge = () => {
    if (validating) {
      return (
        <View style={styles.validationBadge}>
          <ActivityIndicator size="small" color="#2E8B57" />
          <Text style={styles.validatingText}>Validating image...</Text>
        </View>
      );
    }
    if (imageValid === true) {
      return (
        <View style={[styles.validationBadge, { backgroundColor: '#E8F5E9' }]}>
          <Ionicons name="checkmark-circle" size={18} color="#2E8B57" />
          <Text style={[styles.validatingText, { color: '#2E8B57' }]}>Image looks good!</Text>
        </View>
      );
    }
    if (imageValid === false) {
      return (
        <View style={[styles.validationBadge, { backgroundColor: '#FFEBEE' }]}>
          <Ionicons name="close-circle" size={18} color="#E53935" />
          <Text style={[styles.validatingText, { color: '#E53935' }]}>
            Image does not match category. Please upload a {product.category.toLowerCase()} image.
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Add New Product</Text>

      <View style={styles.formCard}>
        {/* Image Picker */}
        <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.preview} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialIcons name="add-photo-alternate" size={40} color="#aaa" />
              <Text style={styles.imageHint}>Tap to pick image</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Validation Badge */}
        {imageUri && getValidationBadge()}

        {/* Product Name */}
        <TextInput
          style={styles.input}
          placeholder="Product Name"
          onChangeText={(val) => setProduct({ ...product, name: val })}
        />

        {/* Price */}
        <TextInput
          style={styles.input}
          placeholder="Price (Rs)"
          keyboardType="numeric"
          onChangeText={(val) => setProduct({ ...product, price: val })}
        />

        {/* Category Selection */}
        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catBtn, product.category === cat && styles.activeCat]}
              onPress={() => handleCategoryChange(cat)}
            >
              <Text style={{ color: product.category === cat ? '#fff' : '#333', fontSize: 13 }}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Description */}
        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="Description"
          multiline
          onChangeText={(val) => setProduct({ ...product, description: val })}
        />

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, (isLoading || validating) && { backgroundColor: '#aaa' }]}
          onPress={handleSubmit}
          disabled={isLoading || validating}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>List Product</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#F8FAF9' },
  header: { fontSize: 24, fontWeight: 'bold', color: '#2E8B57', textAlign: 'center', marginBottom: 20 },
  formCard: { backgroundColor: '#fff', borderRadius: 15, padding: 20, elevation: 4 },
  imagePicker: { height: 160, backgroundColor: '#f0f0f0', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12, overflow: 'hidden' },
  imagePlaceholder: { alignItems: 'center' },
  imageHint: { color: '#aaa', marginTop: 6, fontSize: 13 },
  preview: { width: '100%', height: '100%' },
  validationBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F5F5F5', borderRadius: 8, padding: 10, marginBottom: 14,
  },
  validatingText: { fontSize: 13, color: '#555', flex: 1 },
  input: { borderBottomWidth: 1, borderBottomColor: '#eee', padding: 10, marginBottom: 15 },
  label: { fontWeight: 'bold', marginBottom: 10, color: '#333' },
  categoryRow: { flexDirection: 'row', marginBottom: 20, gap: 8 },
  catBtn: { flex: 1, padding: 10, alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 5 },
  activeCat: { backgroundColor: '#2E8B57' },
  submitBtn: { backgroundColor: '#2E8B57', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
