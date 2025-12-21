import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { db } from '../../services/firebase';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { format, addMonths } from 'date-fns';

export default function LeasePaymentScreen({ route }) {
  const { order: initialOrder } = route.params;
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(false);

  // Helper function to safely handle the date regardless of format
  const getOrderDate = (dateField) => {
    if (!dateField) return new Date();
    // If it's already a JS Date object (passed from OrdersScreen)
    if (dateField instanceof Date) return dateField;
    // If it's a Firestore Timestamp from the real-time listener
    if (typeof dateField.toDate === 'function') return dateField.toDate();
    // Fallback for string or other formats
    return new Date(dateField);
  };

  // Real-time listener for the specific order to reflect early payments
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'orders', order.id), (docSnap) => {
      if (docSnap.exists()) {
        setOrder({ id: docSnap.id, ...docSnap.data() });
      }
    });
    return () => unsub();
  }, []);

  const paidCount = order.paidInstallments || 0;
  const duration = parseInt(order.leaseDetails?.duration) || 6;
  
  // ✅ Use the helper function to avoid .toDate() crash
  const baseDate = getOrderDate(order.createdAt);
  const dueDates = Array.from({ length: duration }, (_, i) => addMonths(baseDate, i + 1));

  const handleInstallmentPayment = async (isEarly = false) => {
    if (paidCount >= duration) {
      Alert.alert("Complete!", "All installments for this machine are paid.");
      return;
    }

    setLoading(true);
    try {
      const newPaidCount = paidCount + 1;
      const updateData = { paidInstallments: newPaidCount };
      
      // If last installment, mark order as fully delivered
      if (newPaidCount === duration) {
        updateData.status = 'Delivered';
      }

      await updateDoc(doc(db, 'orders', order.id), updateData);
      Alert.alert("Payment Success! ✅", isEarly ? "Early installment received." : "Installment paid.");
    } catch (e) {
      Alert.alert("Error", "Payment failed. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.header}>{order.productName}</Text>
        
        <View style={styles.statCard}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Paid</Text>
            <Text style={styles.statVal}>{paidCount}/{duration}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Monthly</Text>
            <Text style={styles.statVal}>Rs. {order.leaseDetails?.monthlyInstallment}</Text>
          </View>
        </View>

        {paidCount < duration && (
          <TouchableOpacity 
            style={styles.earlyBtn} 
            onPress={() => handleInstallmentPayment(true)} 
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.earlyBtnText}>Pay Next Installment Early</Text>}
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>Payment Schedule</Text>
        {dueDates.map((date, index) => (
          <View key={index} style={[styles.dateRow, index < paidCount && styles.paidRow]}>
            <View style={[styles.circle, index < paidCount && styles.paidCircle]}>
               <Text style={[styles.indexText, index < paidCount && {color: '#fff'}]}>{index + 1}</Text>
            </View>
            <View style={styles.dateInfo}>
              <Text style={styles.dueDate}>{format(date, 'MMM dd, yyyy')}</Text>
              <Text style={styles.dueAmount}>Installment #{index + 1}</Text>
            </View>
            <Text style={index < paidCount ? styles.statusPaid : styles.statusPending}>
              {index < paidCount ? 'PAID' : 'PENDING'}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF9' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  statCard: { backgroundColor: '#2E8B57', flexDirection: 'row', padding: 20, borderRadius: 15, marginBottom: 20, elevation: 5 },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: { color: '#E8F5E9', fontSize: 12 },
  statVal: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 5 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  earlyBtn: { backgroundColor: '#FFA726', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 25, elevation: 3 },
  earlyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#444' },
  dateRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 2 },
  paidRow: { opacity: 0.7, backgroundColor: '#F1F8E9' },
  circle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  paidCircle: { backgroundColor: '#2E8B57' },
  indexText: { fontWeight: 'bold', fontSize: 13 },
  dateInfo: { flex: 1, marginLeft: 15 },
  dueDate: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  dueAmount: { fontSize: 13, color: '#666', marginTop: 2 },
  statusPaid: { color: '#2E8B57', fontWeight: 'bold', fontSize: 12 },
  statusPending: { color: '#FFA726', fontWeight: 'bold', fontSize: 12 }
});