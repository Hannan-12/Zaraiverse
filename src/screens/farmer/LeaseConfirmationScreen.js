// src/screens/farmer/LeaseConfirmationScreen.js
// Rental Booking Confirmation — shown immediately after a rental request is submitted
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const PAYMENT_LABELS = {
  easypaisa: 'Easypaisa',
  cash: 'Cash on Pickup',
};

export default function LeaseConfirmationScreen({ route, navigation }) {
  const { order } = route.params;
  const rental = order?.rentalDetails || {};

  const isHourly = rental.durationType === 'hours';
  const durationText = isHourly
    ? `${rental.durationValue} Hour${rental.durationValue !== 1 ? 's' : ''}`
    : `${rental.durationValue || rental.durationDays} Day${(rental.durationValue || rental.durationDays) !== 1 ? 's' : ''}`;

  const rateText = isHourly
    ? `Rs. ${rental.hourlyRate} / hour`
    : `Rs. ${rental.dailyRate} / day`;

  const returnDate = rental.returnByDate
    ? new Date(rental.returnByDate).toDateString()
    : 'N/A';

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#2E8B57', '#1B5E20']} style={styles.heroSection}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark-circle" size={64} color="#2E8B57" />
        </View>
        <Text style={styles.heroTitle}>Request Sent!</Text>
        <Text style={styles.heroSub}>
          Your rental request has been submitted. The seller will confirm shortly.
        </Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.productName}>{order?.productName}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rental Summary</Text>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="time-outline" size={18} color="#2E8B57" />
              <Text style={styles.rowLabel}>Duration</Text>
            </View>
            <Text style={styles.rowValue}>{durationText}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="pricetag-outline" size={18} color="#2E8B57" />
              <Text style={styles.rowLabel}>Rate</Text>
            </View>
            <Text style={styles.rowValue}>{rateText}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="cash-outline" size={18} color="#2E8B57" />
              <Text style={styles.rowLabel}>Total Cost</Text>
            </View>
            <Text style={[styles.rowValue, styles.totalCost]}>
              Rs. {rental.totalCost || order?.totalAmount}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="calendar-outline" size={18} color="#E53935" />
              <Text style={styles.rowLabel}>Return By</Text>
            </View>
            <Text style={[styles.rowValue, { color: '#E53935' }]}>{returnDate}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="wallet-outline" size={18} color="#2E8B57" />
              <Text style={styles.rowLabel}>Payment</Text>
            </View>
            <Text style={styles.rowValue}>
              {PAYMENT_LABELS[rental.paymentMethod] || rental.paymentMethod || '—'}
            </Text>
          </View>
        </View>

        <View style={styles.noteBox}>
          <Ionicons name="information-circle-outline" size={18} color="#1565C0" />
          <Text style={styles.noteText}>
            You will be notified once the seller confirms your request. Check your Orders tab for updates.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.statusBtn}
          onPress={() => navigation.navigate('LeasePayment', { order })}
        >
          <Ionicons name="receipt-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.statusBtnText}>View Order Status</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.ordersBtn}
          onPress={() => navigation.navigate('Orders')}
        >
          <Text style={styles.ordersBtnText}>Go to My Orders</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF9' },
  heroSection: {
    paddingTop: 60, paddingBottom: 40, paddingHorizontal: 24,
    alignItems: 'center', borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  iconCircle: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16, elevation: 4,
  },
  heroTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 20 },
  content: { padding: 20 },
  productName: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 16, marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 3, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowLabel: { fontSize: 14, color: '#666', marginLeft: 8 },
  rowValue: { fontSize: 14, fontWeight: '600', color: '#333' },
  totalCost: { fontSize: 18, fontWeight: 'bold', color: '#1B5E20' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 4 },
  noteBox: {
    flexDirection: 'row', backgroundColor: '#E3F2FD', padding: 14, borderRadius: 12,
    marginBottom: 20, gap: 10,
  },
  noteText: { flex: 1, fontSize: 13, color: '#1565C0', lineHeight: 20 },
  statusBtn: {
    backgroundColor: '#2E8B57', padding: 16, borderRadius: 12, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center', marginBottom: 12, elevation: 2,
  },
  statusBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  ordersBtn: {
    borderWidth: 2, borderColor: '#2E8B57', padding: 14, borderRadius: 12,
    alignItems: 'center', marginBottom: 20,
  },
  ordersBtnText: { color: '#2E8B57', fontWeight: 'bold', fontSize: 15 },
});
