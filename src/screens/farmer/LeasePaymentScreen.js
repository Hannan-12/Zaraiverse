// src/screens/farmer/LeasePaymentScreen.js
// Rental Tracking Screen — shows status of equipment rental order
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { db } from '../../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

const STATUS_STEPS = ['Pending', 'Confirmed', 'Active', 'Returned'];

const STATUS_META = {
  Pending: {
    icon: 'time-outline',
    color: '#FFA726',
    title: 'Awaiting Seller Approval',
    subtitle: 'The seller is reviewing your rental request. Please check back soon.',
  },
  Confirmed: {
    icon: 'checkmark-circle-outline',
    color: '#2E8B57',
    title: 'Rental Confirmed!',
    subtitle: 'Your rental has been approved. Collect the equipment and pay the seller.',
  },
  Active: {
    icon: 'construct-outline',
    color: '#42A5F5',
    title: 'Equipment In Use',
    subtitle: 'You currently have the equipment. Remember to return it by the due date.',
  },
  Returned: {
    icon: 'checkmark-done-circle-outline',
    color: '#66BB6A',
    title: 'Rental Complete',
    subtitle: 'The equipment has been returned. Thank you!',
  },
  Rejected: {
    icon: 'close-circle-outline',
    color: '#EF5350',
    title: 'Request Rejected',
    subtitle: 'The seller could not fulfil this rental request. Please try another listing.',
  },
};

const PAYMENT_LABELS = {
  easypaisa: 'Easypaisa',
  cash: 'Cash on Pickup',
  jazzcash: 'JazzCash',
  cod: 'Cash on Delivery',
};

export default function LeasePaymentScreen({ route }) {
  const initialOrder = route?.params?.order;
  const [order, setOrder] = useState(initialOrder);

  useEffect(() => {
    if (!order?.id) return;
    const unsub = onSnapshot(doc(db, 'orders', order.id), (docSnap) => {
      if (docSnap.exists()) setOrder({ id: docSnap.id, ...docSnap.data() });
    });
    return () => unsub();
  }, [order?.id]);

  if (!order) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2E8B57" /></View>;
  }

  const rental = order.rentalDetails || {};
  const meta = STATUS_META[order.status] || STATUS_META['Pending'];
  const currentStep = STATUS_STEPS.indexOf(order.status);

  const returnDate = rental.returnByDate
    ? new Date(rental.returnByDate).toDateString()
    : 'N/A';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.header}>{order.productName}</Text>

      {/* Status Card */}
      <View style={[styles.statusBox, { borderLeftColor: meta.color }]}>
        <Ionicons name={meta.icon} size={52} color={meta.color} />
        <Text style={[styles.statusTitle, { color: meta.color }]}>{meta.title}</Text>
        <Text style={styles.statusSubtitle}>{meta.subtitle}</Text>
      </View>

      {/* Progress Steps (not shown for Rejected) */}
      {order.status !== 'Rejected' && (
        <View style={styles.stepsRow}>
          {STATUS_STEPS.map((step, i) => (
            <React.Fragment key={step}>
              <View style={styles.stepItem}>
                <View style={[styles.stepDot, i <= currentStep && { backgroundColor: '#2E8B57' }]}>
                  {i <= currentStep && <Ionicons name="checkmark" size={12} color="#fff" />}
                </View>
                <Text style={[styles.stepLabel, i <= currentStep && { color: '#2E8B57' }]}>
                  {step}
                </Text>
              </View>
              {i < STATUS_STEPS.length - 1 && (
                <View style={[styles.stepLine, i < currentStep && { backgroundColor: '#2E8B57' }]} />
              )}
            </React.Fragment>
          ))}
        </View>
      )}

      {/* Rental Details */}
      <View style={styles.detailCard}>
        <Text style={styles.detailTitle}>Rental Summary</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Duration</Text>
          <Text style={styles.detailVal}>
            {rental.durationDays || '—'} day{rental.durationDays !== 1 ? 's' : ''}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Daily Rate</Text>
          <Text style={styles.detailVal}>Rs. {rental.dailyRate || '—'}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total Cost</Text>
          <Text style={[styles.detailVal, { color: '#2E8B57', fontWeight: 'bold' }]}>
            Rs. {rental.totalCost || order.totalAmount || '—'}
          </Text>
        </View>

        <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: '#eee', marginTop: 8, paddingTop: 8 }]}>
          <Text style={styles.detailLabel}>Return By</Text>
          <Text style={[styles.detailVal, { color: '#E53935' }]}>{returnDate}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Payment Method</Text>
          <Text style={styles.detailVal}>
            {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod || '—'}
          </Text>
        </View>
      </View>

      {/* Payment instruction for confirmed orders */}
      {order.status === 'Confirmed' && order.paymentMethod === 'cash' && (
        <View style={styles.infoCard}>
          <Ionicons name="cash-outline" size={20} color="#FF9800" />
          <Text style={styles.infoText}>
            Pay <Text style={{ fontWeight: 'bold' }}>Rs. {rental.totalCost}</Text> in cash to the seller when
            you collect the equipment.
          </Text>
        </View>
      )}
      {order.status === 'Confirmed' && order.paymentMethod === 'easypaisa' && (
        <View style={styles.infoCard}>
          <Ionicons name="phone-portrait-outline" size={20} color="#00A651" />
          <Text style={styles.infoText}>
            Please send <Text style={{ fontWeight: 'bold' }}>Rs. {rental.totalCost}</Text> via Easypaisa
            to the seller's registered number before pickup.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: '#333' },
  statusBox: {
    backgroundColor: '#fff', padding: 24, borderRadius: 16, alignItems: 'center',
    elevation: 2, borderLeftWidth: 5, marginBottom: 20,
  },
  statusTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 10 },
  statusSubtitle: { fontSize: 13, color: '#666', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  stepsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  stepItem: { alignItems: 'center', width: 60 },
  stepDot: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#ddd',
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  stepLabel: { fontSize: 10, color: '#aaa', textAlign: 'center' },
  stepLine: { flex: 1, height: 2, backgroundColor: '#ddd', marginBottom: 16 },
  detailCard: { backgroundColor: '#fff', borderRadius: 15, padding: 20, elevation: 2, marginBottom: 16 },
  detailTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 14 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  detailLabel: { fontSize: 14, color: '#666' },
  detailVal: { fontSize: 14, color: '#333' },
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFF8E1',
    padding: 14, borderRadius: 12, gap: 10, marginBottom: 16,
  },
  infoText: { flex: 1, fontSize: 13, color: '#555', lineHeight: 20 },
});
