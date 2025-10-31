// src/screens/farmer/MyCropsScreen.js
import React, { useState, useEffect, useContext } from 'react'; // Import useContext
import {
  View,
  Text,
  Button,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

// --- ✅ NEW: Firebase Imports ---
import { db } from '../../services/firebase';
import { AuthContext } from '../../contexts/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { format } from 'date-fns';

export default function MyCropsScreen({ navigation, route }) {
  const { user } = useContext(AuthContext);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- ✅ MODIFIED: Fetch crops from Firestore ---
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Set up the query to get all crops for this user
    // that are *still growing*.
    const q = query(
      collection(db, 'crops'),
      where('userId', '==', user.uid),
      where('status', '==', 'Growing') // This is the "auto-delete"
    );

    // Listen for real-time updates
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const cropsData = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          cropsData.push({
            id: doc.id,
            ...data,
            // Convert Firestore timestamp back to JS Date
            plantedDate: data.plantedDate.toDate(),
          });
        });
        // Sort by planted date, newest first
        cropsData.sort((a, b) => b.plantedDate.getTime() - a.plantedDate.getTime());
        setCrops(cropsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching crops: ', error);
        Alert.alert('Error', 'Could not fetch crops.');
        setLoading(false);
      }
    );

    // Unsubscribe from listener when component unmounts
    return () => unsubscribe();
  }, [user]); // Re-run when user logs in

  // --- ❌ REMOVED old useEffect that checked route.params ---

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* --- EXPERT PRESCRIPTION SECTION (No changes here) --- */}
      <TouchableOpacity
        style={styles.prescriptionCard}
        onPress={() => navigation.navigate('RequestPrescription')}>
        <Text style={styles.cardTitle}>👨‍🌾 Expert Prescription</Text>
        <Text style={styles.cardSubtitle}>
          Request advice from agricultural experts and receive guidance on crop
          issues.
        </Text>
      </TouchableOpacity>

      <Text style={styles.listHeader}>My Active Crops</Text>
      
      <FlatList
        data={crops} // Use the crops state from Firestore
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No active crops found. Add one!</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.cropItem}>
            <View>
              <Text style={styles.cropName}>{item.name}</Text>
              <Text style={styles.cropInfo}>
                Planted: {format(item.plantedDate, 'MMM d, yyyy')}
              </Text>
              <Text style={styles.cropInfo}>Health: {item.health}</Text>
            </View>
            <Button
              title="View Progress"
              // Pass the *entire* crop object to the progress screen
              onPress={() => navigation.navigate('CropProgress', { crop: item })}
            />
          </View>
        )}
      />

      {/* --- ADD CROP BUTTON (No changes here) --- */}
      <View style={styles.buttonContainer}>
        <Button
          title="Add New Crop"
          onPress={() => navigation.navigate('AddCrop')}
          color="#2e7d32"
        />
      </View>
    </View>
  );
}

// --- STYLES (Added 'centered' and 'emptyText') ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5ff5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
    color: '#777',
  },
  prescriptionCard: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
  listHeader: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  cropItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 1,
  },
  cropName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cropInfo: {
    fontSize: 14,
    color: 'gray',
  },
  buttonContainer: {
    marginTop: 'auto',
    paddingTop: 10,
  },
});
