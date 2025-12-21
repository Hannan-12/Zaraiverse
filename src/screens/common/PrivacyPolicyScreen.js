// src/screens/common/PrivacyPolicyScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function PrivacyPolicyScreen() {
  const sections = [
    {
      title: "Data Collection",
      icon: "database-eye",
      content: "We collect basic profile information, farm details, and transaction history to provide better services."
    },
    {
      title: "How We Use Data",
      icon: "file-cog-outline",
      content: "Information is used to personalize your dashboard, process orders, and provide agricultural expert advice."
    },
    {
      title: "Information Sharing",
      icon: "share-variant-outline",
      content: "We never sell your data. We only share necessary info with payment gateways and delivery partners."
    }
  ];

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#2E8B57', '#1B5E20']} style={styles.header}>
        <MaterialCommunityIcons name="shield-lock" size={60} color="#fff" />
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <Text style={styles.lastUpdated}>Last Updated: December 2025</Text>
      </LinearGradient>

      <View style={styles.content}>
        {sections.map((section, index) => (
          <View key={index} style={styles.policyCard}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name={section.icon} size={24} color="#2E8B57" />
              <Text style={styles.cardTitle}>{section.title}</Text>
            </View>
            <Text style={styles.cardText}>{section.content}</Text>
          </View>
        ))}

        <View style={styles.footerNote}>
          <Text style={styles.footerText}>
            By using Zaraiverse, you agree to these terms. Contact us if you have any questions regarding your privacy.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF9' },
  header: { padding: 40, paddingTop: 60, alignItems: 'center', borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  headerTitle: { color: '#fff', fontSize: 26, fontWeight: 'bold', marginTop: 10 },
  lastUpdated: { color: '#E8F5E9', fontSize: 13, opacity: 0.8 },
  content: { padding: 20 },
  policyCard: { 
    backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 15, 
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginLeft: 10 },
  cardText: { fontSize: 15, color: '#666', lineHeight: 22 },
  footerNote: { marginTop: 20, padding: 20, alignItems: 'center' },
  footerText: { textAlign: 'center', color: '#999', fontSize: 14, fontStyle: 'italic' }
});