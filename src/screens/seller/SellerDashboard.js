import React, { useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../../contexts/AuthContext';

export default function SellerDashboard({ navigation }) {
  const { user } = useContext(AuthContext);

  const menuItems = [
    {
      title: 'Add Product',
      icon: 'add-box',
      screen: 'PostProduct',
      colors: ['#66BB6A', '#43A047'],
    },
    {
      title: 'Products',
      icon: 'inventory',
      screen: 'ManageProducts',
      colors: ['#388E3C', '#2E7D32'],
    },
    {
      title: 'Orders',
      icon: 'receipt-long',
      screen: 'SellerOrders',
      colors: ['#FFA726', '#FB8C00'],
    },
    {
      title: 'Shipments',
      icon: 'local-shipping',
      screen: 'ManageShipment',
      colors: ['#42A5F5', '#1E88E5'],
    },
    {
      title: 'Profile',
      icon: 'person',
      screen: 'Profile',
      colors: ['#AB47BC', '#8E24AA'],
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#2E8B57', '#1B5E20']} style={styles.headerGradient}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greetingText}>Salam, {user?.displayName || 'Seller'}! 📦</Text>
            <Text style={styles.subText}>Manage your store efficiently</Text>
          </View>
          <View style={styles.iconCircleHeader}>
            <MaterialIcons name="store" size={28} color="#2E8B57" />
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Business Hub</Text>
        <View style={styles.grid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.cardContainer}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.8}
            >
              <LinearGradient 
                colors={item.colors} 
                style={styles.cardGradient} 
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.iconCircle}>
                  <MaterialIcons name={item.icon} size={28} color={item.colors[1]} />
                </View>
                <Text style={styles.cardText}>{item.title}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  headerGradient: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 10 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greetingText: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 5 },
  subText: { fontSize: 14, color: '#E8F5E9', opacity: 0.9 },
  iconCircleHeader: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 3 },
  scrollContent: { padding: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  cardContainer: { width: '48%', height: 130, marginBottom: 16, borderRadius: 20, elevation: 5 },
  cardGradient: { flex: 1, borderRadius: 20, padding: 15, justifyContent: 'space-between', alignItems: 'flex-start' },
  iconCircle: { width: 45, height: 45, borderRadius: 23, backgroundColor: 'rgba(255, 255, 255, 0.9)', justifyContent: 'center', alignItems: 'center' },
  cardText: { fontSize: 16, fontWeight: '700', color: '#fff', marginTop: 10 },
});