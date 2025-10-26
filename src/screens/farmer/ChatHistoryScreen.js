import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ChatHistoryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🕓 Chat History</Text>
      <Text style={styles.text}>View your previous conversations here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  text: { fontSize: 16, textAlign: 'center' },
});
