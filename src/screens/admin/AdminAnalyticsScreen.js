// src/screens/admin/AdminAnalyticsScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  RefreshControl,
  Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { PieChart, LineChart } from 'react-native-chart-kit'; // Requires: npm install react-native-chart-kit react-native-svg

const screenWidth = Dimensions.get("window").width;

export default function AdminAnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Real stats from Firebase
  const [stats, setStats] = useState({
    farmers: 0,
    sellers: 0,
    experts: 0,
    admins: 0,
    products: 0,
    blogs: 0,
    activeCrops: 0,
  });

  const fetchAnalytics = async () => {
    try {
      // 1. Fetch Users & Segregate by Role
      const usersSnap = await getDocs(collection(db, 'users'));
      let farmers = 0, sellers = 0, experts = 0, admins = 0;
      
      usersSnap.forEach(doc => {
        const role = doc.data().role || 'farmer'; // Default to farmer if missing
        if (role === 'farmer') farmers++;
        else if (role === 'seller') sellers++;
        else if (role === 'expert') experts++;
        else if (role === 'admin') admins++;
      });

      // 2. Fetch Content Counts
      const productsSnap = await getDocs(collection(db, 'products'));
      const blogsSnap = await getDocs(collection(db, 'blogs'));
      const cropsSnap = await getDocs(collection(db, 'crops')); 

      setStats({
        farmers,
        sellers,
        experts,
        admins,
        products: productsSnap.size,
        blogs: blogsSnap.size,
        activeCrops: cropsSnap.size,
      });

    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAnalytics();
  }, []);

  // --- Chart Data Preparation ---
  const userDistributionData = [
    { name: "Farmers", population: stats.farmers, color: "#4CAF50", legendFontColor: "#7F7F7F", legendFontSize: 12 },
    { name: "Sellers", population: stats.sellers, color: "#2196F3", legendFontColor: "#7F7F7F", legendFontSize: 12 },
    { name: "Experts", population: stats.experts, color: "#FF9800", legendFontColor: "#7F7F7F", legendFontSize: 12 },
    { name: "Admins", population: stats.admins, color: "#34495E", legendFontColor: "#7F7F7F", legendFontSize: 12 },
  ].filter(item => item.population > 0); // Hide zero values

  // Mock data for "Activity Trend" (Since we don't store historical snapshots yet)
  const growthData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        data: [10, 25, 18, 30, 45, 50, stats.products + stats.blogs + 20], // Simulated trend ending near real activity
        color: (opacity = 1) => `rgba(155, 89, 182, ${opacity})`, 
        strokeWidth: 2 
      }
    ],
    legend: ["Platform Activity"]
  };

  const StatCard = ({ label, value, icon, color }) => (
    <View style={styles.statCard}>
      <View style={[styles.iconCircle, { backgroundColor: color + '20' }]}> 
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E8B57" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2E8B57"]} />}
    >
      <Text style={styles.headerTitle}>System Insights</Text>
      <Text style={styles.headerSubtitle}>Real-time data overview</Text>

      {/* --- SECTION 1: USER DISTRIBUTION PIE CHART --- */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>User Distribution</Text>
        {userDistributionData.length > 0 ? (
          <PieChart
            data={userDistributionData}
            width={screenWidth - 60}
            height={220}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"15"}
            absolute
          />
        ) : (
          <Text style={styles.noDataText}>No user data available yet.</Text>
        )}
      </View>

      {/* --- SECTION 2: QUICK STATS GRID --- */}
      <Text style={styles.sectionHeader}>Content Overview</Text>
      <View style={styles.statsGrid}>
        <StatCard label="Products" value={stats.products} icon="cart" color="#E91E63" />
        <StatCard label="Blogs" value={stats.blogs} icon="newspaper" color="#9B59B6" />
        <StatCard label="Active Crops" value={stats.activeCrops} icon="leaf" color="#2E7D32" />
        <StatCard label="Total Users" value={stats.farmers + stats.sellers + stats.experts + stats.admins} icon="people" color="#34495E" />
      </View>

      {/* --- SECTION 3: GROWTH LINE CHART --- */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Weekly Activity Trend</Text>
        <LineChart
          data={growthData}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundColor: "#fff",
            backgroundGradientFrom: "#fff",
            backgroundGradientTo: "#fff",
            decimalPlaces: 0, 
            color: (opacity = 1) => `rgba(155, 89, 182, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: { r: "5", strokeWidth: "2", stroke: "#9B59B6" }
          }}
          bezier
          style={{ marginVertical: 8, borderRadius: 16 }}
        />
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8', padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#1A1A1A', marginBottom: 5 },
  headerSubtitle: { fontSize: 14, color: '#666', marginBottom: 20 },

  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 15,
    marginBottom: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    alignItems: 'center'
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
    alignSelf: 'flex-start',
    width: '100%'
  },
  noDataText: { color: '#999', marginVertical: 20, fontStyle: 'italic' },

  sectionHeader: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 15 },
  
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 12, color: '#666' },
});