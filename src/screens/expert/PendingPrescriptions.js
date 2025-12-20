import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, TouchableOpacity, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { collection, query, where, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Ionicons } from '@expo/vector-icons';

export default function PendingPrescriptions() {
  const [requests, setRequests] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [response, setResponse] = useState('');
  
  const templates = [
    "Spray Chlorpyrifos 20% EC (2ml/L) immediately.",
    "Lacks Nitrogen. Apply Urea (50kg per acre).",
    "Reduce irrigation to prevent root rot.",
    "Infection looks fungal. Use Mancozeb (2g/L)."
  ];

  useEffect(() => {
    const q = query(collection(db, 'expert_requests'), where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(list);
    });
    return () => unsubscribe();
  }, []);

  const openModal = (item) => {
    setSelectedRequest(item);
    setResponse('');
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <FlatList 
        data={requests}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.crop}>{item.cropName}</Text>
            <Text style={styles.desc}>{item.description}</Text>
            <TouchableOpacity style={styles.replyBtn} onPress={() => openModal(item)}>
              <Text style={styles.replyBtnText}>Write Prescription</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Response Template</Text>
            <ScrollView horizontal style={styles.templateRow} showsHorizontalScrollIndicator={false}>
              {templates.map((t, i) => (
                <TouchableOpacity key={i} style={styles.chip} onPress={() => setResponse(t)}>
                  <Text style={styles.chipText}>Template {i+1}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput 
              style={styles.input} 
              multiline 
              value={response} 
              onChangeText={setResponse} 
              placeholder="Enter prescription..."
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.sendBtn}><Text style={{color: '#fff'}}>Send</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 15 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2 },
  crop: { fontSize: 18, fontWeight: 'bold', color: '#2E7D32' },
  desc: { fontSize: 14, color: '#555', marginVertical: 10 },
  replyBtn: { backgroundColor: '#2E7D32', padding: 10, borderRadius: 5, alignItems: 'center' },
  replyBtnText: { color: '#fff', fontWeight: 'bold' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 15, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  templateRow: { flexDirection: 'row', marginBottom: 15 },
  chip: { backgroundColor: '#E8F5E9', padding: 8, borderRadius: 20, marginRight: 10 },
  chipText: { color: '#2E7D32', fontSize: 12 },
  input: { borderSize: 1, borderColor: '#ddd', borderRadius: 10, padding: 10, height: 150, textAlignVertical: 'top', backgroundColor: '#f9f9f9' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15 },
  cancelBtn: { marginRight: 20, justifyContent: 'center' },
  sendBtn: { backgroundColor: '#2E7D32', paddingVertical: 10, paddingHorizontal: 25, borderRadius: 10 },
});