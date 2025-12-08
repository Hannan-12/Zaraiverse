import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AdminAnalyticsScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="bar-chart" size={60} color="#9B59B6" />
      <Text style={styles.text}>System Analytics Module</Text>
      <Text style={styles.sub}>Graphs and reports will appear here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  text: { fontSize: 20, fontWeight: 'bold', marginTop: 20, color: '#333' },
  sub: { fontSize: 14, color: '#666', marginTop: 5 },
});