import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Sample data - these would be orders ready for shipping
const initialShipments = [
  {
    id: 'ORD-002',
    customerName: 'Jane Smith',
    address: '456 Oak Avenue, Townsville',
    status: 'Pending',
  },
  {
    id: 'ORD-005',
    customerName: 'Michael Johnson',
    address: '789 Pine Lane, Cityburg',
    status: 'Processing',
  },
  {
    id: 'ORD-006',
    customerName: 'Jessica Williams',
    address: '101 Maple Drive, Villagetown',
    status: 'Pending',
  },
];

// Helper to get color and icon based on status
const getStatusDetails = (status) => {
  switch (status) {
    case 'Pending':
      return { color: '#FFA726', icon: 'clock-time-three-outline' }; // Orange
    case 'Processing':
      return { color: '#42A5F5', icon: 'cogs' }; // Blue
    case 'Shipped':
      return { color: '#66BB6A', icon: 'check-circle-outline' }; // Green
    default:
      return { color: '#BDBDBD', icon: 'help-circle-outline' }; // Grey
  }
};

export default function ManageShipment({ navigation }) {
  const [shipments, setShipments] = useState(initialShipments);

  const handleMarkAsShipped = (shipmentId) => {
    Alert.alert(
      'Confirm Shipment',
      'Are you sure you want to mark this order as shipped?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            setShipments(
              shipments.map((shipment) =>
                shipment.id === shipmentId
                  ? { ...shipment, status: 'Shipped' }
                  : shipment
              )
            );
          },
        },
      ]
    );
  };

  const renderShipment = ({ item }) => {
    const statusDetails = getStatusDetails(item.status);
    return (
      <View style={styles.shipmentCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>Order #{item.id}</Text>
          <View style={styles.statusContainer}>
            <MaterialCommunityIcons
              name={statusDetails.icon}
              size={16}
              color={statusDetails.color}
            />
            <Text style={[styles.statusText, { color: statusDetails.color }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={20} color="#555" />
            <Text style={styles.detailText}>{item.customerName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={20} color="#555" />
            <Text style={styles.detailText} numberOfLines={1}>
              {item.address}
            </Text>
          </View>
        </View>

        {item.status !== 'Shipped' && (
          <TouchableOpacity
            style={styles.shipButton}
            onPress={() => handleMarkAsShipped(item.id)}
          >
            <MaterialCommunityIcons
              name="truck-delivery-outline"
              size={20}
              color="#fff"
            />
            <Text style={styles.shipButtonText}>Mark as Shipped</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={shipments}
        renderItem={renderShipment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No pending shipments.</Text>
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
  shipmentCard: {
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
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '600',
  },
  cardBody: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  detailText: {
    fontSize: 15,
    color: '#444',
    marginLeft: 10,
    flex: 1,
  },
  shipButton: {
    backgroundColor: '#2E8B57',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shipButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#777',
  },
});
