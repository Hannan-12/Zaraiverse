import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function FarmerDashboard({ navigation }) {
  const dashboardItems = [
    {
      title: 'Crop Progress',
      icon: 'leaf-outline',
      screen: 'CropProgress',
      color: '#81C784',
    },
    {
      title: 'Request Prescription',
      icon: 'medkit-outline',
      screen: 'RequestPrescription',
      color: '#66BB6A',
    },
    {
      title: 'Knowledge Hub',
      icon: 'book-outline',
      screen: 'KnowledgeHub',
      color: '#4CAF50',
    },
    {
      title: 'Task Reminders',
      icon: 'alarm-outline',
      screen: 'TaskReminders',
      color: '#388E3C',
    },
    {
      title: 'Orders',
      icon: 'receipt-outline',
      screen: 'Orders',
      color: '#2E7D32',
    },
    {
      title: 'Analytics',
      icon: 'bar-chart-outline',
      screen: 'Analytics',
      color: '#1B5E20',
    },
    {
      title: 'Cart',
      icon: 'cart-outline',
      screen: 'Cart',
      color: '#4CAF50',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>🌾 Farmer Dashboard</Text>
      <Text style={styles.subText}>
        Manage your crops, analyze data, and explore buyer insights.
      </Text>

      <View style={styles.grid}>
        {dashboardItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.card, { backgroundColor: item.color }]}
            // Navigation logic remains simple and correct for these items
            onPress={() => navigation.navigate(item.screen)}
          >
            <Ionicons name={item.icon} size={40} color="#fff" />
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
    textAlign: 'center',
  },
  subText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    height: 140,
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
  cardText: {
    marginTop: 10,
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
});

