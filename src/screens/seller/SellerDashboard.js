import { useContext, useState, useEffect } from 'react';
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
import { LanguageContext } from '../../contexts/LanguageContext';
import { db } from '../../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function SellerDashboard({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const { t, language, setLanguage } = useContext(LanguageContext);

  const [stats, setStats] = useState({ totalProducts: 0, activeOrders: 0, revenue: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  const toggleLanguage = () => setLanguage(language === 'en' ? 'ur' : 'en');

  useEffect(() => {
    if (!user) return;

    const qProducts = query(collection(db, 'products'), where('sellerId', '==', user.uid));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      setStats(prev => ({ ...prev, totalProducts: snapshot.size }));
    });

    const qOrders = query(collection(db, 'orders'), where('sellerId', '==', user.uid));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      let active = 0;
      let totalRev = 0;

      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (['Pending', 'Processing', 'Awaiting Downpayment', 'Confirmed', 'Active'].includes(data.status)) {
          active++;
        }
        if (data.orderType === 'Rental') {
          if (['Active', 'Returned'].includes(data.status)) totalRev += parseFloat(data.totalAmount) || 0;
        } else if (data.orderType === 'Lease') {
          if (['Active', 'Delivered'].includes(data.status)) {
            const dp = parseFloat(data.leaseDetails?.downpayment) || 0;
            const monthly = parseFloat(data.leaseDetails?.monthlyInstallment) || 0;
            const installmentsPaid = parseInt(data.paidInstallments) || 0;
            totalRev += dp + (monthly * installmentsPaid);
          }
        } else {
          if (data.status === 'Delivered') totalRev += parseFloat(data.totalAmount) || 0;
        }
      });

      setStats(prev => ({ ...prev, activeOrders: active, revenue: totalRev }));
      setLoadingStats(false);
    }, (error) => {
      console.error('Stats Error:', error);
      setLoadingStats(false);
    });

    return () => { unsubProducts(); unsubOrders(); };
  }, [user]);

  const menuItems = [
    { key: 'addProduct',  icon: 'add-box',         screen: 'PostProduct',     colors: ['#66BB6A', '#43A047'] },
    { key: 'products',    icon: 'inventory',        screen: 'ManageProducts',  colors: ['#388E3C', '#2E7D32'] },
    { key: 'orders',      icon: 'receipt-long',     screen: 'SellerOrders',    colors: ['#FFA726', '#FB8C00'] },
    { key: 'shipments',   icon: 'local-shipping',   screen: 'ManageShipment',  colors: ['#42A5F5', '#1E88E5'] },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={['#2E8B57', '#1B5E20']} style={styles.headerGradient}>
        <View style={styles.headerContent}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greetingText}>Salam, {user?.name || 'Seller'}! 👋</Text>
            <Text style={styles.subText}>{t('sellerWelcome')}</Text>
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
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <Text style={styles.sectionTitle}>{t('storePerformance')}</Text>
        <View style={styles.statsContainer}>
          <View style={[styles.statBox, { borderLeftColor: '#4CAF50' }]}>
            {loadingStats ? <ActivityIndicator size="small" /> : <Text style={styles.statNumber}>{stats.totalProducts}</Text>}
            <Text style={styles.statLabel}>{t('listings')}</Text>
          </View>
          <View style={[styles.statBox, { borderLeftColor: '#FFA726' }]}>
            {loadingStats ? <ActivityIndicator size="small" /> : <Text style={styles.statNumber}>{stats.activeOrders}</Text>}
            <Text style={styles.statLabel}>{t('activeOrders')}</Text>
          </View>
          <View style={[styles.statBox, { borderLeftColor: '#2196F3' }]}>
            {loadingStats ? <ActivityIndicator size="small" /> : <Text style={styles.statNumber}>Rs. {stats.revenue.toLocaleString()}</Text>}
            <Text style={styles.statLabel}>{t('totalEarned')}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('quickActions')}</Text>
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
                <Text style={styles.cardText}>{t(item.key)}</Text>
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
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.iconCircle}>
                <Ionicons name="person" size={28} color="#8E24AA" />
              </View>
              <Text style={styles.cardText}>{t('myProfileCard')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
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
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  langButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 7, paddingHorizontal: 12, borderRadius: 20, elevation: 3 },
  langText: { color: '#2E8B57', fontWeight: '700', marginLeft: 5, fontSize: 13 },
  logoutBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 3 },
  scrollContent: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15, marginTop: 10 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  statBox: { backgroundColor: '#fff', width: '31%', padding: 12, borderRadius: 15, alignItems: 'center', borderLeftWidth: 5, elevation: 4 },
  statNumber: { fontSize: 13, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  statLabel: { fontSize: 11, color: '#777', marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  cardContainer: { width: '48%', height: 130, marginBottom: 16, borderRadius: 20, elevation: 5 },
  cardGradient: { flex: 1, borderRadius: 20, padding: 15, justifyContent: 'space-between', alignItems: 'flex-start' },
  iconCircle: { width: 45, height: 45, borderRadius: 23, backgroundColor: 'rgba(255, 255, 255, 0.9)', justifyContent: 'center', alignItems: 'center' },
  cardText: { fontSize: 16, fontWeight: '700', color: '#fff', marginTop: 10 },
});
