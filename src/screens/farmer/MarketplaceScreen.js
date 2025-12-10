import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function MarketplaceScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    // Only fetch products that are "In Stock"
    const q = query(collection(db, 'products'), where('stockStatus', '==', 'In Stock'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prodList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(prodList);
      setFilteredProducts(prodList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSearch = (text) => {
    setSearch(text);
    if (text) {
      const newData = products.filter((item) => {
        const itemData = item.name ? item.name.toUpperCase() : ''.toUpperCase();
        const textData = text.toUpperCase();
        return itemData.indexOf(textData) > -1;
      });
      setFilteredProducts(newData);
    } else {
      setFilteredProducts(products);
    }
  };

  const renderProduct = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ProductDetails', { product: item })}
    >
      <Image
        source={{ uri: item.image || 'https://placehold.co/400' }}
        style={styles.image}
      />
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.price}>Rs. {item.price}</Text>
      </View>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => navigation.navigate('ProductDetails', { product: item })}
      >
        <Ionicons name="arrow-forward-circle" size={30} color="#2E8B57" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search seeds, tools, fertilizers..."
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2E8B57" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No products found.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FFF9' },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 16,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
  },
  searchInput: { marginLeft: 10, flex: 1, fontSize: 16 },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    padding: 10,
    alignItems: 'center',
    elevation: 3,
  },
  image: { width: 80, height: 80, borderRadius: 10, backgroundColor: '#eee' },
  infoContainer: { flex: 1, marginLeft: 15 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  category: { fontSize: 12, color: '#777', marginBottom: 5 },
  price: { fontSize: 16, fontWeight: 'bold', color: '#2E8B57' },
  empty: { textAlign: 'center', marginTop: 50, color: '#777' },
});