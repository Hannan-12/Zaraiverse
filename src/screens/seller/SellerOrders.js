// src/screens/seller/SellerOrders.js
import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../services/firebase';
import { collection, query, onSnapshot, doc, updateDoc, where } from 'firebase/firestore';
import { AuthContext } from '../../contexts/AuthContext';

const STATUS_COLOR = {
  Pending: '#FFA726',
  Processing: '#2E8B57',
  'Awaiting Downpayment': '#2E8B57',
  Confirmed: '#2E8B57',
  Active: '#42A5F5',
  Delivered: '#66BB6A',
  Returned: '#66BB6A',
  Rejected: '#EF5350',
};

const PAYMENT_LABELS = {
  easypaisa: 'Easypaisa',
  cash: 'Cash on Pickup',
  jazzcash: 'JazzCash',
  cod: 'Cash on Delivery',
};

export default function SellerOrders() {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'orders'), where('sellerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setOrders(ordersList);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching seller orders:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleStatusUpdate = async (order, action) => {
    let newStatus;
    if (action === 'accept') {
      newStatus = 'Confirmed';
    } else {
      newStatus = 'Rejected';
    }

    const label = action === 'accept' ? 'Accept' : 'Reject';
    Alert.alert(
      `${label} Request`,
      `Are you sure you want to ${label.toLowerCase()} this ${order.orderType || 'order'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'orders', order.id), { status: newStatus });
              Alert.alert('Done', `Request marked as ${newStatus}.`);
            } catch (e) {
              Alert.alert('Error', 'Update failed. Check your connection.');
            }
          },
        },
      ]
    );
  };

  const handleMarkActive = async (order) => {
    Alert.alert(
      'Hand Over Equipment',
      'Confirm that the equipment has been handed over to the farmer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'orders', order.id), { status: 'Active' });
            } catch (e) {
              Alert.alert('Error', 'Could not update status.');
            }
          },
        },
      ]
    );
  };

  const handleMarkReturned = async (order) => {
    Alert.alert(
      'Mark as Returned',
      'Confirm that the equipment has been returned by the farmer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'orders', order.id), { status: 'Returned' });
            } catch (e) {
              Alert.alert('Error', 'Could not update status.');
            }
          },
        },
      ]
    );
  };

  const renderRentalDetails = (item) => {
    const r = item.rentalDetails || {};
    const isHourly = r.durationType === 'hours';
    const durationText = isHourly
      ? `${r.durationValue} hour${r.durationValue !== 1 ? 's' : ''}`
      : `${r.durationValue || r.durationDays || '—'} day${(r.durationValue || r.durationDays) !== 1 ? 's' : ''}`;
    const rateText = isHourly
      ? `Rs. ${r.hourlyRate || '—'} / hour`
      : `Rs. ${r.dailyRate || item.totalAmount} / day`;
    const returnDateObj = r.returnByDate ? new Date(r.returnByDate) : null;
    const returnText = returnDateObj
      ? isHourly
        ? `${returnDateObj.toDateString()} at ${returnDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : returnDateObj.toDateString()
      : null;

    return (
      <View style={styles.rentalBox}>
        <Text style={styles.productName}>{item.productName}</Text>
        <View style={styles.rentalRow}>
          <Text style={styles.rentalDetail}>
            <Ionicons name="time-outline" size={13} color="#555" /> {durationText}
          </Text>
          <Text style={styles.rentalDetail}>
            <Ionicons name="cash-outline" size={13} color="#555" /> {rateText}
          </Text>
        </View>
        <Text style={styles.rentalDetail}>
          Total: Rs. {r.totalCost || item.totalAmount}
        </Text>
        <Text style={styles.rentalDetail}>
          Payment: {PAYMENT_LABELS[item.paymentMethod] || item.paymentMethod || '—'}
        </Text>
        {returnText && (
          <Text style={[styles.rentalDetail, { color: '#E53935' }]}>
            Return By: {returnText}
          </Text>
        )}
      </View>
    );
  };

  const renderPurchaseDetails = (item) => (
    <View style={styles.standardOrderBox}>
      <Text style={styles.productName}>{item.productName || 'Purchase'}</Text>
      <Text style={styles.price}>Total: Rs. {item.totalAmount}</Text>
    </View>
  );

  const renderOrder = ({ item }) => {
    const statusColor = STATUS_COLOR[item.status] || '#FFA726';
    const isRental = item.orderType === 'Rental';

    return (
      <View style={styles.orderCard}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>
            {isRental ? '🔧 Rental' : '🛒 Order'} #{item.id.slice(-6).toUpperCase()}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>

        {/* Customer */}
        <View style={styles.userInfo}>
          <Ionicons name="person-outline" size={16} color="#666" />
          <Text style={styles.customerText}>{item.userName || 'Unknown Farmer'}</Text>
        </View>

        {/* Order Content */}
        {isRental ? renderRentalDetails(item) : renderPurchaseDetails(item)}

        {/* Action Buttons */}
        {item.status === 'Pending' && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.acceptBtn]}
              onPress={() => handleStatusUpdate(item, 'accept')}
            >
              <Text style={styles.btnText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => handleStatusUpdate(item, 'reject')}
            >
              <Text style={styles.btnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Mark as Active button for confirmed rentals (equipment handed over) */}
        {isRental && item.status === 'Confirmed' && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.activeBtn, { marginTop: 12 }]}
            onPress={() => handleMarkActive(item)}
          >
            <Ionicons name="construct-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.btnText}>Mark as Active</Text>
          </TouchableOpacity>
        )}

        {/* Mark as Returned button for active rentals */}
        {isRental && item.status === 'Active' && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.returnBtn, { marginTop: 12 }]}
            onPress={() => handleMarkReturned(item)}
          >
            <Ionicons name="checkmark-done-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.btnText}>Mark as Returned</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2E8B57" /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <Text style={styles.empty}>No orders or rental requests found.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  orderCard: { backgroundColor: '#fff', borderRadius: 15, padding: 16, marginBottom: 15, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  orderId: { fontWeight: 'bold', fontSize: 14, color: '#333' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  userInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  customerText: { color: '#555', marginLeft: 8, fontSize: 14 },
  rentalBox: { backgroundColor: '#E3F2FD', padding: 12, borderRadius: 10, marginVertical: 5, borderLeftWidth: 4, borderLeftColor: '#42A5F5' },
  rentalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  rentalDetail: { fontSize: 13, color: '#444', marginBottom: 3 },
  productName: { fontWeight: 'bold', color: '#333', fontSize: 15, marginBottom: 5 },
  standardOrderBox: { paddingVertical: 5 },
  price: { fontWeight: 'bold', color: '#2E8B57', fontSize: 16, marginTop: 5 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  actionBtn: { flex: 0.48, padding: 12, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  acceptBtn: { backgroundColor: '#2E8B57' },
  rejectBtn: { backgroundColor: '#EF5350' },
  activeBtn: { backgroundColor: '#FB8C00', flex: 1 },
  returnBtn: { backgroundColor: '#42A5F5', flex: 1 },
  btnText: { color: '#fff', fontWeight: 'bold' },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' },
});
