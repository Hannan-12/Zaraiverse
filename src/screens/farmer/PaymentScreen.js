import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCart } from '../../contexts/CartContext';
import { AuthContext } from '../../contexts/AuthContext';
import { db } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function PaymentScreen({ navigation }) {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useContext(AuthContext);
  const [selectedMethod, setSelectedMethod] = useState('cod');
  const [loading, setLoading] = useState(false);

  const DELIVERY_FEE = 150;
  const totalAmount = getCartTotal() + DELIVERY_FEE;

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;
    
    setLoading(true);

    try {
      // 1. Prepare Order Data
      const orderData = {
        userId: user.uid,
        userName: user.displayName || user.email,
        items: cartItems,
        subtotal: getCartTotal(),
        deliveryFee: DELIVERY_FEE,
        totalAmount: totalAmount,
        paymentMethod: selectedMethod === 'cod' ? 'Cash on Delivery' : selectedMethod,
        status: 'Pending',
        createdAt: serverTimestamp(),
      };

      // 2. Save to Firestore
      await addDoc(collection(db, 'orders'), orderData);
      
      // 3. Cleanup & Navigation
      clearCart();
      
      Alert.alert(
        "Order Confirmed! 🎉",
        "Your order has been placed successfully.",
        [{ text: "Track Order", onPress: () => navigation.navigate('Orders') }]
      );

    } catch (error) {
      console.error("Order Error:", error);
      Alert.alert('Error', 'Could not place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const PaymentOption = ({ id, title, icon, subtitle }) => (
    <TouchableOpacity 
      style={[styles.optionCard, selectedMethod === id && styles.selectedCard]}
      onPress={() => setSelectedMethod(id)}
    >
      <View style={styles.row}>
        <MaterialCommunityIcons 
          name={icon} 
          size={28} 
          color={selectedMethod === id ? '#2E8B57' : '#666'} 
        />
        <View style={styles.textContainer}>
          <Text style={[styles.optionTitle, selectedMethod === id && styles.selectedText]}>{title}</Text>
          <Text style={styles.optionSubtitle}>{subtitle}</Text>
        </View>
        <Ionicons 
          name={selectedMethod === id ? "radio-button-on" : "radio-button-off"} 
          size={24} 
          color={selectedMethod === id ? '#2E8B57' : '#ccc'} 
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.header}>Select Payment Method</Text>
        
        <PaymentOption 
          id="cod" 
          title="Cash on Delivery" 
          subtitle="Pay when you receive the order"
          icon="cash-multiple" 
        />
        
        <PaymentOption 
          id="card" 
          title="Credit / Debit Card" 
          subtitle="Visa, Mastercard"
          icon="credit-card-outline" 
        />
        
        <PaymentOption 
          id="wallet" 
          title="Mobile Wallet" 
          subtitle="JazzCash, Easypaisa"
          icon="cellphone-check" 
        />

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Subtotal</Text>
            <Text style={styles.summaryText}>Rs. {getCartTotal()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Delivery Fee</Text>
            <Text style={styles.summaryText}>Rs. {DELIVERY_FEE}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalText}>Total</Text>
            <Text style={styles.totalText}>Rs. {totalAmount}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.payButton} 
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>
              {selectedMethod === 'cod' ? `Place Order • Rs. ${totalAmount}` : `Pay Now • Rs. ${totalAmount}`}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scroll: { padding: 20 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  optionCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#eee', elevation: 1,
  },
  selectedCard: { borderColor: '#2E8B57', backgroundColor: '#F1F8E9' },
  row: { flexDirection: 'row', alignItems: 'center' },
  textContainer: { flex: 1, marginLeft: 15 },
  optionTitle: { fontSize: 16, fontWeight: 'bold', color: '#444' },
  selectedText: { color: '#2E8B57' },
  optionSubtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  
  summary: { marginTop: 30, padding: 20, backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  summaryTitle: { fontWeight: 'bold', marginBottom: 15, fontSize: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryText: { color: '#666', fontSize: 15 },
  totalRow: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10, marginTop: 5 },
  totalText: { fontWeight: 'bold', fontSize: 18, color: '#2E8B57' },

  footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  payButton: { backgroundColor: '#2E8B57', padding: 16, borderRadius: 12, alignItems: 'center' },
  payButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});