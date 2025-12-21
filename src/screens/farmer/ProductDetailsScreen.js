import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useCart } from '../../contexts/CartContext';

export default function ProductDetailsScreen({ route, navigation }) {
  const { product } = route.params;
  const { addToCart } = useCart();

  return (
    <View style={styles.container}>
      <ScrollView>
        <Image source={{ uri: product.image }} style={styles.image} />
        <View style={styles.content}>
          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.price}>Rs. {product.price}</Text>
          <Text style={styles.description}>{product.description}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cartButton} onPress={() => addToCart(product)}>
          <Text style={styles.btnText}>Full Payment (Add to Cart)</Text>
        </TouchableOpacity>

        {product.category === 'Machine' && (
          <TouchableOpacity 
            style={[styles.cartButton, {backgroundColor: '#FFA726', marginTop: 10}]} 
            onPress={() => navigation.navigate('LeaseTerms', { product })}
          >
            <Text style={styles.btnText}>Get on Lease (Installments)</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  image: { width: '100%', height: 300 },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold' },
  price: { fontSize: 20, color: '#2E8B57', marginVertical: 10 },
  description: { color: '#666', lineHeight: 22 },
  footer: { padding: 20, borderTopWidth: 1, borderColor: '#eee' },
  cartButton: { backgroundColor: '#2E8B57', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});