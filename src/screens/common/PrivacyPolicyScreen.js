import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';

export default function PrivacyPolicyScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.text}>
        At ZaraiVerse, we are committed to protecting your agricultural data. We collect your name, email, and location to provide personalized weather updates and expert advice.{"\n\n"}
        Your data is never shared with third parties for marketing. We use industry-standard encryption for all transactions and chat history.
      </Text>
      <Text style={styles.title}>Data Security</Text>
      <Text style={styles.text}>
        We store images uploaded for prescriptions in secure cloud storage. You can request account deletion at any time through the support center.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10, color: '#2E8B57' },
  text: { fontSize: 14, color: '#444', lineHeight: 22 }
});