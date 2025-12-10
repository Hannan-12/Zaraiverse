// src/screens/farmer/CropProgressScreen.js
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../services/firebase';
import { AuthContext } from '../../contexts/AuthContext'; // Import AuthContext
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
  orderBy,
  where,
  getDocs,
  limit
} from 'firebase/firestore';
import { format } from 'date-fns';

export default function CropProgressScreen({ route, navigation }) {
  const { user } = useContext(AuthContext);
  
  // 1. Check if a crop was passed via navigation
  const passedCrop = route.params?.crop;

  // 2. State for the "Active" crop we are viewing
  const [activeCrop, setActiveCrop] = useState(passedCrop || null);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchingCrop, setFetchingCrop] = useState(!passedCrop); // Loading state for initial crop fetch

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [entryTitle, setEntryTitle] = useState('');
  const [entryNotes, setEntryNotes] = useState('');

  // --- EFFECT 1: Fetch Crop if None Passed ---
  useEffect(() => {
    // If we already have a crop (passed from MyCrops), skip this
    if (activeCrop) {
      setFetchingCrop(false);
      return;
    }

    if (!user) return;

    const fetchLatestCrop = async () => {
      try {
        console.log("🔍 No crop passed. Fetching latest active crop...");
        
        // Query: Get crops for this user
        // We fetch all and sort in JS to avoid "Missing Index" errors common in dev
        const q = query(collection(db, 'crops'), where('userId', '==', user.uid));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const cropsList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            plantedDate: doc.data().plantedDate?.toDate ? doc.data().plantedDate.toDate() : new Date()
          }));

          // Sort by plantedDate (Newest first)
          cropsList.sort((a, b) => b.plantedDate - a.plantedDate);

          // Pick the first one (Latest)
          const latest = cropsList[0];
          console.log("✅ Found latest crop:", latest.name);
          setActiveCrop(latest);
        } else {
          console.log("⚠️ No crops found for user.");
        }
      } catch (error) {
        console.error("Error auto-fetching crop:", error);
      } finally {
        setFetchingCrop(false);
      }
    };

    fetchLatestCrop();
  }, [user, activeCrop]);


  // --- EFFECT 2: Set Title & Fetch Progress ---
  useEffect(() => {
    if (!activeCrop) {
      setLoading(false);
      return;
    }

    // Set Header Title dynamically
    navigation.setOptions({ title: `${activeCrop.name} Progress` });

    // Fetch Progress Entries for this specific crop
    const progressColRef = collection(db, 'crops', activeCrop.id, 'progressEntries');
    const q = query(progressColRef, orderBy('date', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
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
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeCrop, navigation]);


  // --- Handlers ---
  const handleAddEntry = async () => {
    if (!entryTitle.trim()) {
      Alert.alert('Missing Title', 'Please enter a title.');
      return;
    }
    
    try {
      await addDoc(collection(db, 'crops', activeCrop.id, 'progressEntries'), {
        title: entryTitle,
        notes: entryNotes,
        date: Timestamp.now(),
      });
      setModalVisible(false);
      setEntryTitle('');
      setEntryNotes('');
    } catch (error) {
      Alert.alert('Error', 'Could not save entry.');
    }
  };

  const handleHarvest = async () => {
    Alert.alert(
      'Harvest Crop?',
      `Mark ${activeCrop.name} as harvested?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            try {
              await addDoc(collection(db, 'crops', activeCrop.id, 'progressEntries'), {
                title: 'Harvested',
                notes: 'Crop has been fully harvested.',
                date: Timestamp.now(),
              });
              await updateDoc(doc(db, 'crops', activeCrop.id), { status: 'Harvested' });
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Could not update crop.');
            }
          },
        },
      ]
    );
  };

  // --- Render Timeline Item ---
  const renderProgressItem = ({ item, index }) => (
    <View style={styles.timelineItem}>
      <View style={styles.timelineIcon}>
        <Ionicons name={item.title === 'Planted' ? 'leaf' : 'ellipse'} size={12} color="#fff" />
      </View>
      {index !== progress.length - 1 && <View style={styles.timelineLine} />}
      <View style={styles.timelineContent}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemDate}>{format(item.date, 'MMM d, yyyy')}</Text>
        {item.notes ? <Text style={styles.itemNotes}>{item.notes}</Text> : null}
      </View>
    </View>
  );

  // --- LOADING STATES ---
  if (fetchingCrop) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2E8B57" />
        <Text style={styles.loadingText}>Finding your latest crop...</Text>
      </View>
    );
  }

  // --- EMPTY STATE (No crops found) ---
  if (!activeCrop) {
    return (
      <View style={styles.center}>
        <Ionicons name="leaf-outline" size={60} color="#ccc" />
        <Text style={styles.errorText}>No Active Crops Found.</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('MyCrops')} // Or AddCrop
        >
          <Text style={styles.addButtonText}>Go to My Crops</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- MAIN UI ---
  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator style={{marginTop: 50}} size="large" color="#2e7d32" />
      ) : (
        <FlatList
          data={progress}
          renderItem={renderProgressItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View>
              <View style={styles.headerRow}>
                <Text style={styles.cropNameTitle}>{activeCrop.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: activeCrop.status === 'Growing' ? '#E8F5E9' : '#FFF3E0' }]}>
                   <Text style={{color: activeCrop.status === 'Growing' ? '#2E8B57' : '#F57C00', fontWeight:'bold', fontSize:12}}>
                     {activeCrop.status}
                   </Text>
                </View>
              </View>
              
              <TouchableOpacity style={styles.harvestButton} onPress={handleHarvest}>
                <Ionicons name="checkmark-done-circle" size={20} color="#fff" />
                <Text style={styles.harvestButtonText}>Mark Harvested</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Add Update</Text>
            <TextInput style={styles.input} placeholder="Title (e.g. Watered)" value={entryTitle} onChangeText={setEntryTitle} />
            <TextInput style={[styles.input, styles.notesInput]} placeholder="Notes" value={entryNotes} onChangeText={setEntryNotes} multiline />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.btn, styles.btnClose]} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnSave]} onPress={handleAddEntry}>
                <Text style={styles.btnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 10, color: '#666' },
  errorText: { fontSize: 18, color: '#555', marginVertical: 10, fontWeight: 'bold' },
  list: { padding: 20 },
  
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  cropNameTitle: { fontSize: 24, fontWeight: 'bold', color: '#2E8B57' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },

  harvestButton: { flexDirection: 'row', backgroundColor: '#d9534f', padding: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  harvestButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  addButton: { backgroundColor: '#2E8B57', padding: 12, borderRadius: 8, marginTop: 10 },
  addButtonText: { color: '#fff', fontWeight: 'bold' },

  timelineItem: { flexDirection: 'row', paddingBottom: 20 },
  timelineIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#2e7d32', justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  timelineLine: { position: 'absolute', left: 11, top: 24, width: 2, height: '100%', backgroundColor: '#e0e0e0' },
  timelineContent: { flex: 1, marginLeft: 15, backgroundColor: '#fff', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#eee', marginTop: -5 },
  itemTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  itemDate: { fontSize: 12, color: '#888', marginBottom: 5 },
  itemNotes: { fontSize: 14, color: '#555' },

  fab: { position: 'absolute', right: 20, bottom: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#2e7d32', justifyContent: 'center', alignItems: 'center', elevation: 8 },
  
  modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalView: { backgroundColor: 'white', borderRadius: 20, padding: 25, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 15 },
  notesInput: { height: 80, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  btn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  btnClose: { backgroundColor: '#aaa' },
  btnSave: { backgroundColor: '#2e7d32' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});