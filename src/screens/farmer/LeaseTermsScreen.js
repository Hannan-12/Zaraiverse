// src/screens/farmer/LeaseTermsScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, CheckBox } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function LeaseTermsScreen({ route, navigation }) {
  const { product } = route.params;
  const [agreed, setAgreed] = useState(false);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#2E8B57', '#1B5E20']} style={styles.header}>
        <Ionicons name="document-text-outline" size={40} color="#fff" />
        <Text style={styles.headerTitle}>Lease Terms & Conditions</Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>1. Downpayment Requirement</Text>
        <Text style={styles.text}>
          A non-refundable downpayment of 20% (Rs. {(product.price * 0.2).toFixed(0)}) is required to initiate the lease process.
        </Text>

        <Text style={styles.sectionTitle}>2. Ownership</Text>
        <Text style={styles.text}>
          The machine remains the property of the seller until the final installment is paid in full.
        </Text>

        <Text style={styles.sectionTitle}>3. Late Payments</Text>
        <Text style={styles.text}>
          Failure to pay installments for two consecutive months may result in the repossession of the machine.
        </Text>

        <Text style={styles.sectionTitle}>4. Maintenance</Text>
        <Text style={styles.text}>
          The farmer is responsible for the routine maintenance and safety of the machine during the lease period.
        </Text>

        <View style={styles.agreementRow}>
          <TouchableOpacity 
            style={styles.checkbox} 
            onPress={() => setAgreed(!agreed)}
          >
            {agreed && <Ionicons name="checkmark" size={18} color="#2E8B57" />}
          </TouchableOpacity>
          <Text style={styles.agreementText}>I have read and agree to all terms.</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.btn, !agreed && styles.btnDisabled]} 
          disabled={!agreed}
          onPress={() => navigation.navigate('LeaseCalculator', { product })}
        >
          <Text style={styles.btnText}>Proceed to Calculator</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 40, paddingTop: 60, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 10 },
  content: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 15, marginBottom: 5 },
  text: { fontSize: 14, color: '#666', lineHeight: 20 },
  agreementRow: { flexDirection: 'row', alignItems: 'center', marginTop: 30, marginBottom: 40 },
  checkbox: { width: 24, height: 24, borderWidth: 2, borderColor: '#2E8B57', borderRadius: 4, marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  agreementText: { fontSize: 14, color: '#333', fontWeight: 'bold' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#eee' },
  btn: { backgroundColor: '#2E8B57', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnDisabled: { backgroundColor: '#ccc' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});