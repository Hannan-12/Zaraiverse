import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Alert, ActivityIndicator, Image 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db } from '../../services/firebase';
import { collection, query, onSnapshot, doc, deleteDoc, updateDoc, where } from 'firebase/firestore'; // Added 'where'
import { useAuth } from '../../contexts/AuthContext'; // Import to get current user

export default function ManageProducts() {
  const { user } = useAuth(); // Get current seller's info
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // ✅ Filter by sellerId so the list matches the dashboard count
    const q = query(
      collection(db, 'products'), 
      where('sellerId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const toggleStock = async (id, current) => {
    const next = current === 'In Stock' ? 'Out of Stock' : 'In Stock';
    await updateDoc(doc(db, 'products', id), { stockStatus: next });
  };

  const renderProduct = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.img} />
      <View style={styles.info}>
        <View style={styles.row}>
          <Text style={styles.name}>{item.name}</Text>
          <TouchableOpacity onPress={() => deleteDoc(doc(db, 'products', item.id))}>
            <MaterialCommunityIcons name="delete-outline" size={22} color="#C62828" />
          </TouchableOpacity>
        </View>
        <Text style={styles.price}>Rs. {item.price}</Text>
        <TouchableOpacity 
          style={[styles.statusBtn, { backgroundColor: item.stockStatus === 'In Stock' ? '#E8F5E9' : '#FFEBEE' }]}
          onPress={() => toggleStock(item.id, item.stockStatus)}
        >
          <Text style={{ color: item.stockStatus === 'In Stock' ? '#2E7D32' : '#C62828', fontWeight: 'bold' }}>
            {item.stockStatus} (Tap to change)
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) return <ActivityIndicator size="large" color="#2E8B57" style={{marginTop: 50}} />;

  return (
    <View style={styles.container}>
      <FlatList 
        data={products} 
        renderItem={renderProduct} 
        keyExtractor={item => item.id} 
        contentContainerStyle={{padding: 16}} 
        ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 20}}>No products found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF9' },
  card: { backgroundColor: '#fff', borderRadius: 15, padding: 12, marginBottom: 15, flexDirection: 'row', elevation: 3 },
  img: { width: 80, height: 80, borderRadius: 10, backgroundColor: '#f0f0f0' },
  info: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { fontSize: 16, fontWeight: 'bold' },
  price: { color: '#2E7D32', fontWeight: 'bold', marginVertical: 4 },
  statusBtn: { padding: 6, borderRadius: 8, alignSelf: 'flex-start' }
});