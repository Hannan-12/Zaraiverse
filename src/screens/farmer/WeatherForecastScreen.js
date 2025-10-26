// src/screens/farmer/WeatherForecastScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Image } from 'react-native';
import * as Location from 'expo-location';
import { fetchWeatherByCoords } from '../../api/weather';

// Helper function to process the 3-hour forecast data into a daily summary
const processForecastData = (forecastList) => {
  if (!forecastList || forecastList.length === 0) return [];

  const dailyData = {};

  forecastList.forEach(item => {
    const date = item.dt_txt.split(' ')[0]; // Get the date part 'YYYY-MM-DD'
    if (!dailyData[date]) {
      // If it's the first entry for this day, initialize it
      dailyData[date] = {
        minTemp: item.main.temp_min,
        maxTemp: item.main.temp_max,
        weather: item.weather[0], // Store the weather details
        dayName: new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
      };
    } else {
      // Update min and max temperatures for the day
      dailyData[date].minTemp = Math.min(dailyData[date].minTemp, item.main.temp_min);
      dailyData[date].maxTemp = Math.max(dailyData[date].maxTemp, item.main.temp_max);
    }
  });

  // Convert the dailyData object back to an array
  return Object.values(dailyData);
};


export default function WeatherForecastScreen() {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setLoading(false);
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        const data = await fetchWeatherByCoords(latitude, longitude);
        setWeatherData(data);

      } catch (error) {
        setErrorMsg('Could not fetch weather data. Please check your connection or API key.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#2e7d32" /><Text style={styles.loadingText}>Fetching weather...</Text></View>;
  }

  if (errorMsg) {
    return <View style={styles.container}><Text style={styles.errorText}>{errorMsg}</Text></View>;
  }

  if (!weatherData) return null;

  const { current, forecast } = weatherData;
  const processedForecast = processForecastData(forecast);
  const weatherIconUrl = `https://openweathermap.org/img/wn/${current.weather[0].icon}@4x.png`;

  return (
    <ScrollView style={styles.outerContainer} contentContainerStyle={styles.container}>
      <Text style={styles.locationText}>{current.name}</Text>
      
      <View style={styles.currentWeatherCard}>
        <Image source={{ uri: weatherIconUrl }} style={styles.weatherIcon} />
        <Text style={styles.tempText}>{Math.round(current.main.temp)}°C</Text>
        <Text style={styles.descriptionText}>{current.weather[0].description}</Text>
      </View>
      
      <Text style={styles.forecastHeader}>5-Day Forecast</Text>
      {processedForecast.map((day, index) => {
        const dayIconUrl = `https://openweathermap.org/img/wn/${day.weather.icon}@2x.png`;
        return (
          <View key={index} style={styles.forecastItem}>
            <Text style={styles.forecastDay}>{index === 0 ? 'Today' : day.dayName}</Text>
            <Image source={{ uri: dayIconUrl }} style={styles.forecastIcon} />
            <Text style={styles.forecastTemp}>{Math.round(day.minTemp)}° / {Math.round(day.maxTemp)}°</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#F8F9FA' },
  container: { padding: 16, alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#555' },
  errorText: { fontSize: 16, color: 'red', textAlign: 'center' },
  locationText: { fontSize: 26, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  currentWeatherCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
    marginBottom: 25,
  },
  weatherIcon: { width: 150, height: 150 },
  tempText: { fontSize: 64, fontWeight: 'bold', color: '#2e7d32' },
  descriptionText: { fontSize: 18, color: '#555', textTransform: 'capitalize' },
  forecastHeader: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10, alignSelf: 'flex-start' },
  forecastItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 8,
  },
  forecastDay: { fontSize: 16, color: '#333', flex: 1 },
  forecastIcon: { width: 40, height: 40 },
  forecastTemp: { fontSize: 16, fontWeight: 'bold', color: '#2e7d32', textAlign: 'right', flex: 1 },
});