import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

export default function WeatherDetailScreen({ route }) {
  const { dayData } = route.params; // Receive the data passed from the previous screen

  const renderHourlyItem = ({ item }) => {
    const time = format(new Date(item.dt * 1000), 'h:mm a'); // e.g., 2:00 PM
    const iconUrl = `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`;

    return (
      <View style={styles.itemContainer}>
        {/* Time */}
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{time}</Text>
        </View>

        {/* Icon & Condition */}
        <View style={styles.conditionContainer}>
          <Image source={{ uri: iconUrl }} style={styles.icon} />
          <Text style={styles.conditionText}>{item.weather[0].main}</Text>
        </View>

        {/* Details: Temp, Wind, Humidity */}
        <View style={styles.detailsContainer}>
          <Text style={styles.tempText}>{Math.round(item.main.temp)}°</Text>
          <View style={styles.miniStats}>
            <View style={styles.miniStatItem}>
              <Ionicons name="water-outline" size={12} color="#fff" />
              <Text style={styles.miniStatText}>{item.main.humidity}%</Text>
            </View>
            <View style={styles.miniStatItem}>
              <Ionicons name="speedometer-outline" size={12} color="#fff" />
              <Text style={styles.miniStatText}>{Math.round(item.wind.speed)} m/s</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#4FC3F7', '#29B6F6', '#0288D1']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <Text style={styles.dateTitle}>{format(new Date(dayData.dateObj), 'EEEE, MMMM d')}</Text>
        <Text style={styles.subTitle}>Detailed Forecast (3-Hour Intervals)</Text>
      </View>

      <FlatList
        data={dayData.hourly}
        keyExtractor={(item) => item.dt.toString()}
        renderItem={renderHourlyItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    marginTop: 60,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  dateTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subTitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Glassmorphism
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  timeContainer: {
    width: 80,
  },
  timeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  conditionContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 40,
    height: 40,
    marginRight: 8,
  },
  conditionText: {
    fontSize: 16,
    color: '#fff',
    textTransform: 'capitalize',
  },
  detailsContainer: {
    alignItems: 'flex-end',
  },
  tempText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  miniStats: {
    flexDirection: 'row',
    marginTop: 4,
  },
  miniStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  miniStatText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 4,
  },
});
