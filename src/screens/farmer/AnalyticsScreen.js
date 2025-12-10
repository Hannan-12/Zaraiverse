import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PieChart } from 'react-native-chart-kit';
import * as Location from 'expo-location';
import { differenceInDays } from 'date-fns';

// --- Firebase & Context ---
import { db } from '../../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { AuthContext } from '../../contexts/AuthContext';
import { fetchWeatherByCoords } from '../../api/weather';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [insights, setInsights] = useState([]);
  const [cropStats, setCropStats] = useState([]);
  const [weatherAlert, setWeatherAlert] = useState(null);

  // --- 1. Data Fetching ---
  const loadAnalytics = async () => {
    try {
      if (!user) return;

      // A. Fetch Crops
      const q = query(collection(db, 'crops'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const cropsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        plantedDate: doc.data().plantedDate.toDate()
      }));

      // B. Fetch Weather
      let weatherData = null;
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let location = await Location.getCurrentPositionAsync({});
        weatherData = await fetchWeatherByCoords(location.coords.latitude, location.coords.longitude);
      }

      // C. Generate Insights
      generateInsights(cropsData, weatherData);
      generateStats(cropsData);

    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  // --- 2. Logic Engines ---

  const generateStats = (crops) => {
    // Count status for Chart
    const active = crops.filter(c => c.status === 'Growing').length;
    const harvested = crops.filter(c => c.status === 'Harvested').length;
    
    // Prepare Data for Pie Chart
    const data = [
      {
        name: "Growing",
        population: active,
        color: "#4CAF50",
        legendFontColor: "#7F7F7F",
        legendFontSize: 12
      },
      {
        name: "Harvested",
        population: harvested,
        color: "#FFA726",
        legendFontColor: "#7F7F7F",
        legendFontSize: 12
      }
    ];
    
    // Only show chart if there is data
    setCropStats(active + harvested > 0 ? data : []);
  };

  const generateInsights = (crops, weather) => {
    const newInsights = [];
    const activeCrops = crops.filter(c => c.status === 'Growing');

    // --- A. Weather Based Insights ---
    if (weather) {
      const isRaining = weather.current.weather[0].main.toLowerCase().includes('rain');
      const temp = weather.current.main.temp;

      if (isRaining) {
        setWeatherAlert({
          type: 'Rain Alert',
          message: 'Rain detected. Skip irrigation today to save water and prevent root rot.',
          icon: 'umbrella',
          color: '#29B6F6' // Blue
        });
      } else if (temp > 35) {
        setWeatherAlert({
          type: 'High Heat',
          message: `Temperature is ${Math.round(temp)}°C. Ensure crops are well-watered to prevent heat stress.`,
          icon: 'thermometer',
          color: '#EF5350' // Red
        });
      } else {
        setWeatherAlert(null); // Clear alert if weather is normal
      }
    }

    // --- B. Crop Specific Insights ---
    activeCrops.forEach(crop => {
      const ageDays = differenceInDays(new Date(), crop.plantedDate);
      const cropName = crop.name.toLowerCase();

      // Rule: Wheat (Gandum)
      if (cropName.includes('wheat') || cropName.includes('gandum')) {
        if (ageDays >= 20 && ageDays <= 25) {
          newInsights.push({
            title: `Wheat Care (${ageDays} days)`,
            body: "Critical stage for Crown Root Initiation. Ensure first irrigation now for maximum yield.",
            type: 'water'
          });
        }
        if (ageDays > 50 && ageDays < 60) {
          newInsights.push({
            title: `Wheat Nutrition`,
            body: "Apply Nitrogen fertilizer (Urea) before booting stage to boost grain quality.",
            type: 'fertilizer'
          });
        }
      }

      // Rule: General Fertilizer (Early Stage)
      if (ageDays > 10 && ageDays < 30) {
        newInsights.push({
          title: `${crop.name} - Early Growth`,
          body: "Ensure weed control is done to prevent competition for nutrients.",
          type: 'warning'
        });
      }

      // Rule: Harvesting
      if (ageDays > 120) {
        newInsights.push({
          title: `${crop.name} - Harvest Ready?`,
          body: "This crop is over 4 months old. Check for maturity signs and plan harvesting.",
          type: 'harvest'
        });
      }
    });

    if (newInsights.length === 0) {
        newInsights.push({
            title: "All Looks Good",
            body: "No specific actions needed today based on your current crop data.",
            type: 'info'
        })
    }

    setInsights(newInsights);
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'water': return 'water';
      case 'fertilizer': return 'flask';
      case 'warning': return 'warning';
      case 'harvest': return 'cut';
      default: return 'information-circle';
    }
  };

  const getColorForType = (type) => {
    switch (type) {
      case 'water': return '#29B6F6';
      case 'fertilizer': return '#66BB6A';
      case 'warning': return '#FFA726';
      case 'harvest': return '#8D6E63';
      default: return '#78909C';
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2E8B57" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2E8B57" />}
    >
      <View style={styles.headerContainer}>
        <Text style={styles.header}>📊 Smart Analytics</Text>
        <Text style={styles.subHeader}>AI-driven insights for your farm</Text>
      </View>

      {/* --- 1. Weather Alert Card (Dynamic) --- */}
      {weatherAlert && (
        <LinearGradient
          colors={[weatherAlert.color, '#333']}
          start={{x: 0, y: 0}} end={{x: 1, y: 0}}
          style={styles.alertCard}
        >
          <Ionicons name={weatherAlert.icon} size={32} color="#fff" style={{marginRight: 15}} />
          <View style={{flex: 1}}>
            <Text style={styles.alertTitle}>{weatherAlert.type}</Text>
            <Text style={styles.alertBody}>{weatherAlert.message}</Text>
          </View>
        </LinearGradient>
      )}

      {/* --- 2. Crop Performance Chart --- */}
      {cropStats.length > 0 ? (
        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>Crop Distribution</Text>
          <PieChart
            data={cropStats}
            width={screenWidth - 60}
            height={200}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"15"}
            absolute
          />
        </View>
      ) : (
        <View style={styles.emptyChart}>
            <Text style={styles.emptyText}>Add crops to see distribution charts.</Text>
        </View>
      )}

      {/* --- 3. Prescriptive Insights List --- */}
      <Text style={styles.sectionHeader}>Actionable Insights</Text>
      
      {insights.map((item, index) => (
        <View key={index} style={styles.insightCard}>
          <View style={[styles.iconBox, { backgroundColor: getColorForType(item.type) + '20' }]}>
            <Ionicons name={getIconForType(item.type)} size={24} color={getColorForType(item.type)} />
          </View>
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>{item.title}</Text>
            <Text style={styles.insightBody}>{item.body}</Text>
          </View>
        </View>
      ))}

      <View style={{height: 30}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  headerContainer: { marginBottom: 20 },
  header: { fontSize: 28, fontWeight: '800', color: '#2E8B57' },
  subHeader: { fontSize: 14, color: '#666', marginTop: 2 },

  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 }
  },
  alertTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  alertBody: { fontSize: 14, color: '#eee', marginTop: 2 },

  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 15,
    marginBottom: 25,
    elevation: 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardTitle: { 
    fontSize: 16, fontWeight: '700', color: '#333', 
    alignSelf: 'flex-start', marginBottom: 10 
  },
  emptyChart: {
      padding: 20,
      alignItems: 'center',
      marginBottom: 20,
      backgroundColor: '#fff',
      borderRadius: 16
  },
  emptyText: { color: '#999' },

  sectionHeader: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 15 },

  insightCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    elevation: 1
  },
  iconBox: {
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  insightContent: { flex: 1 },
  insightTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  insightBody: { fontSize: 13, color: '#666', marginTop: 4, lineHeight: 18 },
});