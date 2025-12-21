// src/screens/seller/SellerOrders.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../services/firebase';
import { collection, query, onSnapshot, doc, updateDoc, where } from 'firebase/firestore';
import { AuthContext } from '../../contexts/AuthContext';
import { useContext } from 'react';

export default function SellerOrders() {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Fetches orders where this user is the seller
    const q = query(collection(db, 'orders'), where('sellerId', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersList = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setOrders(ordersList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching seller orders:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleStatusUpdate = async (order, newStatus) => {
    const action = newStatus === 'Processing' ? 'Accept' : 'Reject';
    
    // Logic: If it's a Lease and we are accepting, move to 'Awaiting Downpayment'
    const finalStatus = (newStatus === 'Processing' && order.orderType === 'Lease') 
      ? 'Awaiting Downpayment' 
      : newStatus;

    Alert.alert(
      `${action} Request`,
      `Are you sure you want to ${action.toLowerCase()} this ${order.orderType || 'order'}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Yes", 
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'orders', order.id), { status: finalStatus });
              Alert.alert("Success", `Request has been marked as ${finalStatus}.`);
            } catch (e) { 
              Alert.alert("Error", "Update failed. Check your connection."); 
            }
          }
        }
      ]
    );
  };

  const renderOrder = ({ item }) => {
    // Dynamic color for the status badge
    let statusColor = '#FFA726'; // Default (Pending)
    if (item.status === 'Awaiting Downpayment' || item.status === 'Processing') statusColor = '#2E8B57';
    if (item.status === 'Active') statusColor = '#42A5F5';
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
        
        {/* Customer Info */}
        <View style={styles.userInfo}>
            <Ionicons name="person-outline" size={16} color="#666" />
            <Text style={styles.customerText}>{item.userName || 'Unknown Farmer'}</Text>
        </View>

        {/* Content based on Order Type */}
        {item.orderType === 'Lease' ? (
          <View style={styles.leaseBox}>
            <Text style={styles.productName}>{item.productName}</Text>
            <View style={styles.leaseDetailRow}>
                <Text style={styles.leaseDetail}>Plan: {item.leaseDetails?.duration} Months</Text>
                <Text style={styles.leaseDetail}>Monthly: Rs. {item.leaseDetails?.monthlyInstallment}</Text>
            </View>
            <Text style={styles.leaseDetail}>Downpayment: Rs. {item.leaseDetails?.downpayment}</Text>
          </View>
        ) : (
          <View style={styles.standardOrderBox}>
             <Text style={styles.productName}>{item.productName || 'Purchase'}</Text>
             <Text style={styles.price}>Total: Rs. {item.totalAmount}</Text>
          </View>
        )}

        {/* Action buttons shown only for "Pending" requests */}
        {item.status === 'Pending' && (
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.acceptBtn]} 
              onPress={() => handleStatusUpdate(item, 'Processing')}
            >
              <Text style={styles.btnText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.rejectBtn]} 
              onPress={() => handleStatusUpdate(item, 'Rejected')}
            >
              <Text style={styles.btnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) return (
    <View style={styles.center}>
        <ActivityIndicator size="large" color="#2E8B57" />
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList 
        data={orders} 
        renderItem={renderOrder} 
        keyExtractor={item => item.id}
        contentContainerStyle={{padding: 16}} 
        ListEmptyComponent={<Text style={styles.empty}>No orders or lease requests found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  orderCard: { backgroundColor: '#fff', borderRadius: 15, padding: 16, marginBottom: 15, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  orderId: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  userInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  customerText: { color: '#555', marginLeft: 8, fontSize: 14 },
  leaseBox: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 10, marginVertical: 5, borderLeftWidth: 4, borderLeftColor: '#2E8B57' },
  productName: { fontWeight: 'bold', color: '#333', fontSize: 15, marginBottom: 5 },
  leaseDetailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  leaseDetail: { fontSize: 13, color: '#666' },
  standardOrderBox: { paddingVertical: 5 },
  price: { fontWeight: 'bold', color: '#2E8B57', fontSize: 16, marginTop: 5 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  actionBtn: { flex: 0.48, padding: 12, borderRadius: 10, alignItems: 'center' },
  acceptBtn: { backgroundColor: '#2E8B57' },
  rejectBtn: { backgroundColor: '#EF5350' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' }
});