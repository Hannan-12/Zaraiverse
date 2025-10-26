import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Sample data - in a real app, this would come from your database
const initialOrders = [
  {
    id: 'ORD-001',
    customerName: 'John Doe',
    date: '2025-10-18',
    total: '25.49',
    status: 'Shipped',
  },
  {
    id: 'ORD-002',
    customerName: 'Jane Smith',
    date: '2025-10-17',
    total: '12.99',
    status: 'Pending',
  },
  {
    id: 'ORD-003',
    customerName: 'Sam Wilson',
    date: '2025-10-16',
    total: '45.00',
    status: 'Delivered',
  },
  {
    id: 'ORD-004',
    customerName: 'Emily Brown',
    date: '2025-10-15',
    total: '8.75',
    status: 'Cancelled',
  },
];

// Helper to get color based on status
const getStatusColor = (status) => {
  switch (status) {
    case 'Pending':
      return '#FFA726'; // Orange
    case 'Shipped':
      return '#42A5F5'; // Blue
    case 'Delivered':
      return '#66BB6A'; // Green
    case 'Cancelled':
      return '#EF5350'; // Red
    default:
      return '#BDBDBD'; // Grey
  }
};

export default function SellerOrders({ navigation }) {
  const [orders, setOrders] = useState(initialOrders);

  const handleViewDetails = (order) => {
    // For now, just show an alert. In a real app, you'd navigate
    // to an Order Details screen.
    Alert.alert(
      `Order #${order.id}`,
      `Customer: ${order.customerName}\nTotal: $${order.total}\nStatus: ${order.status}`
    );
  };

  const renderOrder = ({ item }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => handleViewDetails(item)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>Order #{item.id}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.detailRow}>
          <Ionicons name="person-circle-outline" size={20} color="#555" />
          <Text style={styles.customerName}>{item.customerName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={20} color="#555" />
          <Text style={styles.orderDate}>{item.date}</Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.orderTotal}>Total: ${item.total}</Text>
        <Ionicons name="chevron-forward" size={24} color="#2E8B57" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>You have no orders yet.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },
  list: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 10,
    marginBottom: 10,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  statusBadge: {
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardBody: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 15,
    color: '#444',
    marginLeft: 8,
  },
  orderDate: {
    fontSize: 15,
    color: '#444',
    marginLeft: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E8B57',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#777',
  },
});
