import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ExpertChatList() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>💬 No active chats with farmers.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 16, color: '#555' },
});