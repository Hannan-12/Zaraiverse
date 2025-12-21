import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db } from '../../services/firebase';
import { collection, query, onSnapshot, doc, updateDoc, where } from 'firebase/firestore';

export default function ManageShipment() {
  const [shipments, setShipments] = useState([]);

  useEffect(() => {
    // Show only orders that are being processed or shipped
    const q = query(collection(db, 'orders'), where('status', 'in', ['Processing', 'Shipped']));
    return onSnapshot(q, (snapshot) => {
      setShipments(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });
  }, []);

  const handleUpdate = async (id, nextStatus) => {
    await updateDoc(doc(db, 'orders', id), { status: nextStatus });
    Alert.alert("Status Updated", `Order is now ${nextStatus}`);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={shipments}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.sCard}>
            <Text style={styles.sId}>Order #{item.id.slice(-6).toUpperCase()}</Text>
            <Text style={styles.sCust}>{item.customerName}</Text>
            <Text style={styles.sAddr}>{item.address || 'No address provided'}</Text>
            
            <View style={styles.btnRow}>
              {item.status === 'Processing' && (
                <TouchableOpacity style={[styles.shipBtn, {backgroundColor: '#42A5F5'}]} onPress={() => handleUpdate(item.id, 'Shipped')}>
                  <MaterialCommunityIcons name="truck-delivery" size={20} color="#fff" />
                  <Text style={styles.btnText}>Mark Shipped</Text>
                </TouchableOpacity>
              )}
              {item.status === 'Shipped' && (
                <TouchableOpacity style={[styles.shipBtn, {backgroundColor: '#66BB6A'}]} onPress={() => handleUpdate(item.id, 'Delivered')}>
                  <MaterialCommunityIcons name="check-all" size={20} color="#fff" />
                  <Text style={styles.btnText}>Mark Delivered</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F6' },
  sCard: { backgroundColor: '#fff', borderRadius: 15, padding: 16, marginBottom: 15, elevation: 3 },
  sId: { fontWeight: 'bold', fontSize: 16, marginBottom: 5 },
  sCust: { fontSize: 14, color: '#333', fontWeight: '600' },
  sAddr: { color: '#777', fontSize: 13, marginVertical: 8 },
  btnRow: { marginTop: 10 },
  shipBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 12, borderRadius: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 }
});