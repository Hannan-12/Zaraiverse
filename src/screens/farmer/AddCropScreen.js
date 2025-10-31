// src/screens/farmer/AddCropScreen.js
import React, { useState, useContext } from 'react'; // Import useContext
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
  ActivityIndicator, // Add ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

// --- ✅ NEW: Firebase Imports ---
import { db } from '../../services/firebase';
import { AuthContext } from '../../contexts/AuthContext';
import { collection, addDoc, Timestamp, doc } from 'firebase/firestore';

const healthOptions = ['Good', 'Moderate', 'Poor'];

export default function AddCropScreen({ navigation }) {
  const { user } = useContext(AuthContext); // Get the logged-in user
  const [cropName, setCropName] = useState('');
  const [health, setHealth] = useState('Good');
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Loading state

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowPicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  // --- ✅ MODIFIED: Save to Firestore ---
  const handleSaveCrop = async () => {
    if (!cropName.trim()) {
      Alert.alert('Missing Info', 'Please enter a name for your crop.');
      return;
    }
    if (!user) {
      Alert.alert('Error', 'You must be logged in to add a crop.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Create the new crop document data
      const newCropData = {
        userId: user.uid,
        name: cropName,
        plantedDate: Timestamp.fromDate(date), // Use Firestore Timestamp
        health: health,
        status: 'Growing', // NEW: Set the initial status
      };

      // 2. Add the crop document to the 'crops' collection
      const cropDocRef = await addDoc(collection(db, 'crops'), newCropData);

      // 3. Add the *first* progress entry to its sub-collection
      const firstEntry = {
        title: 'Planted',
        notes: `Initial planting of ${cropName}. Health: ${health}.`,
        date: Timestamp.fromDate(date),
      };
      // Create a reference to the sub-collection
      const progressColRef = collection(db, 'crops', cropDocRef.id, 'progressEntries');
      await addDoc(progressColRef, firstEntry);

      setIsLoading(false);
      // Go back to the list. onSnapshot in MyCropsScreen will do the rest.
      navigation.goBack();

    } catch (error) {
      setIsLoading(false);
      console.error("Error saving crop: ", error);
      Alert.alert("Error", "Could not save crop to database.");
    }
  };

  return (
    <ScrollView style={styles.outerContainer} contentContainerStyle={styles.container}>
      <Text style={styles.header}>🌱 Add New Crop</Text>
      <Text style={styles.subtitle}>
        Enter the details for the new crop you are planting.
      </Text>

      {/* Crop Name Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Crop Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Wheat, Corn, Rice"
          value={cropName}
          onChangeText={setCropName}
        />
      </View>

      {/* Planted Date Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Planted Date</Text>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowPicker(true)}>
          <Ionicons name="calendar-outline" size={20} color="#2e7d32" />
          <Text style={styles.datePickerText}>
            {format(date, 'MMMM d, yyyy')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* DatePicker Modal/Component */}
      {showPicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode="date"
          display="default"
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}

      {/* Health Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Initial Health</Text>
        <View style={styles.healthSelector}>
          {healthOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.healthOption,
                health === option && styles.healthOptionActive,
              ]}
              onPress={() => setHealth(option)}>
              <Text
                style={[
                  styles.healthOptionText,
                  health === option && styles.healthOptionTextActive,
                ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSaveCrop} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="save-outline" size={22} color="#fff" />
            <Text style={styles.saveButtonText}>Save Crop</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

// STYLES (Styles are unchanged from your last version)
const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  datePickerText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
  },
  healthSelector: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  healthOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },
  healthOptionActive: {
    backgroundColor: '#E8F5E9',
  },
  healthOptionText: {
    fontSize: 16,
    color: '#555',
  },
  healthOptionTextActive: {
    color: '#2e7d32',
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#2e7d32',
    paddingVertical: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
