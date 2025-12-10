import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  StatusBar,
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import * as Location from 'expo-location';
import { fetchWeatherByCoords } from '../../api/weather';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

// --- MODIFIED HELPER FUNCTION ---
const processForecastData = (forecastList) => {
  if (!forecastList || forecastList.length === 0) return [];

  const dailyData = {};

  forecastList.forEach(item => {
    const date = item.dt_txt.split(' ')[0]; // 'YYYY-MM-DD'
    
    if (!dailyData[date]) {
      dailyData[date] = {
        minTemp: item.main.temp_min,
        maxTemp: item.main.temp_max,
        weather: item.weather[0],
        dateObj: new Date(item.dt * 1000),
        hourly: [item] // --- NEW: Start array with first item ---
      };
    } else {
      dailyData[date].minTemp = Math.min(dailyData[date].minTemp, item.main.temp_min);
      dailyData[date].maxTemp = Math.max(dailyData[date].maxTemp, item.main.temp_max);
      dailyData[date].hourly.push(item); // --- NEW: Add subsequent items ---
    }
  });

  return Object.values(dailyData).slice(0, 5);
};

export default function WeatherForecastScreen({ navigation }) { // Added navigation prop
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadWeather = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      const data = await fetchWeatherByCoords(latitude, longitude);
      setWeatherData(data);
      setErrorMsg(null);

    } catch (error) {
      setErrorMsg('Could not fetch weather data. Please check connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadWeather();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadWeather();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4FC3F7" />
        <Text style={styles.loadingText}>Loading Weather...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.centered}>
        <Ionicons name="cloud-offline-outline" size={60} color="#EF5350" />
        <Text style={styles.errorText}>{errorMsg}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadWeather}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!weatherData) return null;

  const { current, forecast } = weatherData;
  const processedForecast = processForecastData(forecast);
  const weatherIconUrl = `https://openweathermap.org/img/wn/${current.weather[0].icon}@4x.png`;

  return (
    <LinearGradient
      colors={['#4FC3F7', '#29B6F6', '#0288D1']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
      >
        {/* --- Header Section --- */}
        <View style={styles.header}>
          <Text style={styles.cityName}>{current.name}</Text>
          <Text style={styles.dateText}>{format(new Date(), 'EEEE, d MMMM')}</Text>
        </View>

        {/* --- Main Weather Card --- */}
        <View style={styles.mainCard}>
          <Image source={{ uri: weatherIconUrl }} style={styles.mainIcon} />
          <Text style={styles.currentTemp}>{Math.round(current.main.temp)}°</Text>
          <Text style={styles.weatherDesc}>{current.weather[0].description}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="water-outline" size={20} color="#fff" />
              <Text style={styles.statText}>{current.main.humidity}% Humidity</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="speedometer-outline" size={20} color="#fff" />
              <Text style={styles.statText}>{current.wind.speed} m/s Wind</Text>
            </View>
          </View>
        </View>

        {/* --- Forecast Section --- */}
        <Text style={styles.forecastHeader}>Next 5 Days (Tap for details)</Text>
        
        <View style={styles.forecastList}>
          {processedForecast.map((day, index) => {
            const dayIconUrl = `https://openweathermap.org/img/wn/${day.weather.icon}@2x.png`;
            return (
              <TouchableOpacity 
                key={index} 
                style={styles.forecastItem}
                // --- NEW: Navigate to details on press ---
                onPress={() => navigation.navigate('WeatherDetail', { dayData: day })}
              >
                <Text style={styles.dayName}>
                  {index === 0 ? 'Today' : format(day.dateObj, 'EEEE')}
                </Text>
                
                <View style={styles.forecastCenter}>
                  <Image source={{ uri: dayIconUrl }} style={styles.smallIcon} />
                  <Text style={styles.forecastDesc}>{day.weather.main}</Text>
                </View>

                <View style={styles.tempRange}>
                  <Text style={styles.maxTemp}>{Math.round(day.maxTemp)}°</Text>
                  <Text style={styles.minTemp}>{Math.round(day.minTemp)}°</Text>
                  <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" style={{marginLeft: 8}} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  loadingText: { marginTop: 10, color: '#555', fontSize: 16 },
  errorText: { fontSize: 16, color: '#555', textAlign: 'center', marginTop: 10, marginBottom: 20 },
  retryButton: {
    backgroundColor: '#0288D1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20
  },
  retryText: { color: '#fff', fontWeight: 'bold' },

  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  cityName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  dateText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 5,
  },

  mainCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 30,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 30,
  },
  mainIcon: { width: 180, height: 180, marginBottom: -20, marginTop: -20 },
  currentTemp: {
    fontSize: 80,
    fontWeight: 'bold',
    color: '#fff',
  },
  weatherDesc: {
    fontSize: 22,
    color: '#fff',
    textTransform: 'capitalize',
    marginBottom: 20,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  statText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },

  forecastHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    marginLeft: 5,
  },
  forecastList: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 15,
  },
  forecastItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    width: 80,
  },
  forecastCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  smallIcon: { width: 40, height: 40, marginRight: 5 },
  forecastDesc: { fontSize: 14, color: '#666' },
  
  tempRange: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80, // Slightly wider for icon
    justifyContent: 'flex-end',
  },
  maxTemp: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  minTemp: {
    fontSize: 16,
    color: '#999',
  },
});