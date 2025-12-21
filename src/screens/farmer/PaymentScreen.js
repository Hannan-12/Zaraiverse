// src/screens/farmer/PaymentScreen.js
import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { db } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { AuthContext } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

export default function PaymentScreen({ navigation }) {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const DELIVERY_FEE = 150;
  const totalAmount = getCartTotal() + DELIVERY_FEE;

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;
    
    // Check if the first item has a sellerId (to prevent ghost orders)
    const sellerId = cartItems[0]?.sellerId;
    if (!sellerId) {
      Alert.alert("Error", "One or more products in your cart are missing seller information. Please remove and re-add them.");
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        userId: user.uid,
        userName: user.name || user.displayName || 'Farmer',
        sellerId: sellerId, // ✅ CRITICAL: This allows the seller to see the order
        items: cartItems,
        totalAmount: totalAmount,
        status: 'Pending',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'orders'), orderData);
      
      clearCart();
      Alert.alert("Success! 🎉", "Order placed. You can track it in 'My Orders'.", [
        { text: "OK", onPress: () => navigation.navigate('Orders') }
      ]);
    } catch (error) {
      Alert.alert("Error", "Could not place order. Check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.header}>Order Summary</Text>
        <View style={styles.summaryCard}>
          <View style={styles.row}><Text>Items Total</Text><Text>Rs. {getCartTotal()}</Text></View>
          <View style={styles.row}><Text>Delivery</Text><Text>Rs. {DELIVERY_FEE}</Text></View>
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalText}>Total Amount</Text>
            <Text style={styles.totalText}>Rs. {totalAmount}</Text>
          </View>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.btn} onPress={handlePlaceOrder} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Confirm Order</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scroll: { padding: 20 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  summaryCard: { backgroundColor: '#fff', padding: 20, borderRadius: 15, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  totalRow: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10, marginTop: 10 },
  totalText: { fontWeight: 'bold', fontSize: 18, color: '#2E8B57' },
  footer: { padding: 20, backgroundColor: '#fff' },
  btn: { backgroundColor: '#2E8B57', padding: 18, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});