import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { db } from '../../services/firebase';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'orders'));
    return onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      setLoading(false);
    });
  }, []);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      Alert.alert("Success", `Order is now ${newStatus}`);
    } catch (e) {
      Alert.alert("Error", "Failed to update order status.");
    }
  };

  const renderOrder = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>Order #{item.id.slice(-6).toUpperCase()}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.detailRow}><Ionicons name="person-outline" size={18}/><Text style={styles.text}>{item.customerName}</Text></View>
      <View style={styles.detailRow}><Ionicons name="cash-outline" size={18}/><Text style={styles.price}>Rs. {item.total}</Text></View>

      {item.status === 'Pending' && (
        <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus(item.id, 'Processing')}>
          <MaterialCommunityIcons name="cog" size={20} color="#fff" />
          <Text style={styles.btnText}>Accept & Process</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const getStatusColor = (s) => s === 'Pending' ? '#FFA726' : s === 'Processing' ? '#42A5F5' : '#66BB6A';

  if (loading) return <ActivityIndicator size="large" color="#2E8B57" style={{marginTop: 50}}/>;

  return (
    <View style={styles.container}>
      <FlatList data={orders} renderItem={renderOrder} contentContainerStyle={{padding: 16}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F6' },
  orderCard: { backgroundColor: '#fff', borderRadius: 15, padding: 16, marginBottom: 15, elevation: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10, marginBottom: 10 },
  orderId: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  text: { marginLeft: 10, color: '#555' },
  price: { marginLeft: 10, fontWeight: 'bold', color: '#2E8B57' },
  actionBtn: { backgroundColor: '#2E8B57', flexDirection: 'row', justifyContent: 'center', padding: 12, borderRadius: 10, marginTop: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 }
});