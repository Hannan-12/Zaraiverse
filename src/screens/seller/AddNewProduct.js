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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
// --- ✅ MODIFIED: Import 'auth' from your firebase config ---
import { db, auth } from '../../services/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function AddNewProduct({ navigation }) {
  const [product, setProduct] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    image: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setProduct({ ...product, [field]: value });
  };

  const handleSubmit = async () => {
    if (!product.name || !product.price || !product.description) {
      Alert.alert('Missing Fields', 'Please fill all required fields.');
      return;
    }

    // --- ✅ ADDED: Get the current user's ID ---
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert('Not Authenticated', 'You must be logged in to add a product.');
      return;
    }

    setIsLoading(true);

    try {
      const newProductData = {
        name: product.name,
        category: product.category,
        price: parseFloat(product.price) || 0,
        description: product.description,
        stockStatus: 'In Stock',
        image:
          product.image ||
          `https://placehold.co/400x400/2E8B57/FFFFFF?text=${product.name.charAt(
            0
          )}`,
        // --- ✅ ADDED: Include the seller's ID in the document ---
        // This is required to pass the new security rules.
        sellerId: currentUser.uid,
      };

      await addDoc(collection(db, 'products'), newProductData);

      Alert.alert(
        '✅ Product Added',
        `${product.name} has been saved to the database!`
      );

      navigation.goBack();
    } catch (error) {
      console.error('Error adding product to Firestore: ', error);
      Alert.alert('Error', 'Could not add product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // The rest of your component (return statement and styles) remains the same.
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
            value={product.name}
            onChangeText={(text) => handleInputChange('name', text)}
          />
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="attach-money" size={24} color="#2E8B57" />
          <TextInput
            style={styles.input}
            placeholder="Price"
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
            value={product.category}
            onChangeText={(text) => handleInputChange('category', text)}
          />
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="description" size={24} color="#2E8B57" />
          <TextInput
            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
            placeholder="Description"
            multiline
            value={product.description}
            onChangeText={(text) => handleInputChange('description', text)}
          />
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="image" size={24} color="#2E8B57" />
          <TextInput
            style={styles.input}
            placeholder="Image URL"
            value={product.image}
            onChangeText={(text) => handleInputChange('image', text)}
          />
        </View>

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

