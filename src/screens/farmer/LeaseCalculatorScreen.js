// src/screens/farmer/LeaseCalculatorScreen.js
import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { db } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { AuthContext } from '../../contexts/AuthContext';

export default function LeaseCalculatorScreen({ route, navigation }) {
  const { product } = route.params;
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [months, setMonths] = useState(6);

  const INTEREST_RATE = 0.12; 
  const downpayment = product.price * 0.20;
  const remainingPrincipal = product.price - downpayment;
  const totalWithInterest = remainingPrincipal + (remainingPrincipal * INTEREST_RATE);
  const monthlyInstallment = totalWithInterest / months;

  const handleSendRequest = async () => {
    if (!user) {
        Alert.alert("Error", "You must be logged in to submit a request.");
        return;
    }

    setLoading(true);
    try {
      // ✅ Matches field names in OrdersScreen and SellerOrders
      await addDoc(collection(db, 'orders'), {
        userId: user.uid,           // Matches OrdersScreen query
        userName: user.displayName || 'Farmer', // Matches SellerOrders display
        sellerId: product.sellerId, // Matches SellerOrders query
        productName: product.name,
        productId: product.id,
        orderType: 'Lease',        // CRITICAL: Tells app this is a lease
        status: 'Pending',         // Matches SellerOrders button check
        totalAmount: totalWithInterest.toFixed(0),
        paidInstallments: 0,
        createdAt: serverTimestamp(),
        leaseDetails: {
          duration: months,
          downpayment: downpayment.toFixed(0),
          monthlyInstallment: monthlyInstallment.toFixed(0),
          totalLeaseBalance: totalWithInterest.toFixed(0),
          interestRate: '12%'
        }
      });

      Alert.alert("Success", "Request sent! Check your 'Orders' tab for updates.");
      navigation.navigate('Orders');
    } catch (error) {
      Alert.alert("Error", "Could not send request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Lease Plan: {product.name}</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Product Price:</Text>
          <Text style={styles.val}>Rs. {product.price}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Downpayment (20%):</Text>
          <Text style={[styles.val, {color: '#E53935'}]}>Rs. {downpayment}</Text>
        </View>
        <View style={styles.divider} />
        <Text style={styles.sectionLabel}>Select Duration:</Text>
        <View style={styles.monthRow}>
          {[6, 12, 18].map(m => (
            <TouchableOpacity key={m} style={[styles.monthBtn, months === m && styles.activeBtn]} onPress={() => setMonths(m)}>
              <Text style={{color: months === m ? '#fff' : '#333'}}>{m} Months</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.resultBox}>
          <Text style={styles.resultLabel}>Monthly Installment</Text>
          <Text style={styles.resultPrice}>Rs. {monthlyInstallment.toFixed(0)}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.confirmBtn} onPress={handleSendRequest} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>Submit Lease Request</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF9', padding: 20 },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#2E8B57' },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 15, elevation: 3 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  label: { fontSize: 14, color: '#666' },
  val: { fontSize: 15, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
  sectionLabel: { fontWeight: 'bold', marginBottom: 10, color: '#333' },
  monthRow: { flexDirection: 'row', justifyContent: 'space-between' },
  monthBtn: { padding: 12, backgroundColor: '#f0f0f0', borderRadius: 10, width: '30%', alignItems: 'center' },
  activeBtn: { backgroundColor: '#2E8B57' },
  resultBox: { marginTop: 30, backgroundColor: '#E8F5E9', padding: 20, borderRadius: 10, alignItems: 'center' },
  resultLabel: { color: '#2E8B57', fontWeight: 'bold' },
  resultPrice: { fontSize: 28, fontWeight: 'bold', color: '#1B5E20' },
  confirmBtn: { backgroundColor: '#2E8B57', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 'auto' },
  confirmText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});