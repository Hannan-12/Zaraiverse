// src/screens/farmer/LeasePaymentScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { db } from '../../services/firebase';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { format, addMonths } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

export default function LeasePaymentScreen({ route, navigation }) {
  const initialOrder = route?.params?.order;
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!order?.id) return;
    const unsub = onSnapshot(doc(db, 'orders', order.id), (docSnap) => {
      if (docSnap.exists()) {
        setOrder({ id: docSnap.id, ...docSnap.data() });
      }
    });
    return () => unsub();
  }, [order?.id]);

  if (!order || !order.leaseDetails) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2E8B57" /></View>;
  }

  // --- Status Checks ---
  const isPending = order.status === 'Pending';
  const needsDownpayment = order.status === 'Awaiting Downpayment';
  const isActive = order.status === 'Active' || order.status === 'Delivered';

  const paidCount = order.paidInstallments || 0;
  const duration = parseInt(order.leaseDetails.duration) || 6;
  
  // Date Logic
  const getSafeDate = (d) => (d?.toDate ? d.toDate() : new Date(d || Date.now()));
  const baseDate = getSafeDate(order.createdAt);
  const dueDates = Array.from({ length: duration }, (_, i) => addMonths(baseDate, i + 1));

  // --- Action: Pay Downpayment ---
  const handleDownpayment = async () => {
    setLoading(true);
    try {
      // Once downpayment is paid, the lease becomes 'Active'
      await updateDoc(doc(db, 'orders', order.id), { status: 'Active' });
      Alert.alert("Success ✅", "Downpayment paid! You can now view your installment schedule.");
    } catch (e) {
      Alert.alert("Error", "Payment failed.");
    } finally {
      setLoading(false);
    }
  };

  // --- Action: Pay Installment ---
  const handleInstallmentPayment = async () => {
    if (paidCount >= duration) return;
    setLoading(true);
    try {
      const newCount = paidCount + 1;
      const updateData = { paidInstallments: newCount };
      if (newCount === duration) updateData.status = 'Delivered';
      await updateDoc(doc(db, 'orders', order.id), updateData);
      Alert.alert("Success ✅", "Monthly installment paid.");
    } catch (e) {
      Alert.alert("Error", "Payment failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.header}>{order.productName}</Text>

        {/* CASE 1: Still waiting for Seller to Accept */}
        {isPending && (
          <View style={styles.statusBox}>
            <Ionicons name="time-outline" size={60} color="#FFA726" />
            <Text style={styles.statusTitle}>Pending Approval</Text>
            <Text style={styles.statusSubtitle}>The seller is reviewing your request. Please check back later.</Text>
          </View>
        )}

        {/* CASE 2: Approved, Needs Downpayment */}
        {needsDownpayment && (
          <View style={styles.statusBox}>
            <Ionicons name="card-outline" size={60} color="#2E8B57" />
            <Text style={styles.statusTitle}>Approved!</Text>
            <Text style={styles.statusSubtitle}>Pay the downpayment to start your lease.</Text>
            <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Downpayment Amount:</Text>
                <Text style={styles.priceVal}>Rs. {order.leaseDetails.downpayment}</Text>
            </View>
            <TouchableOpacity style={styles.payBtn} onPress={handleDownpayment} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff"/> : <Text style={styles.payBtnText}>Pay Downpayment Now</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* CASE 3: Lease is Active -> Show Schedule & Early Pay */}
        {isActive && (
          <>
            <View style={styles.statCard}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Paid</Text>
                <Text style={styles.statVal}>{paidCount}/{duration}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Monthly</Text>
                <Text style={styles.statVal}>Rs. {order.leaseDetails.monthlyInstallment}</Text>
              </View>
            </View>

            {paidCount < duration && (
              <TouchableOpacity style={styles.earlyBtn} onPress={handleInstallmentPayment} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff"/> : <Text style={styles.earlyBtnText}>Pay Next Installment Early</Text>}
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
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  statusBox: { backgroundColor: '#fff', padding: 30, borderRadius: 20, alignItems: 'center', elevation: 2, marginTop: 20 },
  statusTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 15, color: '#333' },
  statusSubtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 10, lineHeight: 20 },
  priceRow: { flexDirection: 'row', marginTop: 20, justifyContent: 'space-between', width: '100%', paddingHorizontal: 10 },
  priceLabel: { color: '#666' },
  priceVal: { fontWeight: 'bold', color: '#2E8B57' },
  payBtn: { backgroundColor: '#2E8B57', padding: 16, borderRadius: 12, marginTop: 25, width: '100%', alignItems: 'center' },
  payBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  statCard: { backgroundColor: '#2E8B57', flexDirection: 'row', padding: 20, borderRadius: 15, marginBottom: 20 },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: { color: '#E8F5E9', fontSize: 12 },
  statVal: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  earlyBtn: { backgroundColor: '#FFA726', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 25 },
  earlyBtnText: { color: '#fff', fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  dateRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10 },
  paidRow: { opacity: 0.6 },
  circle: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  paidCircle: { backgroundColor: '#2E8B57' },
  indexText: { fontWeight: 'bold', fontSize: 12 },
  dateInfo: { flex: 1, marginLeft: 15 },
  dueDate: { fontSize: 14, fontWeight: 'bold' },
  dueAmount: { fontSize: 12, color: '#666' },
  statusPaid: { color: '#2E8B57', fontWeight: 'bold', fontSize: 12 },
  statusPending: { color: '#FFA726', fontWeight: 'bold', fontSize: 12 }
});