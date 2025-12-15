import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  Image, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  Alert, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { collection, query, where, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Ionicons } from '@expo/vector-icons';

export default function PendingPrescriptions() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // 1. Query: Get all requests where status is 'pending'
    const q = query(
      collection(db, 'expert_requests'),
      where('status', '==', 'pending')
    );

    // 2. Real-time Listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      // Sort by newest first
      list.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
      
      setRequests(list);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching requests:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const openReplyModal = (request) => {
    setSelectedRequest(request);
    setResponse(''); // Clear previous text
    setModalVisible(true);
  };

  const handleSendPrescription = async () => {
    if (!response.trim()) {
      Alert.alert("Error", "Please write a prescription before sending.");
      return;
    }

    setSubmitting(true);
    try {
      const requestRef = doc(db, 'expert_requests', selectedRequest.id);
      
      // Update the document: add response, change status, add timestamp
      await updateDoc(requestRef, {
        response: response,
        status: 'completed',
        respondedAt: Timestamp.now(),
        expertName: 'Dr. Expert' // You can fetch actual name from AuthContext if needed
      });

      Alert.alert("Success", "Prescription sent successfully!");
      setModalVisible(false);
    } catch (error) {
      console.error("Error updating request:", error);
      Alert.alert("Error", "Could not send prescription.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.farmerName}>{item.userName || 'Unknown Farmer'}</Text>
        <Text style={styles.date}>
          {item.createdAt?.toDate().toLocaleDateString()}
        </Text>
      </View>

      <Text style={styles.cropName}>Crop: {item.cropName}</Text>
      <Text style={styles.description}>{item.description}</Text>

      {/* Show Image if available */}
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.cropImage} />
      )}

      <TouchableOpacity 
        style={styles.replyButton} 
        onPress={() => openReplyModal(item)}
      >
        <Ionicons name="medical-outline" size={20} color="#fff" />
        <Text style={styles.replyButtonText}>Write Prescription</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {requests.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="checkmark-circle-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No pending requests.</Text>
        </View>
      ) : (
        <FlatList 
          data={requests}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* REPLY MODAL */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Write Prescription</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>
              Advice for {selectedRequest?.cropName}:
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Enter diagnosis and recommended pesticides/fertilizers..."
              multiline
              textAlignVertical="top"
              value={response}
              onChangeText={setResponse}
            />

            <TouchableOpacity 
              style={styles.sendButton} 
              onPress={handleSendPrescription}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.sendButtonText}>Send to Farmer</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F2' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 15 },
  emptyText: { marginTop: 10, color: '#888', fontSize: 16 },

  // Card Styles
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  farmerName: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  date: { fontSize: 12, color: '#888' },
  cropName: { fontSize: 14, fontWeight: '600', color: '#2E7D32', marginBottom: 4 },
  description: { fontSize: 14, color: '#555', marginBottom: 10, lineHeight: 20 },
  cropImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 10,
    resizeMode: 'cover',
  },
  replyButton: {
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  replyButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },

  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: '60%', // Takes up 60% of screen
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#2E7D32' },
  modalLabel: { fontSize: 14, color: '#666', marginBottom: 10 },
  input: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
  },
  sendButton: {
    backgroundColor: '#2E7D32',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  sendButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});