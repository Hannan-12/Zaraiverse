// src/screens/farmer/PaymentScreen.js
/**
 * Payment Screen (SI-4 / FR-10)
 * Integrated with Pakistani payment services: JazzCash and Easypaisa
 */

import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { AuthContext } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import {
  initializeJazzCashPayment,
  initializeEasypaisaPayment,
  initializeCODPayment,
  getAvailablePaymentMethods,
  PaymentMethod,
} from '../../services/paymentGatewayService';
import { logPaymentError } from '../../services/errorLoggingService';

export default function PaymentScreen({ navigation }) {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showMethodModal, setShowMethodModal] = useState(false);

  const DELIVERY_FEE = 150;
  const totalAmount = getCartTotal() + DELIVERY_FEE;
  const paymentMethods = getAvailablePaymentMethods();

  const validatePhoneNumber = (phone) => {
    // Pakistani phone number validation (03XX-XXXXXXX)
    const phoneRegex = /^03[0-9]{2}[0-9]{7}$/;
    return phoneRegex.test(phone.replace(/-/g, ''));
  };

  const handleSelectMethod = (method) => {
    setSelectedMethod(method);
    setShowMethodModal(false);
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;

    if (!selectedMethod) {
      Alert.alert('Select Payment Method', 'Please select a payment method to continue.');
      return;
    }

    // Validate phone for mobile wallet payments
    if ((selectedMethod === PaymentMethod.JAZZCASH || selectedMethod === PaymentMethod.EASYPAISA)) {
      if (!phoneNumber) {
        Alert.alert('Phone Required', 'Please enter your mobile wallet phone number.');
        return;
      }
      if (!validatePhoneNumber(phoneNumber)) {
        Alert.alert('Invalid Phone', 'Please enter a valid Pakistani mobile number (03XX-XXXXXXX).');
        return;
      }
    }

    const sellerId = cartItems[0]?.sellerId;
    if (!sellerId) {
      Alert.alert(
        'Error',
        'One or more products in your cart are missing seller information. Please remove and re-add them.'
      );
      return;
    }

    setLoading(true);
    try {
      // Create order first
      const orderData = {
        userId: user.uid,
        userName: user.name || user.displayName || 'Farmer',
        sellerId: sellerId,
        items: cartItems,
        totalAmount: totalAmount,
        deliveryFee: DELIVERY_FEE,
        status: 'Pending Payment',
        paymentMethod: selectedMethod,
        createdAt: serverTimestamp(),
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderData);
      const orderId = orderRef.id;

      // Initialize payment based on selected method
      let paymentResult;

      switch (selectedMethod) {
        case PaymentMethod.JAZZCASH:
          paymentResult = await initializeJazzCashPayment({
            amount: totalAmount,
            orderId,
            userId: user.uid,
            userPhone: phoneNumber.replace(/-/g, ''),
            description: `ZaraiVerse Order #${orderId.slice(0, 8)}`,
          });
          break;

        case PaymentMethod.EASYPAISA:
          paymentResult = await initializeEasypaisaPayment({
            amount: totalAmount,
            orderId,
            userId: user.uid,
            userPhone: phoneNumber.replace(/-/g, ''),
            userEmail: user.email,
            description: `ZaraiVerse Order #${orderId.slice(0, 8)}`,
          });
          break;

        case PaymentMethod.COD:
          paymentResult = await initializeCODPayment({
            amount: totalAmount,
            orderId,
            userId: user.uid,
          });
          break;

        default:
          throw new Error('Invalid payment method');
      }

      if (paymentResult.success) {
        clearCart();

        // Show appropriate message based on payment method
        if (selectedMethod === PaymentMethod.COD) {
          Alert.alert(
            'Order Placed!',
            'Your order has been placed successfully. You will pay Rs. ' +
              totalAmount +
              ' when the order is delivered.',
            [{ text: 'View Orders', onPress: () => navigation.navigate('Orders') }]
          );
        } else {
          Alert.alert(
            'Payment Initiated',
            `Your ${selectedMethod === PaymentMethod.JAZZCASH ? 'JazzCash' : 'Easypaisa'} payment request has been sent to ${phoneNumber}.\n\nTransaction Ref: ${paymentResult.transactionRef}\n\nPlease complete the payment on your mobile.`,
            [
              { text: 'View Orders', onPress: () => navigation.navigate('Orders') },
              { text: 'OK' },
            ]
          );
        }
      } else {
        throw new Error(paymentResult.message || 'Payment initialization failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      await logPaymentError(selectedMethod, error.message, user.uid);
      Alert.alert('Payment Error', error.message || 'Could not process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getMethodIcon = (methodId) => {
    switch (methodId) {
      case PaymentMethod.JAZZCASH:
        return 'phone-portrait-outline';
      case PaymentMethod.EASYPAISA:
        return 'phone-portrait-outline';
      case PaymentMethod.COD:
        return 'cash-outline';
      default:
        return 'card-outline';
    }
  };

  const getMethodColor = (methodId) => {
    switch (methodId) {
      case PaymentMethod.JAZZCASH:
        return '#ED1C24';
      case PaymentMethod.EASYPAISA:
        return '#00A651';
      case PaymentMethod.COD:
        return '#FF9800';
      default:
        return '#666';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.header}>Order Summary</Text>

        {/* Order Items Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Items ({cartItems.length})</Text>
          {cartItems.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.name} x {item.quantity}
              </Text>
              <Text style={styles.itemPrice}>Rs. {item.price * item.quantity}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text>Items Total</Text>
            <Text>Rs. {getCartTotal()}</Text>
          </View>
          <View style={styles.row}>
            <Text>Delivery Fee</Text>
            <Text>Rs. {DELIVERY_FEE}</Text>
          </View>
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalText}>Total Amount</Text>
            <Text style={styles.totalText}>Rs. {totalAmount}</Text>
          </View>
        </View>

        {/* Payment Method Selection */}
        <Text style={styles.sectionHeader}>Payment Method</Text>
        <TouchableOpacity
          style={styles.methodSelector}
          onPress={() => setShowMethodModal(true)}
        >
          {selectedMethod ? (
            <View style={styles.selectedMethod}>
              <View
                style={[
                  styles.methodIconContainer,
                  { backgroundColor: getMethodColor(selectedMethod) + '20' },
                ]}
              >
                <Ionicons
                  name={getMethodIcon(selectedMethod)}
                  size={24}
                  color={getMethodColor(selectedMethod)}
                />
              </View>
              <View style={styles.methodInfo}>
                <Text style={styles.methodName}>
                  {paymentMethods.find((m) => m.id === selectedMethod)?.name}
                </Text>
                <Text style={styles.methodDescription}>
                  {paymentMethods.find((m) => m.id === selectedMethod)?.description}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.placeholderMethod}>
              <Ionicons name="wallet-outline" size={24} color="#999" />
              <Text style={styles.placeholderText}>Select payment method</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={24} color="#999" />
        </TouchableOpacity>

        {/* Phone Number Input for Mobile Wallets */}
        {(selectedMethod === PaymentMethod.JAZZCASH ||
          selectedMethod === PaymentMethod.EASYPAISA) && (
          <View style={styles.phoneInputContainer}>
            <Text style={styles.phoneLabel}>Mobile Wallet Number</Text>
            <TextInput
              style={styles.phoneInput}
              placeholder="03XX-XXXXXXX"
              placeholderTextColor="#999"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              maxLength={12}
            />
            <Text style={styles.phoneHint}>
              Enter the phone number linked to your{' '}
              {selectedMethod === PaymentMethod.JAZZCASH ? 'JazzCash' : 'Easypaisa'} account
            </Text>
          </View>
        )}

        {/* Payment Methods Info */}
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark-outline" size={24} color="#4CAF50" />
          <Text style={styles.infoText}>
            Your payment is secure. We support JazzCash, Easypaisa, and Cash on Delivery.
          </Text>
        </View>
      </ScrollView>

      {/* Footer with Place Order Button */}
      <View style={styles.footer}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerLabel}>Total</Text>
          <Text style={styles.footerAmount}>Rs. {totalAmount}</Text>
        </View>
        <TouchableOpacity
          style={[styles.btn, (!selectedMethod || loading) && styles.btnDisabled]}
          onPress={handlePlaceOrder}
          disabled={!selectedMethod || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>
              {selectedMethod === PaymentMethod.COD ? 'Place Order' : 'Pay Now'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Payment Method Modal */}
      <Modal
        visible={showMethodModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMethodModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Payment Method</Text>
              <TouchableOpacity onPress={() => setShowMethodModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.methodOption,
                  selectedMethod === method.id && styles.methodOptionSelected,
                ]}
                onPress={() => handleSelectMethod(method.id)}
                disabled={!method.enabled}
              >
                <View
                  style={[
                    styles.methodIconContainer,
                    { backgroundColor: getMethodColor(method.id) + '20' },
                  ]}
                >
                  <Ionicons
                    name={method.icon}
                    size={24}
                    color={getMethodColor(method.id)}
                  />
                </View>
                <View style={styles.methodInfo}>
                  <Text style={styles.methodName}>{method.name}</Text>
                  <Text style={styles.methodDescription}>{method.description}</Text>
                </View>
                {selectedMethod === method.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scroll: { padding: 20 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 12 },
  sectionHeader: { fontSize: 16, fontWeight: '600', color: '#333', marginTop: 20, marginBottom: 12 },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemName: { flex: 1, fontSize: 14, color: '#333' },
  itemPrice: { fontSize: 14, color: '#333', marginLeft: 12 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  totalRow: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10, marginTop: 10 },
  totalText: { fontWeight: 'bold', fontSize: 18, color: '#2E8B57' },
  methodSelector: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedMethod: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  placeholderMethod: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  placeholderText: { marginLeft: 12, color: '#999', fontSize: 16 },
  methodIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodInfo: { flex: 1, marginLeft: 12 },
  methodName: { fontSize: 16, fontWeight: '600', color: '#333' },
  methodDescription: { fontSize: 12, color: '#666', marginTop: 2 },
  phoneInputContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  phoneLabel: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 8 },
  phoneInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 14,
    fontSize: 18,
    letterSpacing: 1,
  },
  phoneHint: { fontSize: 12, color: '#666', marginTop: 8 },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  infoText: { flex: 1, marginLeft: 12, fontSize: 14, color: '#2E7D32' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerTotal: { flex: 1 },
  footerLabel: { fontSize: 12, color: '#666' },
  footerAmount: { fontSize: 20, fontWeight: 'bold', color: '#2E8B57' },
  btn: {
    backgroundColor: '#2E8B57',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnDisabled: { backgroundColor: '#BDBDBD' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginBottom: 12,
  },
  methodOptionSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8E9',
  },
});
