import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import { View, Text, Button, FlatList, StyleSheet, TouchableOpacity } from 'react-native';

const INITIAL_CROPS = [
  { id: 'crop_123', name: 'Wheat', planted: '2025-08-15', health: 'Good' },
  { id: 'crop_456', name: 'Rice', planted: '2025-09-01', health: 'Moderate' },
];

// Add 'route' to the component props
export default function MyCropsScreen({ navigation, route }) {
  // 1. Use useState to make the crops list dynamic
  const [crops, setCrops] = useState(INITIAL_CROPS);

  // 2. Use useEffect to check for a new crop when returning to this screen
  useEffect(() => {
    // Check if the 'newCrop' parameter exists in the route
    if (route.params?.newCrop) {
      // Add the new crop to our state and prevent duplicates
      const newCrop = route.params.newCrop;
      if (!crops.some(crop => crop.id === newCrop.id)) {
        setCrops(prevCrops => [...prevCrops, newCrop]);
      }
    }
  }, [route.params?.newCrop]);

  return (
    <View style={styles.container}>
      {/* --- EXPERT PRESCRIPTION SECTION (No changes here) --- */}
      <TouchableOpacity 
        style={styles.prescriptionCard} 
        onPress={() => navigation.navigate('RequestPrescription')}
      >
        <Text style={styles.cardTitle}>👨‍🌾 Expert Prescription</Text>
        <Text style={styles.cardSubtitle}>
          Request advice from agricultural experts and receive guidance on crop issues.
        </Text>
      </TouchableOpacity>
      
      <Text style={styles.listHeader}>My Active Crops</Text>
      {/* 3. Make the FlatList use the dynamic 'crops' state */}
      <FlatList 
        data={crops} 
        keyExtractor={item => item.id} 
        renderItem={({ item }) => (
          // ... The list item rendering is the same
          <View style={styles.cropItem}>
            <View>
              <Text style={styles.cropName}>{item.name}</Text>
              <Text style={styles.cropInfo}>Planted: {item.planted}</Text>
              <Text style={styles.cropInfo}>Health: {item.health}</Text>
            </View>
            <Button 
              title="View Progress" 
              onPress={() => navigation.navigate('CropProgress', { cropId: item.id })} 
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

// Styles are the same, no changes needed below this line
const styles = StyleSheet.create({ container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
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
  // Style for the button container to give it some space
  buttonContainer: {
    marginTop: 'auto', // Pushes the button to the bottom
    paddingTop: 10,
  }});
