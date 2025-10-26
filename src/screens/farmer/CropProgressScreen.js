import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CropProgressScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌾 Crop Progress</Text>
      <Text style={styles.text}>Monitor your crop growth and health here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  text: { fontSize: 16, textAlign: 'center' },
});
