import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { db } from '../../services/firebase';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { format, addMonths } from 'date-fns';

export default function LeasePaymentScreen({ route, navigation }) {
  // Use optional chaining and fallback to prevent crash during initialization
  const initialOrder = route?.params?.order;
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(false);

  // Safety Helper: Handles the date regardless of format (Timestamp or JS Date)
  const getSafeDate = (dateField) => {
    if (!dateField) return new Date();
    if (dateField instanceof Date) return dateField;
    if (typeof dateField.toDate === 'function') return dateField.toDate();
    return new Date(dateField);
  };

  useEffect(() => {
    if (!order?.id) return;

    const unsub = onSnapshot(doc(db, 'orders', order.id), (docSnap) => {
      if (docSnap.exists()) {
        setOrder({ id: docSnap.id, ...docSnap.data() });
      }
    }, (error) => {
      console.error("Snapshot Error:", error);
    });
    return () => unsub();
  }, []);

  // --- CRASH PROTECTION: Check if order exists before rendering ---
  if (!order || !order.leaseDetails) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2E8B57" />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading lease details...</Text>
      </View>
    );
  }

  const paidCount = order.paidInstallments || 0;
  const duration = parseInt(order.leaseDetails.duration) || 6;
  const baseDate = getSafeDate(order.createdAt);
  const dueDates = Array.from({ length: duration }, (_, i) => addMonths(baseDate, i + 1));

  const handleInstallmentPayment = async (isEarly = false) => {
    if (paidCount >= duration) {
      Alert.alert("Completed", "All installments are paid.");
      return;
    }

    setLoading(true);
    try {
      const newPaidCount = paidCount + 1;
      const updateData = { paidInstallments: newPaidCount };
      if (newPaidCount === duration) updateData.status = 'Delivered';

      await updateDoc(doc(db, 'orders', order.id), updateData);
      Alert.alert("Success ✅", isEarly ? "Early payment received." : "Installment paid.");
    } catch (e) {
      Alert.alert("Error", "Payment failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.header}>{order.productName || 'Machine Lease'}</Text>
        
        <View style={styles.statCard}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Paid</Text>
            <Text style={styles.statVal}>{paidCount}/{duration}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Monthly</Text>
            <Text style={styles.statVal}>Rs. {order.leaseDetails.monthlyInstallment || 0}</Text>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  statCard: { backgroundColor: '#2E8B57', flexDirection: 'row', padding: 20, borderRadius: 15, marginBottom: 20, elevation: 5 },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: { color: '#E8F5E9', fontSize: 12 },
  statVal: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 5 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  earlyBtn: { backgroundColor: '#FFA726', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 25, elevation: 3 },
  earlyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  dateRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 2 },
  paidRow: { opacity: 0.7, backgroundColor: '#F1F8E9' },
  circle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  paidCircle: { backgroundColor: '#2E8B57' },
  indexText: { fontWeight: 'bold', fontSize: 13 },
  dateInfo: { flex: 1, marginLeft: 15 },
  dueDate: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  dueAmount: { fontSize: 13, color: '#666' },
  statusPaid: { color: '#2E8B57', fontWeight: 'bold', fontSize: 12 },
  statusPending: { color: '#FFA726', fontWeight: 'bold', fontSize: 12 }
});