// src/screens/seller/SellerOrders.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../services/firebase';
import { collection, query, onSnapshot, doc, updateDoc, where } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

export default function SellerOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'orders'), where('sellerId', '==', user.uid));
    return onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      setLoading(false);
    });
  }, [user]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    const action = newStatus === 'Processing' ? 'Accept' : 'Reject';
    Alert.alert(
      `${action} Order`,
      `Are you sure you want to ${action.toLowerCase()} this request?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Yes", 
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
              Alert.alert("Success", `Order has been ${newStatus.toLowerCase()}.`);
            } catch (e) { Alert.alert("Error", "Update failed."); }
          }
        }
      ]
    );
  };

  const renderOrder = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>Order #{item.id.slice(-6).toUpperCase()}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'Rejected' ? '#EF5350' : '#2E8B57' }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <Text style={styles.customerText}><Ionicons name="person" size={14}/> {item.userName}</Text>

      {item.orderType === 'Lease' ? (
        <View style={styles.leaseBox}>
          <Text style={styles.productName}>{item.productName}</Text>
          <Text style={styles.leaseDetail}>Plan: {item.leaseDetails?.duration}</Text>
          <Text style={styles.leaseDetail}>Monthly: Rs. {item.leaseDetails?.monthlyInstallment}</Text>
          <Text style={styles.leaseDetail}>Downpayment: Rs. {item.leaseDetails?.downpayment}</Text>
        </View>
      ) : (
        <Text style={styles.price}>Total: Rs. {item.totalAmount}</Text>
      )}

      {item.status === 'Pending' && (
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.acceptBtn]} 
            onPress={() => handleStatusUpdate(item.id, 'Processing')}
          >
            <Text style={styles.btnText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.rejectBtn]} 
            onPress={() => handleStatusUpdate(item.id, 'Rejected')}
          >
            <Text style={styles.btnText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) return <ActivityIndicator size="large" color="#2E8B57" style={{marginTop: 50}}/>;

  return (
    <View style={styles.container}>
      <FlatList data={orders} renderItem={renderOrder} contentContainerStyle={{padding: 16}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F6' },
  orderCard: { backgroundColor: '#fff', borderRadius: 15, padding: 16, marginBottom: 15, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  orderId: { fontWeight: 'bold', fontSize: 16 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  customerText: { color: '#555', marginBottom: 5 },
  price: { fontWeight: 'bold', color: '#2E8B57', fontSize: 16 },
  leaseBox: { backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8, marginVertical: 5 },
  productName: { fontWeight: 'bold', color: '#333' },
  leaseDetail: { fontSize: 12, color: '#666' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  actionBtn: { flex: 0.48, padding: 12, borderRadius: 10, alignItems: 'center' },
  acceptBtn: { backgroundColor: '#2E8B57' },
  rejectBtn: { backgroundColor: '#EF5350' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});