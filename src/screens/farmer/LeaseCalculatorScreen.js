// src/screens/farmer/LeaseCalculatorScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export default function LeaseCalculatorScreen({ route, navigation }) {
  const { product } = route.params;
  const [months, setMonths] = useState(6);

  const INTEREST_RATE = 0.12; // 12% interest
  const downpayment = product.price * 0.20;
  const remainingPrincipal = product.price - downpayment;
  
  // Calculate total with 12% interest on the remaining amount
  const interestAmount = remainingPrincipal * INTEREST_RATE;
  const totalWithInterest = remainingPrincipal + interestAmount;
  const monthlyInstallment = totalWithInterest / months;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Lease Plan: {product.name}</Text>
      
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Product Price:</Text>
          <Text style={styles.val}>Rs. {product.price}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Downpayment (20%):</Text>
          <Text style={[styles.val, {color: '#E53935'}]}>- Rs. {downpayment}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Interest Rate:</Text>
          <Text style={[styles.val, {color: '#2E8B57'}]}>+ 12%</Text>
        </View>
        
        <View style={styles.divider} />
        
        <Text style={styles.sectionLabel}>Select Duration:</Text>
        <View style={styles.monthRow}>
          {[6, 12, 18].map(m => (
            <TouchableOpacity 
              key={m} 
              style={[styles.monthBtn, months === m && styles.activeBtn]}
              onPress={() => setMonths(m)}
            >
              <Text style={{color: months === m ? '#fff' : '#333'}}>{m} Months</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.resultBox}>
          <Text style={styles.resultLabel}>Monthly Installment</Text>
          <Text style={styles.resultPrice}>Rs. {monthlyInstallment.toFixed(0)}</Text>
          <Text style={styles.totalPayable}>Total Lease Amount: Rs. {totalWithInterest.toFixed(0)}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.confirmBtn}
        onPress={() => navigation.navigate('LeaseConfirmation', { 
          product, 
          months, 
          downpayment, 
          monthlyInstallment,
          interestRate: '12%',
          totalLeaseBalance: totalWithInterest
        })}
      >
        <Text style={styles.confirmText}>Confirm Lease Plan</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF9', padding: 20 },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#2E8B57' },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 15, elevation: 3 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  label: { fontSize: 14, color: '#666' },
  val: { fontSize: 15, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
  sectionLabel: { fontWeight: 'bold', marginBottom: 10, color: '#333' },
  monthRow: { flexDirection: 'row', justifyContent: 'space-between' },
  monthBtn: { padding: 12, backgroundColor: '#f0f0f0', borderRadius: 10, width: '30%', alignItems: 'center' },
  activeBtn: { backgroundColor: '#2E8B57' },
  resultBox: { marginTop: 30, backgroundColor: '#E8F5E9', padding: 20, borderRadius: 10, alignItems: 'center' },
  resultLabel: { color: '#2E8B57', fontWeight: 'bold' },
  resultPrice: { fontSize: 28, fontWeight: 'bold', color: '#1B5E20' },
  totalPayable: { fontSize: 12, color: '#666', marginTop: 5 },
  confirmBtn: { backgroundColor: '#2E8B57', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 'auto' },
  confirmText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});