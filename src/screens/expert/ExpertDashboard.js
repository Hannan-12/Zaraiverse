import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../contexts/AuthContext';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';

export default function ExpertDashboard({ navigation }) {
  const { user } = useContext(AuthContext);
  const [availability, setAvailability] = useState(user?.availability || 'Online');

  const updateStatus = async (status) => {
    setAvailability(status);
    try {
      await updateDoc(doc(db, 'users', user.uid), { availability: status });
    } catch (e) {
      console.error("Error updating status:", e);
    }
  };

  const menuItems = [
    { title: 'Pending Prescriptions', subtitle: 'Review queries', icon: 'medical-services', screen: 'PendingPrescriptions', color: '#4CAF50', iconLibrary: 'MaterialIcons' },
    { title: 'Chat with Farmers', subtitle: 'Real-time help', icon: 'chatbubble-ellipses', screen: 'ExpertChatList', color: '#2196F3', iconLibrary: 'Ionicons' },
    { title: 'Manage Profile', subtitle: 'Settings', icon: 'person', screen: 'Profile', color: '#FF9800', iconLibrary: 'Ionicons' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome Back,</Text>
          <Text style={styles.name}>{user?.displayName || 'Expert'}</Text>
          
          {/* Status Picker UI */}
          <View style={styles.statusRow}>
            {['Online', 'Offline', 'Busy'].map((s) => (
              <TouchableOpacity 
                key={s} 
                onPress={() => updateStatus(s)}
                style={[styles.statusChip, availability === s && styles.activeChip]}
              >
                <Text style={[styles.statusText, availability === s && styles.activeStatusText]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <Image source={require('../../assets/ZaraiVerse.png')} style={styles.logo} />
      </View>

      {/* Performance Stats Section */}
      <Text style={styles.sectionTitle}>Performance Stats</Text>
      <View style={styles.statsContainer}>
        <View style={[styles.statBox, { borderLeftColor: '#4CAF50' }]}>
          <Text style={styles.statNumber}>24</Text>
          <Text style={styles.statLabel}>Solved</Text>
        </View>
        <View style={[styles.statBox, { borderLeftColor: '#2196F3' }]}>
          <Text style={styles.statNumber}>4.8</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={[styles.statBox, { borderLeftColor: '#FF9800' }]}>
          <Text style={styles.statNumber}>15m</Text>
          <Text style={styles.statLabel}>Resp. Time</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Dashboard Menu</Text>
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.card} onPress={() => navigation.navigate(item.screen)}>
            <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
              {item.iconLibrary === 'MaterialIcons' ? <MaterialIcons name={item.icon} size={30} color="#fff" /> : <Ionicons name={item.icon} size={30} color="#fff" />}
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
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { backgroundColor: '#2E8B57', paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { color: '#E8F5E9', fontSize: 14 },
  name: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  statusRow: { flexDirection: 'row', marginTop: 10 },
  statusChip: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15, marginRight: 8 },
  activeChip: { backgroundColor: '#fff' },
  statusText: { color: '#fff', fontSize: 12 },
  activeStatusText: { color: '#2E8B57', fontWeight: 'bold' },
  logo: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginLeft: 20, marginBottom: 12 },
  statsContainer: { flexDirection: 'row', paddingHorizontal: 20, justifyContent: 'space-between', marginBottom: 20 },
  statBox: { backgroundColor: '#fff', width: '30%', padding: 15, borderRadius: 12, alignItems: 'center', borderLeftWidth: 4, elevation: 2 },
  statNumber: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 12, color: '#777' },
  menuContainer: { paddingHorizontal: 20 },
  card: { backgroundColor: '#fff', borderRadius: 15, padding: 15, marginBottom: 15, flexDirection: 'row', alignItems: 'center', elevation: 3 },
  iconContainer: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  textContainer: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  cardSubtitle: { fontSize: 13, color: '#777' },
});