import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ScrollView, Alert, ActivityIndicator, Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { db, auth } from '../../services/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function AddNewProduct({ navigation }) {
  const [product, setProduct] = useState({ name: '', price: '', description: '', category: '' });
  const [imageUri, setImageUri] = useState(null);
  const [base64Image, setBase64Image] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2, // Low quality to stay under Firestore 1MB limit
      base64: true,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setBase64Image(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleSubmit = async () => {
    if (!product.name || !product.price || !base64Image) {
      Alert.alert('Missing Info', 'Please fill all fields and pick an image.');
      return;
    }

    setIsLoading(true);
    try {
      await addDoc(collection(db, 'products'), {
        ...product,
        price: parseFloat(product.price) || 0,
        image: base64Image, // Saves the actual image data
        sellerId: auth.currentUser.uid,
        stockStatus: 'In Stock',
        createdAt: new Date(),
      });
      Alert.alert('Success', 'Product listed successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Permission denied or connection issue.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>🛍️ Add New Product</Text>
      <View style={styles.formCard}>
        <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
          {imageUri ? <Image source={{ uri: imageUri }} style={styles.preview} /> : (
            <View style={styles.placeholder}>
              <MaterialIcons name="add-a-photo" size={40} color="#2E8B57" />
              <Text style={styles.placeholderText}>Tap to add image</Text>
            </View>
          )}
        </TouchableOpacity>

        <TextInput style={styles.input} placeholder="Product Name" onChangeText={(t) => setProduct({...product, name: t})} />
        <TextInput style={styles.input} placeholder="Price (Rs.)" keyboardType="numeric" onChangeText={(t) => setProduct({...product, price: t})} />
        <TextInput style={styles.input} placeholder="Category" onChangeText={(t) => setProduct({...product, category: t})} />
        <TextInput style={[styles.input, styles.textArea]} placeholder="Description" multiline onChangeText={(t) => setProduct({...product, description: t})} />

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>List Product</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#F8FAF9', flexGrow: 1 },
  header: { fontSize: 26, fontWeight: '800', color: '#2E8B57', textAlign: 'center', marginBottom: 20 },
  formCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 4 },
  imagePicker: { height: 180, backgroundColor: '#f0f0f0', borderRadius: 15, marginBottom: 20, overflow: 'hidden' },
  preview: { width: '100%', height: '100%' },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#2E8B57', marginTop: 5, fontWeight: '600' },
  input: { borderBottomWidth: 1, borderBottomColor: '#eee', padding: 12, fontSize: 16, marginBottom: 15 },
  textArea: { height: 80, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#2E8B57', padding: 16, borderRadius: 15, marginTop: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});