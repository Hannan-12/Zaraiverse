import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../services/firebase';
import { AuthContext } from '../../contexts/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

export default function MyCropsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'crops'),
      where('userId', '==', user.uid),
      where('status', '==', 'Growing')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cropsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          plantedDate: data.plantedDate?.toDate() || new Date(),
        };
      });
      cropsData.sort((a, b) => b.plantedDate - a.plantedDate);
      setCrops(cropsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const getHealthColor = (health) => {
    switch (health) {
      case 'Good': return '#4CAF50'; // Green
      case 'Moderate': return '#FFC107'; // Yellow/Orange
      case 'Poor': return '#F44336'; // Red
      default: return '#9E9E9E'; // Grey
    }
  };

  const renderCropItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.card}
      onPress={() => navigation.navigate('CropProgress', { crop: item })}
    >
      <View style={styles.cardContent}>
        {/* Left Side: Icon/Image Placeholder */}
        <View style={styles.iconContainer}>
          <Image 
            source={require('../../assets/ZaraiVerse.png')} // Fallback icon
            style={styles.cropIcon} 
          />
        </View>

        {/* Center: Details */}
        <View style={styles.infoContainer}>
          <Text style={styles.cropName}>{item.name}</Text>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={14} color="#777" />
            <Text style={styles.cropDate}>
              Planted: {format(item.plantedDate, 'MMM d, yyyy')}
            </Text>
          </View>
        </View>

        {/* Right Side: Health Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: getHealthColor(item.health) + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: getHealthColor(item.health) }]} />
          <Text style={[styles.statusText, { color: getHealthColor(item.health) }]}>
            {item.health}
          </Text>
        </View>
        
        <Ionicons name="chevron-forward" size={20} color="#ccc" style={{marginLeft: 10}} />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2E8B57" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Banner for Expert Help */}
      <LinearGradient
        colors={['#E8F5E9', '#FFFFFF']}
        style={styles.banner}
      >
        <View style={{flex: 1}}>
          <Text style={styles.bannerTitle}>Need Expert Advice?</Text>
          <Text style={styles.bannerText}>Get a prescription for your crops.</Text>
        </View>
        <TouchableOpacity
          style={styles.bannerButton}
          onPress={() => navigation.navigate('RequestPrescription')}
        >
          <Text style={styles.bannerButtonText}>Ask Now</Text>
        </TouchableOpacity>
      </LinearGradient>

      <Text style={styles.sectionHeader}>My Active Crops ({crops.length})</Text>

      <FlatList
        data={crops}
        keyExtractor={(item) => item.id}
        renderItem={renderCropItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="leaf-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No crops yet. Start planting!</Text>
          </View>
        }
      />

      {/* Modern Floating Action Button (FAB) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddCrop')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#2E8B57', '#1B5E20']}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  bannerTitle: { fontSize: 16, fontWeight: '700', color: '#2E8B57' },
  bannerText: { fontSize: 13, color: '#555', marginTop: 2 },
  bannerButton: {
    backgroundColor: '#2E8B57',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  bannerButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    padding: 15,
    // Modern Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#F1F8E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cropIcon: { width: 30, height: 30, resizeMode: 'contain' },
  
  infoContainer: { flex: 1 },
  cropName: { fontSize: 16, fontWeight: '700', color: '#333' },
  dateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  cropDate: { fontSize: 12, color: '#888', marginLeft: 4 },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: '600' },

  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#999', fontSize: 16, marginTop: 10 },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    borderRadius: 30,
    // Shadow for FAB
    shadowColor: '#2E8B57',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});