import React, { useState, useContext } from 'react';
import { 
  View, Text, TextInput, StyleSheet, TouchableOpacity, 
  Alert, ActivityIndicator, ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../services/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { AuthContext } from '../../contexts/AuthContext';

export default function AddFieldScreen({ navigation, route }) {
  const { user } = useContext(AuthContext);
  const fieldToEdit = route.params?.field;

  const [name, setName] = useState(fieldToEdit ? fieldToEdit.name : '');
  const [size, setSize] = useState(fieldToEdit ? fieldToEdit.size : '');
  const [location, setLocation] = useState(fieldToEdit ? fieldToEdit.location : '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name || !size || !location) {
      Alert.alert("Missing Info", "Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const fieldData = {
        name,
        size, // Stored as string or number depending on input, consider parsing if needed
        location,
        userId: user.uid,
        updatedAt: serverTimestamp()
      };

      if (fieldToEdit) {
        await updateDoc(doc(db, 'fields', fieldToEdit.id), fieldData);
      } else {
        await addDoc(collection(db, 'fields'), {
          ...fieldData,
          createdAt: serverTimestamp()
        });
      }
      
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Could not save field.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{fieldToEdit ? 'Edit Field' : 'Add New Field'}</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Field Name</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. North Plot, Riverside Field"
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Size (Acres)</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. 2.5"
          value={size}
          onChangeText={setSize}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Location</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. Village Name or Coordinates"
          value={location}
          onChangeText={setLocation}
        />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Save Field</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2E8B57', marginBottom: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12,
    fontSize: 16, backgroundColor: '#FAFAFA'
  },
  saveBtn: {
    backgroundColor: '#2E8B57', padding: 16, borderRadius: 10,
    alignItems: 'center', marginTop: 10
  },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});