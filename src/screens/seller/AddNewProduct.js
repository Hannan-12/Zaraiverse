import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { db, auth } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function AddNewProduct({ navigation }) {
  const [product, setProduct] = useState({
    name: '',
    price: '',
    description: '',
    category: 'Seed', // Default category
  });
  const [imageUri, setImageUri] = useState(null);
  const [base64Image, setBase64Image] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2,
      base64: true,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setBase64Image(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleSubmit = async () => {
    if (!product.name || !product.price || !base64Image) {
      Alert.alert('Error', 'Please fill all fields and add an image.');
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
      Alert.alert('Success', 'Product listed!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to add product.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Add New Product</Text>
      
      <View style={styles.formCard}>
        <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
          {imageUri ? <Image source={{ uri: imageUri }} style={styles.preview} /> : <Text>Pick Image</Text>}
        </TouchableOpacity>

        <TextInput 
          style={styles.input} 
          placeholder="Product Name" 
          onChangeText={(val) => setProduct({...product, name: val})} 
        />
        
        <TextInput 
          style={styles.input} 
          placeholder="Price (Rs)" 
          keyboardType="numeric" 
          onChangeText={(val) => setProduct({...product, price: val})} 
        />

        {/* Category Selection */}
        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryRow}>
          {['Seed', 'Machine'].map((cat) => (
            <TouchableOpacity 
              key={cat} 
              style={[styles.catBtn, product.category === cat && styles.activeCat]}
              onPress={() => setProduct({...product, category: cat})}
            >
              <Text style={{color: product.category === cat ? '#fff' : '#333'}}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput 
          style={[styles.input, {height: 80}]} 
          placeholder="Description" 
          multiline 
          onChangeText={(val) => setProduct({...product, description: val})} 
        />

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>List Product</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#F8FAF9' },
  header: { fontSize: 24, fontWeight: 'bold', color: '#2E8B57', textAlign: 'center', marginBottom: 20 },
  formCard: { backgroundColor: '#fff', borderRadius: 15, padding: 20, elevation: 4 },
  imagePicker: { height: 150, backgroundColor: '#f0f0f0', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  preview: { width: '100%', height: '100%', borderRadius: 10 },
  input: { borderBottomWidth: 1, borderBottomColor: '#eee', padding: 10, marginBottom: 15 },
  label: { fontWeight: 'bold', marginBottom: 10 },
  categoryRow: { flexDirection: 'row', marginBottom: 20 },
  catBtn: { flex: 1, padding: 10, alignItems: 'center', backgroundColor: '#f0f0f0', marginHorizontal: 5, borderRadius: 5 },
  activeCat: { backgroundColor: '#2E8B57' },
  submitBtn: { backgroundColor: '#2E8B57', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});