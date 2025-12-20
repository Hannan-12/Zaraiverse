import React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HelpCenterScreen() {
  const faqs = [
    { q: "How do I request a prescription?", a: "Go to your Dashboard and click 'Ask an Expert'. Fill in the details and attach a photo." },
    { q: "How long does approval take?", a: "Admin approvals typically take 24-48 hours." },
    { q: "Can I sell products as a farmer?", a: "No, you must register as a 'Seller' to list products in the marketplace." }
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Common Questions</Text>
      {faqs.map((faq, i) => (
        <View key={i} style={styles.faqCard}>
          <Text style={styles.question}>{faq.q}</Text>
          <Text style={styles.answer}>{faq.a}</Text>
        </View>
      ))}
      
      <TouchableOpacity style={styles.contactBtn}>
        <Ionicons name="mail" size={20} color="#fff" />
        <Text style={styles.contactText}>Email Support</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', padding: 20 },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  faqCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2 },
  question: { fontWeight: 'bold', fontSize: 16, color: '#2E8B57', marginBottom: 5 },
  answer: { fontSize: 14, color: '#555' },
  contactBtn: { backgroundColor: '#2E8B57', flexDirection: 'row', padding: 15, borderRadius: 10, justifyContent: 'center', marginTop: 20 },
  contactText: { color: '#fff', fontWeight: 'bold', marginLeft: 10 }
});