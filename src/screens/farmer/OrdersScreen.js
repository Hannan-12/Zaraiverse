import React, { useEffect, useState, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../services/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
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

    // Query orders for the current user
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid)
      // Note: If you have indexing errors, remove orderBy temporarily or create the index in Firebase Console
      // orderBy('createdAt', 'desc') 
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Handle Firestore Timestamp safely
        createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : new Date()
      }));
      
      // Sort manually if index is missing (Newest first)
      ordersList.sort((a, b) => b.createdAt - a.createdAt);
      
      setOrders(ordersList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching orders:", error);
      Alert.alert("Error", "Could not load orders.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const renderOrderItem = ({ item }) => {
    // Generate a summary of items (e.g., "Wheat Seeds, Shovel + 1 more")
    const itemNames = item.items.map(i => i.name).join(', ');
    const summary = itemNames.length > 30 ? itemNames.substring(0, 30) + '...' : itemNames;

    // Determine status color
    let statusColor = '#FFA726'; // Pending (Orange)
    if (item.status === 'Shipped') statusColor = '#42A5F5'; // Blue
    if (item.status === 'Delivered') statusColor = '#66BB6A'; // Green
    if (item.status === 'Cancelled') statusColor = '#EF5350'; // Red

    return (
      <View style={styles.orderCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>Order #{item.id.slice(0, 8).toUpperCase()}</Text>
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
            <Ionicons name="cube-outline" size={16} color="#666" />
            <Text style={styles.itemsText}>{summary}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.footerRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>Rs. {item.totalAmount}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2E8B57" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>📜 My Orders</Text>
        <Text style={styles.subHeader}>Track your purchase history</Text>
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No orders placed yet.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerContainer: {
    padding: 20,
    backgroundColor: '#F8FFF9',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 5,
  },
  subHeader: {
    fontSize: 14,
    color: '#555',
  },
  list: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    overflow: 'hidden'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  orderId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333'
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  cardBody: {
    padding: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14
  },
  itemsText: {
    marginLeft: 8,
    color: '#333',
    fontSize: 14,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 10,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: '#555'
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E8B57'
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 10,
    color: '#999',
    fontSize: 16,
  },
});