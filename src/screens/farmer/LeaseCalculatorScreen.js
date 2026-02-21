// src/screens/farmer/LeaseCalculatorScreen.js
// Rental (usage-based) Calculator — replaces the old Lease Installment Calculator
import React, { useState, useContext } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, ScrollView, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { AuthContext } from '../../contexts/AuthContext';

// Payment method constants (inline to avoid circular dependency)
const PAYMENT_METHODS = [
  {
    id: 'easypaisa',
    name: 'Easypaisa',
    description: 'Pay via Easypaisa mobile wallet',
    icon: 'phone-portrait-outline',
    color: '#00A651',
  },
  {
    id: 'cash',
    name: 'Cash on Pickup',
    description: 'Pay cash directly to the seller when collecting',
    icon: 'cash-outline',
    color: '#FF9800',
  },
];

const DURATION_OPTIONS = [
  { label: '1 Day', days: 1 },
  { label: '3 Days', days: 3 },
  { label: '7 Days', days: 7 },
];

export default function LeaseCalculatorScreen({ route, navigation }) {
  const { product } = route.params;
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [selectedDays, setSelectedDays] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Use rentalRatePerDay if available, otherwise fall back to price
  const dailyRate = product.rentalRatePerDay || product.price;
  const totalRentalCost = dailyRate * selectedDays;

  const selectedMethod = PAYMENT_METHODS.find((m) => m.id === selectedPayment);

  const handleSendRequest = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to submit a request.');
      return;
    }
    if (!selectedPayment) {
      Alert.alert('Select Payment Method', 'Please choose how you will pay before submitting.');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'orders'), {
        userId: user.uid,
        userName: user.displayName || 'Farmer',
        sellerId: product.sellerId,
        productName: product.name,
        productId: product.id,
        orderType: 'Rental',
        status: 'Pending',
        totalAmount: totalRentalCost,
        paymentMethod: selectedPayment,
        paidAmount: 0,
        createdAt: serverTimestamp(),
        rentalDetails: {
          durationDays: selectedDays,
          dailyRate: dailyRate,
          totalCost: totalRentalCost,
          paymentMethod: selectedPayment,
          returnByDate: new Date(Date.now() + selectedDays * 86400000).toISOString(),
        },
      });

      Alert.alert(
        'Request Sent!',
        `Your rental request has been submitted.\n\nPayment: ${selectedMethod?.name}\nTotal: Rs. ${totalRentalCost}\n\nCheck your "Orders" tab for updates.`,
        [{ text: 'View Orders', onPress: () => navigation.navigate('Orders') }]
      );
    } catch (error) {
      Alert.alert('Error', 'Could not send request. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.header}>Rental Plan: {product.name}</Text>

      {/* Pricing Card */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Daily Rental Rate:</Text>
          <Text style={styles.val}>Rs. {dailyRate} / day</Text>
        </View>
        <View style={styles.divider} />

        {/* Duration Selection */}
        <Text style={styles.sectionLabel}>Select Duration:</Text>
        <View style={styles.durationRow}>
          {DURATION_OPTIONS.map(({ label, days }) => (
            <TouchableOpacity
              key={days}
              style={[styles.durationBtn, selectedDays === days && styles.activeBtn]}
              onPress={() => setSelectedDays(days)}
            >
              <Text style={{ color: selectedDays === days ? '#fff' : '#333', fontWeight: '600' }}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Cost Summary */}
        <View style={styles.resultBox}>
          <Text style={styles.resultLabel}>Total Rental Cost</Text>
          <Text style={styles.resultPrice}>Rs. {totalRentalCost}</Text>
          <Text style={styles.resultSub}>
            Rs. {dailyRate} × {selectedDays} day{selectedDays > 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Return Date Info */}
      <View style={styles.infoCard}>
        <Ionicons name="calendar-outline" size={20} color="#2E8B57" />
        <Text style={styles.infoText}>
          Return By:{' '}
          <Text style={styles.infoBold}>
            {new Date(Date.now() + selectedDays * 86400000).toDateString()}
          </Text>
        </Text>
      </View>

      {/* Payment Method Selection */}
      <Text style={styles.sectionHeader}>Payment Method</Text>
      <TouchableOpacity
        style={styles.methodSelector}
        onPress={() => setShowPaymentModal(true)}
      >
        {selectedMethod ? (
          <View style={styles.selectedMethod}>
            <View style={[styles.methodIcon, { backgroundColor: selectedMethod.color + '20' }]}>
              <Ionicons name={selectedMethod.icon} size={22} color={selectedMethod.color} />
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>{selectedMethod.name}</Text>
              <Text style={styles.methodDesc}>{selectedMethod.description}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.placeholderMethod}>
            <Ionicons name="wallet-outline" size={22} color="#999" />
            <Text style={styles.placeholderText}>Select payment method</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </TouchableOpacity>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.confirmBtn, (!selectedPayment || loading) && styles.confirmBtnDisabled]}
        onPress={handleSendRequest}
        disabled={!selectedPayment || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.confirmText}>Submit Rental Request</Text>
        )}
      </TouchableOpacity>

      {/* Payment Method Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Payment Method</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.methodOption,
                  selectedPayment === method.id && styles.methodOptionSelected,
                ]}
                onPress={() => {
                  setSelectedPayment(method.id);
                  setShowPaymentModal(false);
                }}
              >
                <View style={[styles.methodIcon, { backgroundColor: method.color + '20' }]}>
                  <Ionicons name={method.icon} size={22} color={method.color} />
                </View>
                <View style={styles.methodInfo}>
                  <Text style={styles.methodName}>{method.name}</Text>
                  <Text style={styles.methodDesc}>{method.description}</Text>
                </View>
                {selectedPayment === method.id && (
                  <Ionicons name="checkmark-circle" size={22} color="#2E8B57" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF9', padding: 20 },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#2E8B57' },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 15, elevation: 3 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  label: { fontSize: 14, color: '#666' },
  val: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
  sectionLabel: { fontWeight: 'bold', marginBottom: 10, color: '#333', fontSize: 14 },
  durationRow: { flexDirection: 'row', justifyContent: 'space-between' },
  durationBtn: { padding: 12, backgroundColor: '#f0f0f0', borderRadius: 10, width: '30%', alignItems: 'center' },
  activeBtn: { backgroundColor: '#2E8B57' },
  resultBox: { marginTop: 20, backgroundColor: '#E8F5E9', padding: 20, borderRadius: 10, alignItems: 'center' },
  resultLabel: { color: '#2E8B57', fontWeight: 'bold', fontSize: 14 },
  resultPrice: { fontSize: 28, fontWeight: 'bold', color: '#1B5E20', marginVertical: 4 },
  resultSub: { fontSize: 12, color: '#555' },
  infoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', padding: 14, borderRadius: 12, marginTop: 16, gap: 10 },
  infoText: { color: '#444', fontSize: 13 },
  infoBold: { fontWeight: 'bold', color: '#1B5E20' },
  sectionHeader: { fontSize: 15, fontWeight: '600', color: '#333', marginTop: 20, marginBottom: 10 },
  methodSelector: {
    backgroundColor: '#fff', padding: 16, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', elevation: 2,
  },
  selectedMethod: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  placeholderMethod: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  placeholderText: { marginLeft: 12, color: '#999', fontSize: 15 },
  methodIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  methodInfo: { flex: 1, marginLeft: 12 },
  methodName: { fontSize: 15, fontWeight: '600', color: '#333' },
  methodDesc: { fontSize: 12, color: '#666', marginTop: 2 },
  confirmBtn: { backgroundColor: '#2E8B57', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  confirmBtnDisabled: { backgroundColor: '#ccc' },
  confirmText: { color: '#fff', fontWeight: 'bold', fontSize: 17 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#222' },
  methodOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 2, borderColor: '#E0E0E0', marginBottom: 12 },
  methodOptionSelected: { borderColor: '#2E8B57', backgroundColor: '#F1F8E9' },
});
