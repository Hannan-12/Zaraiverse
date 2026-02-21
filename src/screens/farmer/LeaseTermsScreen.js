// src/screens/farmer/LeaseTermsScreen.js
// Renamed flow: Lease → Rental (usage-based lending model)
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function LeaseTermsScreen({ route, navigation }) {
  const { product } = route.params;
  const [agreed, setAgreed] = useState(false);

  const dailyRate = product.rentalRatePerDay || product.price;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#2E8B57', '#1B5E20']} style={styles.header}>
        <Ionicons name="time-outline" size={40} color="#fff" />
        <Text style={styles.headerTitle}>Equipment Rental Terms</Text>
        <Text style={styles.headerSub}>Usage-Based Lending Agreement</Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.rateCard}>
          <Text style={styles.rateLabel}>Rental Rate</Text>
          <Text style={styles.rateValue}>Rs. {dailyRate} / day</Text>
        </View>

        <Text style={styles.sectionTitle}>1. Usage-Based Payment</Text>
        <Text style={styles.text}>
          You pay only for the time you use the equipment. The rental fee is calculated based on the
          number of days or hours selected. Full payment is required upfront before receiving the equipment.
        </Text>

        <Text style={styles.sectionTitle}>2. Ownership</Text>
        <Text style={styles.text}>
          The equipment remains the sole property of the seller at all times. You are borrowing it
          for the agreed rental period only — no ownership is transferred.
        </Text>

        <Text style={styles.sectionTitle}>3. Return Policy</Text>
        <Text style={styles.text}>
          Equipment must be returned by the agreed return date. Late returns will incur additional
          charges equal to the daily rental rate for each extra day.
        </Text>

        <Text style={styles.sectionTitle}>4. Care & Maintenance</Text>
        <Text style={styles.text}>
          You are responsible for the safe use and routine care of the equipment during the rental
          period. Any damage beyond normal wear and tear will be charged to you.
        </Text>

        <Text style={styles.sectionTitle}>5. Payment Methods</Text>
        <Text style={styles.text}>
          We accept the following payment methods:{'\n'}
          • Cash on Pickup — pay directly to the seller when collecting equipment.{'\n'}
          • Easypaisa — pay securely via your mobile wallet before pickup.
        </Text>

        <View style={styles.agreementRow}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setAgreed(!agreed)}
          >
            {agreed && <Ionicons name="checkmark" size={18} color="#2E8B57" />}
          </TouchableOpacity>
          <Text style={styles.agreementText}>I have read and agree to all rental terms.</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btn, !agreed && styles.btnDisabled]}
          disabled={!agreed}
          onPress={() => navigation.navigate('LeaseCalculator', { product })}
        >
          <Text style={styles.btnText}>Proceed to Rental Calculator</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 40, paddingTop: 60, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 10 },
  headerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4 },
  rateCard: { backgroundColor: '#E8F5E9', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 10, marginTop: 16 },
  rateLabel: { fontSize: 13, color: '#555' },
  rateValue: { fontSize: 22, fontWeight: 'bold', color: '#2E8B57', marginTop: 4 },
  content: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 15, marginBottom: 5 },
  text: { fontSize: 14, color: '#666', lineHeight: 22 },
  agreementRow: { flexDirection: 'row', alignItems: 'center', marginTop: 30, marginBottom: 40 },
  checkbox: { width: 24, height: 24, borderWidth: 2, borderColor: '#2E8B57', borderRadius: 4, marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  agreementText: { fontSize: 14, color: '#333', fontWeight: 'bold', flex: 1 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#eee' },
  btn: { backgroundColor: '#2E8B57', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnDisabled: { backgroundColor: '#ccc' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
