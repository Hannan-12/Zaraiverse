import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../../contexts/AuthContext';
import { db } from '../../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function SellerDashboard({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeOrders: 0,
    revenue: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!user) return;

    // 1. Listen for Product Count
    const qProducts = query(
      collection(db, 'products'),
      where('sellerId', '==', user.uid)
    );

    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      setStats(prev => ({ ...prev, totalProducts: snapshot.size }));
    });

    // 2. Listen for Orders (Active count and Total Revenue)
    const qOrders = query(
      collection(db, 'orders'),
      where('sellerId', '==', user.uid)
    );

    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      let active = 0;
      let totalRev = 0;

      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();

        // --- Active Orders Logic ---
        // Orders are active if they are Pending, Processing, or have a Paid Downpayment but aren't Delivered yet.
        if (['Pending', 'Processing', 'Downpayment Paid'].includes(data.status)) {
          active++;
        }

        // --- Revenue Calculation Logic ---
        // 1. For Regular Purchases: Add total if Delivered
        if (data.orderType !== 'Lease' && data.status === 'Delivered') {
          totalRev += parseFloat(data.totalAmount) || 0;
        }
        
        // 2. For Lease Orders: Add the Downpayment to revenue once it is paid
        if (data.orderType === 'Lease' && (data.status === 'Downpayment Paid' || data.status === 'Delivered')) {
          const dp = parseFloat(data.leaseDetails?.downpayment) || 0;
          totalRev += dp;
          
          // Note: If you add installment payment features later, you would add them here too.
        }
      });

      setStats(prev => ({
        ...prev,
        activeOrders: active,
        revenue: totalRev,
      }));
      setLoadingStats(false);
    }, (error) => {
      console.error("Stats Error:", error);
      setLoadingStats(false);
    });

    return () => {
      unsubProducts();
      unsubOrders();
    };
  }, [user]);

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
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient colors={['#2E8B57', '#1B5E20']} style={styles.headerGradient}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greetingText}>Salam, {user?.name || 'Seller'}! 👋</Text>
            <Text style={styles.subText}>Manage your store and track growth</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={24} color="#2E8B57" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.sectionTitle}>Store Performance</Text>
        <View style={styles.statsContainer}>
          <View style={[styles.statBox, { borderLeftColor: '#4CAF50' }]}>
            {loadingStats ? <ActivityIndicator size="small" /> : <Text style={styles.statNumber}>{stats.totalProducts}</Text>}
            <Text style={styles.statLabel}>Listings</Text>
          </View>
          <View style={[styles.statBox, { borderLeftColor: '#FFA726' }]}>
            {loadingStats ? <ActivityIndicator size="small" /> : <Text style={styles.statNumber}>{stats.activeOrders}</Text>}
            <Text style={styles.statLabel}>Active Orders</Text>
          </View>
          <View style={[styles.statBox, { borderLeftColor: '#2196F3' }]}>
            {loadingStats ? <ActivityIndicator size="small" /> : <Text style={styles.statNumber}>Rs. {stats.revenue}</Text>}
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
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
          
          <TouchableOpacity
            style={styles.cardContainer}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.8}
          >
            <LinearGradient 
              colors={['#AB47BC', '#8E24AA']} 
              style={styles.cardGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <View style={styles.iconCircle}>
                <Ionicons name="person" size={28} color="#8E24AA" />
              </View>
              <Text style={styles.cardText}>My Profile</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <View style={{height: 20}} />
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
  logoutBtn: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 3 },
  scrollContent: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15, marginTop: 10 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  statBox: { backgroundColor: '#fff', width: '31%', padding: 12, borderRadius: 15, alignItems: 'center', borderLeftWidth: 5, elevation: 4 },
  statNumber: { fontSize: 14, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  statLabel: { fontSize: 11, color: '#777', marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  cardContainer: { width: '48%', height: 130, marginBottom: 16, borderRadius: 20, elevation: 5 },
  cardGradient: { flex: 1, borderRadius: 20, padding: 15, justifyContent: 'space-between', alignItems: 'flex-start' },
  iconCircle: { width: 45, height: 45, borderRadius: 23, backgroundColor: 'rgba(255, 255, 255, 0.9)', justifyContent: 'center', alignItems: 'center' },
  cardText: { fontSize: 16, fontWeight: '700', color: '#fff', marginTop: 10 },
});