import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, TouchableOpacity, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { AuthContext } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function PendingPrescriptions() {
  const { user } = useContext(AuthContext); // Access expert identity
  const [requests, setRequests] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [response, setResponse] = useState('');
  const [sending, setSending] = useState(false);
  
  const templates = [
    "Spray Chlorpyrifos 20% EC (2ml/L) immediately.",
    "Lacks Nitrogen. Apply Urea (50kg per acre).",
    "Reduce irrigation to prevent root rot.",
    "Infection looks fungal. Use Mancozeb (2g/L)."
  ];

  useEffect(() => {
    // Listen for requests that have not been answered yet
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

  // Implement handleSend logic
  const handleSend = async () => {
    if (!response.trim() || !selectedRequest) {
      Alert.alert("Error", "Please enter a prescription before sending.");
      return;
    }

    setSending(true);
    try {
      const requestRef = doc(db, 'expert_requests', selectedRequest.id);
      
      // Update document to 'completed' and link to this expert
      await updateDoc(requestRef, {
        response: response,
        status: 'completed',
        expertId: user.uid,
        expertName: user.name || user.email,
        respondedAt: serverTimestamp()
      });

      Alert.alert("Success", "Prescription sent successfully!");
      setModalVisible(false);
    } catch (error) {
      console.error("Error sending prescription:", error);
      Alert.alert("Error", "Failed to send prescription. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList 
        data={requests}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
               <Text style={styles.crop}>{item.cropName}</Text>
               <Text style={styles.time}>{item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Recent'}</Text>
            </View>
            <Text style={styles.desc}>{item.description}</Text>
            {item.image && (
                <Image source={{ uri: item.image }} style={styles.requestImage} />
            )}
            <TouchableOpacity style={styles.replyBtn} onPress={() => openModal(item)}>
              <Text style={styles.replyBtnText}>Write Prescription</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No pending requests found.</Text>}
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
              placeholder="Enter prescription details here..."
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                <Text style={{color: '#888'}}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.sendBtn} 
                onPress={handleSend}
                disabled={sending}
              >
                {sending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{color: '#fff', fontWeight: 'bold'}}>Send</Text>}
              </TouchableOpacity>
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  crop: { fontSize: 18, fontWeight: 'bold', color: '#2E7D32' },
  time: { fontSize: 12, color: '#888' },
  desc: { fontSize: 14, color: '#555', marginVertical: 10 },
  requestImage: { width: '100%', height: 150, borderRadius: 10, marginBottom: 10 },
  replyBtn: { backgroundColor: '#2E7D32', padding: 12, borderRadius: 8, alignItems: 'center' },
  replyBtnText: { color: '#fff', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999', fontSize: 16 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 15, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  templateRow: { flexDirection: 'row', marginBottom: 15 },
  chip: { backgroundColor: '#E8F5E9', padding: 10, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#C8E6C9' },
  chipText: { color: '#2E7D32', fontSize: 12, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, height: 150, textAlignVertical: 'top', backgroundColor: '#f9f9f9', fontSize: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, alignItems: 'center' },
  cancelBtn: { marginRight: 25 },
  sendBtn: { backgroundColor: '#2E7D32', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10, minWidth: 100, alignItems: 'center' },
});