import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AnalyticsScreen({ navigation }) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>📈 Prescriptive Analytics</Text>
        <Text style={styles.subHeader}>
          Analyze your crop data to get predictions and performance insights.
        </Text>
      </View>

      {/* Example Analytics Cards */}
      <View style={styles.analyticsContainer}>
        <View style={styles.card}>
          <Ionicons name="stats-chart-outline" size={32} color="#2e7d32" />
          <Text style={styles.cardTitle}>Growth Prediction</Text>
          <Text style={styles.cardText}>
            Estimated yield for your current crop cycle based on past data.
          </Text>
        </View>

        <View style={styles.card}>
          <Ionicons name="leaf-outline" size={32} color="#2e7d32" />
          <Text style={styles.cardTitle}>Soil Health Insights</Text>
          <Text style={styles.cardText}>
            View soil condition and nutrient status recommendations.
          </Text>
        </View>

        <View style={styles.card}>
          <Ionicons name="cloud-outline" size={32} color="#2e7d32" />
          <Text style={styles.cardTitle}>Weather Impact</Text>
          <Text style={styles.cardText}>
            Analyze how upcoming weather patterns affect your crops.
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={20} color="#fff" />
        <Text style={styles.backText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  headerContainer: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 5,
    textAlign: 'center',
  },
  subHeader: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
  analyticsContainer: {
    marginBottom: 30,
  },
  card: {
    backgroundColor: '#f1f8f4',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderColor: '#c8e6c9',
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginTop: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#444',
    marginTop: 5,
  },
  backButton: {
    flexDirection: 'row',
    backgroundColor: '#2e7d32',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    width: '60%',
    marginBottom: 30,
  },
  backText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
});
