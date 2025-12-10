import React, { useState, useContext, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, 
  Platform, ScrollView, ActivityIndicator, Modal, FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { db } from '../../services/firebase';
import { AuthContext } from '../../contexts/AuthContext';
import { collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';

const healthOptions = ['Good', 'Moderate', 'Poor'];

export default function AddCropScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [cropName, setCropName] = useState('');
  
  // --- Field Selection State ---
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [fieldModalVisible, setFieldModalVisible] = useState(false);
  
  const [health, setHealth] = useState('Good');
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // --- Fetch Fields on Mount ---
  useEffect(() => {
    const fetchFields = async () => {
      try {
        const q = query(collection(db, 'fields'), where('userId', '==', user.uid));
        const snapshot = await getDocs(q);
        const fieldList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFields(fieldList);
      } catch (e) {
        console.error("Error fetching fields", e);
      }
    };
    fetchFields();
  }, [user]);

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowPicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const handleSaveCrop = async () => {
    if (!cropName.trim()) {
      Alert.alert('Missing Info', 'Please enter a name for your crop.');
      return;
    }
    if (!selectedField) {
      Alert.alert('Missing Info', 'Please select a field for this crop.');
      return;
    }

    setIsLoading(true);

    try {
      const newCropData = {
        userId: user.uid,
        name: cropName,
        fieldId: selectedField.id,
        fieldName: selectedField.name, // Save name for easy display
        plantedDate: Timestamp.fromDate(date),
        health: health,
        status: 'Growing',
      };

      const cropDocRef = await addDoc(collection(db, 'crops'), newCropData);

      const firstEntry = {
        title: 'Planted',
        notes: `Initial planting of ${cropName} in ${selectedField.name}. Health: ${health}.`,
        date: Timestamp.fromDate(date),
      };
      
      await addDoc(collection(db, 'crops', cropDocRef.id, 'progressEntries'), firstEntry);

      setIsLoading(false);
      navigation.goBack();

    } catch (error) {
      setIsLoading(false);
      Alert.alert("Error", "Could not save crop.");
    }
  };

  return (
    <ScrollView style={styles.outerContainer} contentContainerStyle={styles.container}>
      <Text style={styles.header}>🌱 Add New Crop</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Crop Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Wheat, Corn, Rice"
          value={cropName}
          onChangeText={setCropName}
        />
      </View>

      {/* --- Field Selection --- */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Select Field</Text>
        <TouchableOpacity 
          style={styles.selectorButton} 
          onPress={() => {
            if (fields.length === 0) {
              Alert.alert("No Fields", "Please add a field first in the 'My Fields' section.");
            } else {
              setFieldModalVisible(true);
            }
          }}
        >
          <Text style={[styles.selectorText, !selectedField && { color: '#999' }]}>
            {selectedField ? selectedField.name : "Tap to select a field..."}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Planted Date</Text>
        <TouchableOpacity style={styles.selectorButton} onPress={() => setShowPicker(true)}>
          <Ionicons name="calendar-outline" size={20} color="#2e7d32" style={{marginRight: 10}} />
          <Text style={styles.selectorText}>{format(date, 'MMMM d, yyyy')}</Text>
        </TouchableOpacity>
      </View>

      {showPicker && (
        <DateTimePicker value={date} mode="date" display="default" onChange={onDateChange} maximumDate={new Date()} />
      )}

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Initial Health</Text>
        <View style={styles.healthSelector}>
          {healthOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.healthOption, health === option && styles.healthOptionActive]}
              onPress={() => setHealth(option)}>
              <Text style={[styles.healthOptionText, health === option && styles.healthOptionTextActive]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSaveCrop} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Crop</Text>}
      </TouchableOpacity>

      {/* Field Selection Modal */}
      <Modal visible={fieldModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select a Field</Text>
            <FlatList
              data={fields}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.modalItem} 
                  onPress={() => {
                    setSelectedField(item);
                    setFieldModalVisible(false);
                  }}
                >
                  <Ionicons name="location-outline" size={20} color="#2E8B57" />
                  <Text style={styles.modalItemText}>{item.name} ({item.size} acres)</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.closeButton} onPress={() => setFieldModalVisible(false)}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#F8F9FA' },
  container: { flexGrow: 1, padding: 20 },
  header: { fontSize: 26, fontWeight: 'bold', color: '#2e7d32', marginBottom: 20 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', fontSize: 16 },
  selectorButton: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' 
  },
  selectorText: { fontSize: 16, color: '#333' },
  healthSelector: { flexDirection: 'row', borderRadius: 8, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff' },
  healthOption: { flex: 1, padding: 12, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#ddd' },
  healthOptionActive: { backgroundColor: '#E8F5E9' },
  healthOptionText: { fontSize: 14, color: '#555' },
  healthOptionTextActive: { color: '#2e7d32', fontWeight: 'bold' },
  saveButton: { backgroundColor: '#2e7d32', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '50%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  modalItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalItemText: { fontSize: 16, marginLeft: 10, color: '#333' },
  closeButton: { marginTop: 15, alignItems: 'center', padding: 10 },
  closeButtonText: { color: '#C62828', fontSize: 16, fontWeight: 'bold' }
});