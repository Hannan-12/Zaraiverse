// src/screens/admin/AdminDashboard.js
import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { AuthContext } from '../../contexts/AuthContext';
import { collection, getCountFromServer } from 'firebase/firestore';
import { db } from '../../services/firebase';

export default function AdminDashboard({ navigation }) {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({ users: 0, products: 0, blogs: 0 });

  // Fetch some real counts (optional, adds realism)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const userSnap = await getCountFromServer(collection(db, 'users'));
        const productSnap = await getCountFromServer(collection(db, 'products'));
        // Assuming you might have a blogs collection later
        // const blogSnap = await getCountFromServer(collection(db, 'blogs')); 
        
        setStats({
          users: userSnap.data().count,
          products: productSnap.data().count,
          blogs: 5, // Placeholder if collection doesn't exist yet
        });
      } catch (e) {
        console.log("Error fetching stats:", e);
      }
    };
    fetchStats();
  }, []);

  const menuItems = [
    {
      title: 'Manage Users',
      subtitle: 'View, verify, or ban users',
      icon: 'users-cog', 
      screen: 'ManageUsers',
      color: '#4A90E2',
      lib: 'FontAwesome5'
    },
    {
      title: 'Manage Content',
      subtitle: 'Post blogs & moderate feed',
      icon: 'newspaper', 
      screen: 'ManageBlogs',
      color: '#E67E22',
      lib: 'Ionicons'
    },
    {
      title: 'System Analytics',
      subtitle: 'Performance & usage reports',
      icon: 'analytics', 
      screen: 'AdminAnalytics',
      color: '#9B59B6',
      lib: 'Ionicons'
    },
    {
      title: 'Admin Profile',
      subtitle: 'Account settings',
      icon: 'person-circle', 
      screen: 'Profile',
      color: '#34495E',
      lib: 'Ionicons'
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Admin Panel</Text>
          <Text style={styles.name}>{user?.email}</Text>
        </View>
        <Image 
          source={require('../../assets/ZaraiVerse.png')} 
          style={styles.logo} 
        />
      </View>

      {/* Stats Row */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.users}</Text>
          <Text style={styles.statLabel}>Users</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.products}</Text>
          <Text style={styles.statLabel}>Products</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.blogs}</Text>
          <Text style={styles.statLabel}>Blogs</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Administration</Text>

      {/* Menu Grid */}
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.card}
            onPress={() => navigation.navigate(item.screen)}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
              {item.lib === 'FontAwesome5' ? (
                <FontAwesome5 name={item.icon} size={24} color="#fff" />
              ) : (
                <Ionicons name={item.icon} size={28} color="#fff" />
              )}
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F2' },
  header: {
    backgroundColor: '#333',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: { color: '#FFD700', fontSize: 14, fontWeight: 'bold' },
  name: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  logo: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff' },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: -30,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    width: '30%',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  statNumber: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginLeft: 20, marginBottom: 15 },
  menuContainer: { paddingHorizontal: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  iconContainer: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  textContainer: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  cardSubtitle: { fontSize: 12, color: '#777', marginTop: 2 },
});