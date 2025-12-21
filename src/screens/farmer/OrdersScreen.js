import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { AuthContext } from '../../contexts/AuthContext';
import { format } from 'date-fns';

export default function OrdersScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'orders'), where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersList = snapshot.docs.map(doc => {
        const data = doc.data();
        let dateObj = new Date();
        if (data.createdAt) {
          dateObj = typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : new Date(data.createdAt);
        }
        return { id: doc.id, ...data, createdAt: dateObj };
      });
      
      ordersList.sort((a, b) => b.createdAt - a.createdAt);
      setOrders(ordersList);
      setLoading(false);
    }, (error) => {
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const renderOrderItem = ({ item }) => {
    let summary = "";
    if (item.orderType === 'Lease') {
      summary = `Lease: ${item.productName || 'Machine'}`;
    } else {
      // ✅ FIX: Use optional chaining and fallback for items array
      const names = item.items ? item.items.map(i => i.name).join(', ') : 'Purchase Details';
      summary = names.length > 30 ? names.substring(0, 30) + '...' : names;
    }

    let statusColor = '#FFA726'; 
    if (['Processing', 'Downpayment Paid'].includes(item.status)) statusColor = '#2E8B57'; 
    if (item.status === 'Shipped') statusColor = '#42A5F5';
    if (item.status === 'Delivered') statusColor = '#66BB6A';
    if (item.status === 'Rejected') statusColor = '#EF5350';

    return (
      <View style={styles.orderCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>Order #{item.id.slice(-6).toUpperCase()}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.row}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.dateText}>{format(item.createdAt, 'MMM d, yyyy • h:mm a')}</Text>
          </View>
          
          <View style={styles.row}>
            <Ionicons name={item.orderType === 'Lease' ? "document-text-outline" : "cube-outline"} size={16} color="#666" />
            <Text style={styles.itemsText}>{summary}</Text>
          </View>

          {item.orderType === 'Lease' && (
            <Text style={styles.leasePrice}>Installment: Rs. {item.leaseDetails?.monthlyInstallment}/mo</Text>
          )}

          <View style={styles.divider} />

          <View style={styles.footerRow}>
            <Text style={styles.totalLabel}>{item.orderType === 'Lease' ? 'Total Price' : 'Amount'}</Text>
            <Text style={styles.totalAmount}>Rs. {item.totalAmount}</Text>
          </View>

          {/* Action button for Lease installments */}
          {item.orderType === 'Lease' && (item.status === 'Processing' || item.status === 'Downpayment Paid') && (
            <TouchableOpacity 
              style={styles.payBtn}
              onPress={() => navigation.navigate('LeasePayment', { order: item })}
            >
              <Text style={styles.payBtnText}>View Installment Schedule</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2E8B57" /></View>;

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No orders found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF9' },
  center: { flex: 1, justifyContent: 'center' },
  list: { padding: 16 },
  orderCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 16, elevation: 3, borderWidth: 1, borderColor: '#eee' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, backgroundColor: '#f9f9f9', borderBottomWidth: 1, borderBottomColor: '#eee' },
  orderId: { fontWeight: 'bold', fontSize: 14 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  cardBody: { padding: 15 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dateText: { marginLeft: 8, color: '#666', fontSize: 13 },
  itemsText: { marginLeft: 8, color: '#333', fontSize: 14, fontWeight: '600' },
  leasePrice: { color: '#2E8B57', fontSize: 12, fontWeight: 'bold', marginLeft: 24, marginTop: -5 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 13, color: '#777' },
  totalAmount: { fontSize: 18, fontWeight: 'bold', color: '#2E8B57' },
  payBtn: { backgroundColor: '#2E8B57', padding: 12, borderRadius: 10, marginTop: 15, alignItems: 'center' },
  payBtnText: { color: '#fff', fontWeight: 'bold' },
  empty: { textAlign: 'center', marginTop: 100, color: '#999' }
});