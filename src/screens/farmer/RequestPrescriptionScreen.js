import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function RequestExpertPrescriptionScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧑‍🌾 Expert Prescription</Text>
      <Text style={styles.text}>
        Request advice from agricultural experts and receive guidance on crop issues.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  text: { fontSize: 16, textAlign: 'center' },
});
