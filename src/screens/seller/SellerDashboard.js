import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function SellerDashboard({ navigation }) {
  // Added a 'color' property to each item for styling the cards
  const menuItems = [
    {
      title: 'Add New Product',
      icon: 'add-box',
      screen: 'PostProduct',
      color: '#4CAF50',
    },
    {
      title: 'Manage Products',
      icon: 'inventory',
      screen: 'ManageProducts',
      color: '#388E3C',
    },
    {
      title: 'Manage Orders',
      icon: 'receipt-long',
      screen: 'SellerOrders',
      color: '#2E7D32',
    },
    {
      title: 'Manage Shipment',
      icon: 'local-shipping',
      screen: 'ManageShipment',
      color: '#1B5E20',
    },
    {
      title: 'Profile',
      icon: 'person',
      screen: 'Profile',
      color: '#66BB6A',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>📦 Seller Dashboard</Text>
      <Text style={styles.subtitle}>Manage your store efficiently</Text>

      {/* Grid container for the cards */}
      <View style={styles.grid}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.card, { backgroundColor: item.color }]}
            onPress={() => navigation.navigate(item.screen)}
          >
            <MaterialIcons name={item.icon} size={40} color="#fff" />
            <Text style={styles.cardText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FFF9',
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E8B57',
    textAlign: 'center', // Centered header
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center', // Centered subtitle
    marginBottom: 20,
    marginTop: 5,
  },
  // New grid style
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  // Updated card style
  card: {
    width: '48%', // Creates two columns
    height: 150, // Makes the cards more square
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  // Updated card text style
  cardText: {
    marginTop: 10,
    fontSize: 16,
    color: '#fff', // White text
    fontWeight: '600',
    textAlign: 'center',
  },
});
