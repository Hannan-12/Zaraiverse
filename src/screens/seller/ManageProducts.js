import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
// --- ✅ MODIFIED: Firebase Imports ---
import { db } from '../../services/firebase';
import {
  collection,
  query,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'products'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const productsData = [];
        querySnapshot.forEach((doc) => {
          productsData.push({ ...doc.data(), id: doc.id });
        });
        setProducts(productsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching products: ', error);
        setLoading(false);
        Alert.alert('Error', 'Could not fetch products.');
      }
    );

    // Unsubscribe from the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  const handleDelete = async (productId) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to permanently delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'products', productId));
            } catch (error) {
              console.error('Error deleting product: ', error);
              Alert.alert('Error', 'Could not delete product.');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleToggleStock = async (productId, currentStatus) => {
    const newStatus = currentStatus === 'In Stock' ? 'Out of Stock' : 'In Stock';
    try {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        stockStatus: newStatus,
      });
    } catch (error) {
      console.error('Error updating stock status: ', error);
      Alert.alert('Error', 'Could not update stock status.');
    }
  };

  const renderProduct = ({ item }) => {
    const isInStock = item.stockStatus === 'In Stock';
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.productName}>{item.name}</Text>
          <TouchableOpacity onPress={() => handleDelete(item.id)}>
            <MaterialCommunityIcons
              name="delete-outline"
              size={22}
              color="#C62828"
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.price}>💰 Rs. {item.price}</Text>

        <View style={styles.footer}>
          <View style={styles.statusContainer}>
            <MaterialCommunityIcons
              name={isInStock ? 'check-circle-outline' : 'alert-circle-outline'}
              size={18}
              color={isInStock ? '#388E3C' : '#E53935'}
            />
            <Text
              style={[
                styles.stockStatus,
                { color: isInStock ? '#388E3C' : '#E53935' },
              ]}
            >
              {item.stockStatus}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              { backgroundColor: isInStock ? '#E53935' : '#388E3C' },
            ]}
            onPress={() => handleToggleStock(item.id, item.stockStatus)}
          >
            <Text style={styles.toggleButtonText}>
              {isInStock ? 'Mark Out of Stock' : 'Mark In Stock'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2E8B57" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No products found.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAF9',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  category: {
    color: '#777',
    fontSize: 14,
    marginVertical: 6,
  },
  price: {
    fontSize: 15,
    color: '#2E7D32',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockStatus: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  toggleButton: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  toggleButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    color: '#777',
    marginTop: 40,
    fontSize: 16,
  },
});

