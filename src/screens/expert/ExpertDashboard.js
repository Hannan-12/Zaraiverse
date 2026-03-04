// src/screens/expert/ExpertDashboard.js
import { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../contexts/AuthContext';
import { LanguageContext } from '../../contexts/LanguageContext';
import { doc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';

export default function ExpertDashboard({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const { t, language, setLanguage } = useContext(LanguageContext);

  const [availability, setAvailability] = useState(user?.availability || 'Online');
  const [stats, setStats] = useState({ solved: 0, rating: user?.rating || 0.0, respTime: 'N/A' });
  const [loadingStats, setLoadingStats] = useState(true);

  const toggleLanguage = () => setLanguage(language === 'en' ? 'ur' : 'en');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'expert_requests'),
      where('expertId', '==', user.uid),
      where('status', '==', 'completed')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let totalMinutes = 0;
      const solvedCount = snapshot.docs.length;

      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (data.createdAt && data.respondedAt) {
          const start = data.createdAt.toDate();
          const end = data.respondedAt.toDate ? data.respondedAt.toDate() : new Date();
          totalMinutes += (end - start) / (1000 * 60);
        }
      });

      const avgMinutes = solvedCount > 0 ? Math.round(totalMinutes / solvedCount) : 0;
      let displayTime = 'N/A';
      if (solvedCount > 0) {
        displayTime = avgMinutes > 60 ? `${(avgMinutes / 60).toFixed(1)}h` : `${avgMinutes}m`;
      }

      setStats({ solved: solvedCount, rating: user?.rating || 0.0, respTime: displayTime });
      setLoadingStats(false);
    }, (error) => {
      console.error('Stats calculation error:', error);
      setLoadingStats(false);
    });

    return () => unsubscribe();
  }, [user]);

  const updateStatus = async (status) => {
    setAvailability(status);
    try {
      await updateDoc(doc(db, 'users', user.uid), { availability: status });
    } catch (e) { console.error('Status update error:', e); }
  };

  const menuItems = [
    { titleKey: 'pendingPrescriptions', subtitleKey: 'reviewQueries',   icon: 'medical-services', screen: 'PendingPrescriptions', color: '#4CAF50', lib: 'MaterialIcons' },
    { titleKey: 'chatWithFarmers',      subtitleKey: 'realTimeHelp',    icon: 'chatbubble-ellipses', screen: 'ExpertChatList',    color: '#2196F3', lib: 'Ionicons' },
    { titleKey: 'manageProfile',        subtitleKey: 'settings',        icon: 'person',              screen: 'Profile',           color: '#FF9800', lib: 'Ionicons' },
  ];

  const statusKeys = ['online', 'offline', 'busy'];
  const statusValues = { online: 'Online', offline: 'Offline', busy: 'Busy' };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>{t('expertWelcome')}</Text>
          <Text style={styles.name}>{user?.name || 'Expert'}</Text>
          <View style={styles.statusRow}>
            {statusKeys.map((key) => {
              const val = statusValues[key];
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => updateStatus(val)}
                  style={[styles.statusChip, availability === val && styles.activeChip]}
                >
                  <Text style={[styles.statusText, availability === val && styles.activeStatusText]}>
                    {t(key)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={toggleLanguage} style={styles.langButton}>
            <Ionicons name="language" size={16} color="#2E8B57" />
            <Text style={styles.langText}>{language === 'en' ? 'اردو' : 'Eng'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={24} color="#2E8B57" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionTitle}>{t('performanceStats')}</Text>
      <View style={styles.statsContainer}>
        <View style={[styles.statBox, { borderLeftColor: '#4CAF50' }]}>
          {loadingStats ? <ActivityIndicator size="small" /> : <Text style={styles.statNumber}>{stats.solved}</Text>}
          <Text style={styles.statLabel}>{t('solved')}</Text>
        </View>
        <View style={[styles.statBox, { borderLeftColor: '#2196F3' }]}>
          <Text style={styles.statNumber}>{stats.rating}</Text>
          <Text style={styles.statLabel}>{t('rating')}</Text>
        </View>
        <View style={[styles.statBox, { borderLeftColor: '#FF9800' }]}>
          <Text style={styles.statNumber}>{stats.respTime}</Text>
          <Text style={styles.statLabel}>{t('respTime')}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>{t('dashboardMenu')}</Text>
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.card} onPress={() => navigation.navigate(item.screen)}>
            <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
              {item.lib === 'MaterialIcons'
                ? <MaterialIcons name={item.icon} size={30} color="#fff" />
                : <Ionicons name={item.icon} size={30} color="#fff" />}
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.cardTitle}>{t(item.titleKey)}</Text>
              <Text style={styles.cardSubtitle}>{t(item.subtitleKey)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { backgroundColor: '#2E8B57', paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  greeting: { color: '#E8F5E9', fontSize: 14 },
  name: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  statusRow: { flexDirection: 'row', marginTop: 10, flexWrap: 'wrap' },
  statusChip: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15, marginRight: 8, marginBottom: 4 },
  activeChip: { backgroundColor: '#fff' },
  statusText: { color: '#fff', fontSize: 12 },
  activeStatusText: { color: '#2E8B57', fontWeight: 'bold' },
  headerActions: { alignItems: 'flex-end', gap: 10 },
  langButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 7, paddingHorizontal: 12, borderRadius: 20, elevation: 3 },
  langText: { color: '#2E8B57', fontWeight: '700', marginLeft: 5, fontSize: 13 },
  logoutBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 3 },
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
