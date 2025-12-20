// src/screens/expert/ExpertDashboard.js
import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../contexts/AuthContext';
import { doc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';

export default function ExpertDashboard({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const [availability, setAvailability] = useState(user?.availability || 'Online');
  
  const [stats, setStats] = useState({
    solved: 0,
    rating: user?.rating || 0.0,
    respTime: 'N/A'
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!user) return;

    // 1. Fetch all completed requests for this specific expert
    const q = query(
      collection(db, 'expert_requests'), 
      where('expertId', '==', user.uid),
      where('status', '==', 'completed')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let totalMinutes = 0;
      let solvedCount = snapshot.docs.length;

      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        // Calculate difference between farmer request and expert response
        if (data.createdAt && data.respondedAt) {
          const start = data.createdAt.toDate();
          const end = data.respondedAt.toDate ? data.respondedAt.toDate() : new Date();
          const diffInMinutes = (end - start) / (1000 * 60);
          totalMinutes += diffInMinutes;
        }
      });

      // 2. Calculate Average minutes
      const avgMinutes = solvedCount > 0 ? Math.round(totalMinutes / solvedCount) : 0;
      
      let displayTime = 'N/A';
      if (solvedCount > 0) {
        displayTime = avgMinutes > 60 
          ? `${(avgMinutes / 60).toFixed(1)}h` 
          : `${avgMinutes}m`;
      }

      setStats({
        solved: solvedCount,
        rating: user?.rating || 0.0,
        respTime: displayTime
      });
      setLoadingStats(false);
    }, (error) => {
      console.error("Stats calculation error:", error);
      setLoadingStats(false);
    });

    return () => unsubscribe();
  }, [user]);

  const updateStatus = async (status) => {
    setAvailability(status);
    try {
      await updateDoc(doc(db, 'users', user.uid), { availability: status });
    } catch (e) { console.error("Status update error:", e); }
  };

  const menuItems = [
    { title: 'Pending Prescriptions', subtitle: 'Review queries', icon: 'medical-services', screen: 'PendingPrescriptions', color: '#4CAF50', iconLibrary: 'MaterialIcons' },
    { title: 'Chat with Farmers', subtitle: 'Real-time help', icon: 'chatbubble-ellipses', screen: 'ExpertChatList', color: '#2196F3', iconLibrary: 'Ionicons' },
    { title: 'Manage Profile', subtitle: 'Settings', icon: 'person', screen: 'Profile', color: '#FF9800', iconLibrary: 'Ionicons' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Welcome Back,</Text>
          <Text style={styles.name}>{user?.name || 'Expert'}</Text>
          <View style={styles.statusRow}>
            {['Online', 'Offline', 'Busy'].map((s) => (
              <TouchableOpacity key={s} onPress={() => updateStatus(s)} style={[styles.statusChip, availability === s && styles.activeChip]}>
                <Text style={[styles.statusText, availability === s && styles.activeStatusText]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color="#2E8B57" />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Performance Stats</Text>
      <View style={styles.statsContainer}>
        <View style={[styles.statBox, { borderLeftColor: '#4CAF50' }]}>
          {loadingStats ? <ActivityIndicator size="small" /> : <Text style={styles.statNumber}>{stats.solved}</Text>}
          <Text style={styles.statLabel}>Solved</Text>
        </View>
        <View style={[styles.statBox, { borderLeftColor: '#2196F3' }]}>
          <Text style={styles.statNumber}>{stats.rating}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={[styles.statBox, { borderLeftColor: '#FF9800' }]}>
          <Text style={styles.statNumber}>{stats.respTime}</Text>
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
  header: { backgroundColor: '#2E8B57', paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  greeting: { color: '#E8F5E9', fontSize: 14 },
  name: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  statusRow: { flexDirection: 'row', marginTop: 10 },
  statusChip: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15, marginRight: 8 },
  activeChip: { backgroundColor: '#fff' },
  statusText: { color: '#fff', fontSize: 12 },
  activeStatusText: { color: '#2E8B57', fontWeight: 'bold' },
  logoutBtn: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 3 },
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