import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db } from '../../services/firebase';
import { collection, query, onSnapshot, doc, updateDoc, where } from 'firebase/firestore';
import { AuthContext } from '../../contexts/AuthContext';

export default function ManageShipment() {
  const { user } = useContext(AuthContext);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'orders'),
      where('sellerId', '==', user.uid),
      where('status', 'in', ['Processing', 'Shipped'])
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setShipments(snapshot.docs.map(d => ({ ...d.data(), id: d.id })));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Shipment fetch error:', err);
        setError('Could not load shipments. Please try again.');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  const handleUpdate = async (id, nextStatus) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status: nextStatus });
      Alert.alert('Status Updated', `Order is now ${nextStatus}`);
    } catch (err) {
      Alert.alert('Error', 'Could not update order status. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#42A5F5" />
        <Text style={styles.loadingText}>Loading shipments...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#e53935" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={shipments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={shipments.length === 0 ? styles.emptyContainer : { padding: 16 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="truck-check-outline" size={64} color="#B0BEC5" />
            <Text style={styles.emptyTitle}>No Active Shipments</Text>
            <Text style={styles.emptySubtitle}>
              Orders with "Processing" or "Shipped" status will appear here.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.sCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.sId}>Order #{item.id.slice(-6).toUpperCase()}</Text>
              <View style={[styles.statusBadge, item.status === 'Shipped' ? styles.badgeShipped : styles.badgeProcessing]}>
                <Text style={styles.statusBadgeText}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.sCust}>{item.customerName}</Text>
            <Text style={styles.sAddr}>{item.address || 'No address provided'}</Text>

            <View style={styles.btnRow}>
              {item.status === 'Processing' && (
                <TouchableOpacity
                  style={[styles.shipBtn, { backgroundColor: '#42A5F5' }]}
                  onPress={() => handleUpdate(item.id, 'Shipped')}
                >
                  <MaterialCommunityIcons name="truck-delivery" size={20} color="#fff" />
                  <Text style={styles.btnText}>Mark Shipped</Text>
                </TouchableOpacity>
              )}
              {item.status === 'Shipped' && (
                <TouchableOpacity
                  style={[styles.shipBtn, { backgroundColor: '#66BB6A' }]}
                  onPress={() => handleUpdate(item.id, 'Delivered')}
                >
                  <MaterialCommunityIcons name="check-all" size={20} color="#fff" />
                  <Text style={styles.btnText}>Mark Delivered</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, color: '#777', fontSize: 15 },
  errorText: { marginTop: 12, color: '#e53935', fontSize: 15, textAlign: 'center' },
  emptyContainer: { flex: 1 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#555', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  sCard: { backgroundColor: '#fff', borderRadius: 15, padding: 16, marginBottom: 15, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  sId: { fontWeight: 'bold', fontSize: 16 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  badgeProcessing: { backgroundColor: '#FFF3E0' },
  badgeShipped: { backgroundColor: '#E3F2FD' },
  statusBadgeText: { fontSize: 12, fontWeight: '600', color: '#555' },
  sCust: { fontSize: 14, color: '#333', fontWeight: '600' },
  sAddr: { color: '#777', fontSize: 13, marginVertical: 8 },
  btnRow: { marginTop: 10 },
  shipBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 12, borderRadius: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
});
