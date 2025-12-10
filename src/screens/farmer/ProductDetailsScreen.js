import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../contexts/CartContext'; // Import hook

export default function ProductDetailsScreen({ route, navigation }) {
  const { product } = route.params;
  const { addToCart } = useCart();

  return (
    <View style={styles.container}>
      <ScrollView>
        <Image 
          source={{ uri: product.image || 'https://placehold.co/400' }} 
          style={styles.image} 
        />
        <View style={styles.content}>
          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.price}>Rs. {product.price}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{product.category}</Text>
          </View>
          
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>
            {product.description || 'No description provided.'}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.cartButton} 
          onPress={() => addToCart(product)}
        >
          <Ionicons name="cart-outline" size={24} color="#fff" />
          <Text style={styles.cartButtonText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  image: { width: '100%', height: 300, backgroundColor: '#f0f0f0' },
  content: { padding: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  price: { fontSize: 22, fontWeight: 'bold', color: '#2E8B57', marginBottom: 10 },
  badge: { 
    alignSelf: 'flex-start', 
    backgroundColor: '#E8F5E9', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 5,
    marginBottom: 20
  },
  badgeText: { color: '#2E8B57', fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  description: { fontSize: 16, lineHeight: 24, color: '#666' },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  cartButton: {
    backgroundColor: '#2E8B57',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 10,
  },
  cartButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
});