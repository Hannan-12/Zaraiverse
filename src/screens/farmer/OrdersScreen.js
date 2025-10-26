import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function OrdersScreen({ navigation }) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>📜 My Orders</Text>
        <Text style={styles.subHeader}>Track your placed and delivered orders here.</Text>
      </View>

      <View style={styles.ordersContainer}>
        {/* Example Orders — You can replace these with dynamic data */}
        <View style={styles.orderCard}>
          <Ionicons name="cart-outline" size={30} color="#2e7d32" />
          <View style={styles.orderInfo}>
            <Text style={styles.orderTitle}>Organic Wheat Seeds</Text>
            <Text style={styles.orderStatus}>Status: Delivered ✅</Text>
          </View>
        </View>

        <View style={styles.orderCard}>
          <Ionicons name="cart-outline" size={30} color="#2e7d32" />
          <View style={styles.orderInfo}>
            <Text style={styles.orderTitle}>Pesticide Spray Kit</Text>
            <Text style={styles.orderStatus}>Status: In Transit 🚚</Text>
          </View>
        </View>

        <View style={styles.orderCard}>
          <Ionicons name="cart-outline" size={30} color="#2e7d32" />
          <View style={styles.orderInfo}>
            <Text style={styles.orderTitle}>Fertilizer Pack</Text>
            <Text style={styles.orderStatus}>Status: Pending 🕒</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={20} color="#fff" />
        <Text style={styles.backText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  headerContainer: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 5,
  },
  subHeader: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
  ordersContainer: {
    marginBottom: 30,
  },
  orderCard: {
    flexDirection: 'row',
    backgroundColor: '#f1f8f4',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderColor: '#c8e6c9',
    borderWidth: 1,
  },
  orderInfo: {
    marginLeft: 15,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  orderStatus: {
    fontSize: 14,
    color: '#444',
  },
  backButton: {
    flexDirection: 'row',
    backgroundColor: '#2e7d32',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    width: '60%',
    marginBottom: 30,
  },
  backText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
});
