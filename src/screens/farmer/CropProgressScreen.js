// src/screens/farmer/CropProgressScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../services/firebase';
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
  orderBy,
} from 'firebase/firestore';
import { format } from 'date-fns';

export default function CropProgressScreen({ route, navigation }) {
  const { crop } = route.params; // Get the full crop object
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // State for the new entry modal
  const [entryTitle, setEntryTitle] = useState('');
  const [entryNotes, setEntryNotes] = useState('');

  // Get the reference to this crop's 'progressEntries' sub-collection
  const progressColRef = collection(db, 'crops', crop.id, 'progressEntries');

  // Set the screen title to the crop name
  useEffect(() => {
    navigation.setOptions({ title: `${crop.name} Progress` });
  }, [crop, navigation]);

  // Listen for progress updates
  useEffect(() => {
    const q = query(progressColRef, orderBy('date', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const progressData = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          progressData.push({
            id: doc.id,
            ...data,
            date: data.date.toDate(),
          });
        });
        setProgress(progressData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching progress: ', error);
        // This might fail if you need a single-field index on 'date'.
        // Firebase console error will provide a link to create it.
        Alert.alert('Error', 'Could not load progress data.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [crop.id]);

  // --- Handler to save a new progress entry ---
  const handleAddEntry = async () => {
    if (!entryTitle.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for this entry.');
      return;
    }
    
    const newEntry = {
      title: entryTitle,
      notes: entryNotes,
      date: Timestamp.now(),
    };

    try {
      await addDoc(progressColRef, newEntry);
      setModalVisible(false);
      setEntryTitle('');
      setEntryNotes('');
    } catch (error) {
      console.error('Error adding entry: ', error);
      Alert.alert('Error', 'Could not save new entry.');
    }
  };

  // --- Handler to mark the crop as HARVESTED ---
  const handleHarvest = async () => {
    Alert.alert(
      'Harvest Crop?',
      `Are you sure you want to mark ${crop.name} as harvested? This will remove it from your active crops list.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            try {
              // 1. Add a final "Harvested" entry
              const harvestEntry = {
                title: 'Harvested',
                notes: 'Crop has been fully harvested.',
                date: Timestamp.now(),
              };
              await addDoc(progressColRef, harvestEntry);

              // 2. Update the main crop's status
              const cropDocRef = doc(db, 'crops', crop.id);
              await updateDoc(cropDocRef, {
                status: 'Harvested',
              });

              // 3. Go back. The list screen will auto-update.
              navigation.goBack();
            } catch (error) {
              console.error('Error harvesting crop: ', error);
              Alert.alert('Error', 'Could not update crop status.');
            }
          },
        },
      ]
    );
  };

  // --- Renders each item in the timeline ---
  const renderProgressItem = ({ item, index }) => (
    <View style={styles.timelineItem}>
      <View style={styles.timelineIcon}>
        <Ionicons
          name={item.title === 'Planted' ? 'leaf' : 'ellipse'}
          size={12}
          color="#fff"
        />
      </View>
      {index !== progress.length - 1 && <View style={styles.timelineLine} />}
      <View style={styles.timelineContent}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemDate}>{format(item.date, 'MMM d, yyyy')}</Text>
        <Text style={styles.itemNotes}>{item.notes}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.outerContainer}>
      {loading ? (
        <ActivityIndicator style={styles.centered} size="large" color="#2e7d32" />
      ) : (
        <FlatList
          data={progress}
          renderItem={renderProgressItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={
            <TouchableOpacity
              style={styles.harvestButton}
              onPress={handleHarvest}>
              <Ionicons name="checkmark-done-circle" size={22} color="#fff" />
              <Text style={styles.harvestButtonText}>Mark as Harvested</Text>
            </TouchableOpacity>
          }
        />
      )}

      {/* --- Floating Action Button to Add New Entry --- */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>

      {/* --- Modal for Adding New Entry --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Add Progress Entry</Text>
            <TextInput
              style={styles.input}
              placeholder="Title (e.g., Fertilized, Watered)"
              value={entryTitle}
              onChangeText={setEntryTitle}
            />
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Notes (Optional)"
              value={entryNotes}
              onChangeText={setEntryNotes}
              multiline
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose]}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.textStyle}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonSave]}
                onPress={handleAddEntry}>
                <Text style={styles.textStyle}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#F8F9FA' },
  centered: { marginTop: 50 },
  listContainer: { padding: 20 },
  harvestButton: {
    flexDirection: 'row',
    backgroundColor: '#d9534f', // Red for "complete" action
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  harvestButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  // Timeline styles
  timelineItem: {
    flexDirection: 'row',
    paddingBottom: 20,
  },
  timelineIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2e7d32',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  timelineLine: {
    position: 'absolute',
    left: 11,
    top: 24,
    width: 2,
    height: '100%',
    backgroundColor: '#e0e0e0',
  },
  timelineContent: {
    flex: 1,
    marginLeft: 15,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    marginTop: -5,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  itemDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 5,
  },
  itemNotes: {
    fontSize: 14,
    color: '#555',
  },
  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2e7d32',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    borderRadius: 10,
    padding: 12,
    elevation: 2,
    width: '48%',
  },
  buttonClose: { backgroundColor: '#aaa' },
  buttonSave: { backgroundColor: '#2e7d32' },
  textStyle: { color: 'white', fontWeight: 'bold', textAlign: 'center' },
});
