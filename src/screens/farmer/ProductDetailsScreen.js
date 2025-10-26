import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ProductDetailsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📦 Product Details</Text>
      <Text style={styles.text}>See details about a selected product here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  text: { fontSize: 16, textAlign: 'center' },
});
