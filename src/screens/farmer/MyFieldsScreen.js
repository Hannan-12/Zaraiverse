import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../services/firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { AuthContext } from '../../contexts/AuthContext';

export default function MyFieldsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'fields'), where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFields(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = (id) => {
    Alert.alert("Delete Field", "Are you sure? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          await deleteDoc(doc(db, 'fields', id));
      }}
    ]);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('AddField', { field: item })} // Edit mode
    >
      <View style={styles.cardIcon}>
        <Ionicons name="map-outline" size={24} color="#2E8B57" />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.details}>{item.size} Acres • {item.location}</Text>
      </View>
      <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={20} color="#EF5350" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#2E8B57" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={fields}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="earth-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No fields added yet.</Text>
              <Text style={styles.emptySubText}>Add your plots of land to manage crops better.</Text>
            </View>
          }
        />
      )}

      {/* FAB to Add New Field */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('AddField')}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  list: { padding: 20 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    padding: 15, borderRadius: 12, marginBottom: 12, elevation: 2
  },
  cardIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8F5E9',
    justifyContent: 'center', alignItems: 'center', marginRight: 15
  },
  cardContent: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  details: { fontSize: 13, color: '#666', marginTop: 2 },
  deleteBtn: { padding: 8 },
  
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 10 },
  emptySubText: { fontSize: 14, color: '#888', marginTop: 5, textAlign: 'center' },

  fab: {
    position: 'absolute', bottom: 20, right: 20,
    width: 60, height: 60, borderRadius: 30, backgroundColor: '#2E8B57',
    justifyContent: 'center', alignItems: 'center', elevation: 5
  }
});