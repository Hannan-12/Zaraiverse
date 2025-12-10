import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../contexts/CartContext';

export default function CartScreen({ navigation }) {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal } = useCart();

  // --- CHANGED: Navigation instead of immediate checkout ---
  const goToPayment = () => {
    if (cartItems.length === 0) return;
    navigation.navigate('Payment'); // Navigate to the Payment Screen
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle}>{item.name}</Text>
        <Text style={styles.itemPrice}>Rs. {item.price}</Text>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity onPress={() => updateQuantity(item.id, 'decrease')} style={styles.qtyBtn}>
          <Ionicons name="remove" size={16} color="#333" />
        </TouchableOpacity>
        <Text style={styles.qtyText}>{item.quantity}</Text>
        <TouchableOpacity onPress={() => updateQuantity(item.id, 'increase')} style={styles.qtyBtn}>
          <Ionicons name="add" size={16} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => removeFromCart(item.id)} style={[styles.qtyBtn, styles.deleteBtn]}>
          <Ionicons name="trash-outline" size={18} color="#C62828" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={cartItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>Your cart is empty.</Text>
          </View>
        }
      />
      
      {cartItems.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalAmount}>Rs. {getCartTotal()}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.checkoutBtn} 
            onPress={goToPayment}
          >
            <Text style={styles.checkoutText}>Proceed to Payment</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" style={{marginLeft: 10}}/>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FFF9' },
  list: { padding: 16 },
  itemCard: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, padding: 15,
    marginBottom: 10, alignItems: 'center', justifyContent: 'space-between', elevation: 2,
  },
  itemTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  itemPrice: { color: '#2E8B57', fontWeight: '600', marginTop: 4 },
  controls: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: { padding: 8, backgroundColor: '#f0f0f0', borderRadius: 5, marginHorizontal: 5 },
  qtyText: { fontSize: 16, fontWeight: 'bold', marginHorizontal: 5 },
  deleteBtn: { backgroundColor: '#FFEBEE', marginLeft: 15 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#888', fontSize: 16, marginTop: 10 },
  footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  totalLabel: { fontSize: 18, color: '#333' },
  totalAmount: { fontSize: 20, fontWeight: 'bold', color: '#2E8B57' },
  checkoutBtn: {
    backgroundColor: '#2E8B57', paddingVertical: 15, borderRadius: 10,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center'
  },
  checkoutText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});