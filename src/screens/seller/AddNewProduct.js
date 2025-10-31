import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image, // <-- Import Image component
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker'; // <-- Import Image Picker
import { db, auth, storage } from '../../services/firebase'; // <-- Import storage
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // <-- Import storage functions

export default function AddNewProduct({ navigation }) {
  const [product, setProduct] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
  });
  const [imageUri, setImageUri] = useState(null); // <-- State to hold the selected image URI
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setProduct({ ...product, [field]: value });
  };

  // --- NEW: Function to pick an image ---
  const handlePickImage = async () => {
    // Request permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You need to allow access to your photos to upload an image.");
      return;
    }

    // Launch image picker
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Square aspect ratio
      quality: 0.7, // Compress image
    });

    if (!pickerResult.canceled) {
      setImageUri(pickerResult.assets[0].uri);
    }
  };

  // --- NEW: Function to upload the image to Firebase Storage ---
  const uploadImage = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Create a unique file name
      const fileName = `product_${Date.now()}`;
      const storageRef = ref(storage, `product_images/${fileName}`);

      // Upload the file
      await uploadBytes(storageRef, blob);

      // Get the download URL
      return await getDownloadURL(storageRef);

    } catch (error) {
      console.error("Error uploading image: ", error);
      throw new Error("Image upload failed");
    }
  };


  const handleSubmit = async () => {
    if (!product.name || !product.price || !product.description) {
      Alert.alert('Missing Fields', 'Please fill all required fields.');
      return;
    }

    // --- NEW: Check if an image is selected ---
    if (!imageUri) {
      Alert.alert('Missing Image', 'Please pick an image for the product.');
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert('Not Authenticated', 'You must be logged in to add a product.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Upload the image first
      const downloadURL = await uploadImage(imageUri);

      // 2. Prepare product data with the new image URL
      const newProductData = {
        name: product.name,
        category: product.category,
        price: parseFloat(product.price) || 0,
        description: product.description,
        stockStatus: 'In Stock',
        image: downloadURL, // <-- Use the URL from storage
        sellerId: currentUser.uid,
      };

      // 3. Add the product document to Firestore
      await addDoc(collection(db, 'products'), newProductData);

      Alert.alert(
        '✅ Product Added',
        `${product.name} has been saved to the database!`
      );

      navigation.goBack();
    } catch (error) {
      console.error('Error adding product: ', error);
      Alert.alert('Error', 'Could not add product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>🛍️ Add New Product</Text>
      <Text style={styles.subtitle}>Fill in the details below to add a product</Text>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <MaterialIcons name="shopping-bag" size={24} color="#2E8B57" />
          <TextInput
            style={styles.input}
            placeholder="Product Name"
            placeholderTextColor="#999"
            value={product.name}
            onChangeText={(text) => handleInputChange('name', text)}
          />
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="attach-money" size={24} color="#2E8B57" />
          <TextInput
            style={styles.input}
            placeholder="Price"
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={product.price}
            onChangeText={(text) => handleInputChange('price', text)}
          />
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="category" size={24} color="#2E8B57" />
          <TextInput
            style={styles.input}
            placeholder="Category"
            placeholderTextColor="#999"
            value={product.category}
            onChangeText={(text) => handleInputChange('category', text)}
          />
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="description" size={24} color="#2E8B57" />
          <TextInput
            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
            placeholder="Description"
            placeholderTextColor="#999"
            multiline
            value={product.description}
            onChangeText={(text) => handleInputChange('description', text)}
          />
        </View>

        {/* --- MODIFIED: Image URL input replaced with Image Picker --- */}
        <TouchableOpacity style={styles.imagePickerButton} onPress={handlePickImage}>
          <MaterialIcons name="image" size={24} color="#fff" />
          <Text style={styles.imagePickerButtonText}>Pick Product Image</Text>
        </TouchableOpacity>

        {/* --- NEW: Show image preview if selected --- */}
        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Add Product</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F8FAF9',
    flexGrow: 1,
  },
  header: {
    fontSize: 26,
    fontWeight: '700',
    color: '#2E8B57',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomColor: '#E0EE0',
    borderBottomWidth: 1,
    marginBottom: 15,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
    paddingVertical: 12,
  },
  // --- NEW: Styles for image picker ---
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  imagePickerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#f0f0f0',
  },
  // ---
  button: {
    backgroundColor: '#2E8B57',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});