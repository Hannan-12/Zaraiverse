// src/screens/common/HelpCenterScreen.js
import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput 
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function HelpCenterScreen() {
  const [activeTab, setActiveTab] = useState(null);

  const faqs = [
    { 
      id: 1, 
      q: "How to add a product?", 
      a: "Go to your Seller Dashboard and click 'Add New Product'. Fill in the details and tap 'List Product'." 
    },
    { 
      id: 2, 
      q: "How to track my order?", 
      a: "Farmers can view order status in the 'Orders' section. Sellers can manage shipments in 'Manage Shipments'." 
    },
    { 
      id: 3, 
      q: "Is my data secure?", 
      a: "Yes, Zaraiverse uses industry-standard encryption to protect your personal information and transactions." 
    }
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#2E8B57', '#1B5E20']} style={styles.header}>
        <Text style={styles.headerTitle}>How can we help?</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput placeholder="Search topics..." style={styles.searchInput} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {faqs.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.faqCard}
            onPress={() => setActiveTab(activeTab === item.id ? null : item.id)}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>{item.q}</Text>
              <Ionicons 
                name={activeTab === item.id ? "chevron-up" : "chevron-down"} 
                size={20} color="#2E8B57" 
              />
            </View>
            {activeTab === item.id && (
              <Text style={styles.faqAnswer}>{item.a}</Text>
            )}
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionTitle, { marginTop: 25 }]}>Contact Us</Text>
        <View style={styles.contactRow}>
          <TouchableOpacity style={styles.contactCard}>
            <Ionicons name="mail" size={28} color="#2E8B57" />
            <Text style={styles.contactLabel}>Email Support</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactCard}>
            <Ionicons name="logo-whatsapp" size={28} color="#2E8B57" />
            <Text style={styles.contactLabel}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF9' },
  header: { padding: 30, paddingTop: 60, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  searchBar: { 
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 15, 
    paddingHorizontal: 15, paddingVertical: 12, alignItems: 'center', elevation: 5 
  },
  searchInput: { marginLeft: 10, flex: 1, fontSize: 16 },
  content: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  faqCard: { backgroundColor: '#fff', borderRadius: 15, padding: 15, marginBottom: 12, elevation: 2 },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { fontSize: 15, fontWeight: '600', color: '#444', flex: 1 },
  faqAnswer: { marginTop: 10, color: '#666', lineHeight: 20, fontSize: 14 },
  contactRow: { flexDirection: 'row', justifyContent: 'space-between' },
  contactCard: { 
    backgroundColor: '#fff', width: '48%', borderRadius: 15, padding: 20, 
    alignItems: 'center', elevation: 3, borderLeftWidth: 4, borderLeftColor: '#2E8B57' 
  },
  contactLabel: { marginTop: 10, fontWeight: 'bold', color: '#333', fontSize: 13 }
});