import React, { useEffect, useState, useContext } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  Image, 
  TouchableOpacity 
} from 'react-native';
import { db } from '../../services/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { AuthContext } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

export default function MyQueriesScreen() {
  const { user } = useContext(AuthContext);
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'expert_requests'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : new Date()
      }));
      setQueries(list);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching queries:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const renderItem = ({ item }) => {
    const isPending = item.status === 'pending';
    
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.cropName}>{item.cropName}</Text>
          <View style={[styles.badge, { backgroundColor: isPending ? '#FFF3E0' : '#E8F5E9' }]}>
            <Text style={[styles.statusText, { color: isPending ? '#F57C00' : '#2E7D32' }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.date}>{format(item.createdAt, 'MMM d, yyyy • h:mm a')}</Text>
        
        <Text style={styles.label}>Your Question:</Text>
        <Text style={styles.description}>{item.description}</Text>

        {item.image && (
          <Image source={{ uri: item.image }} style={styles.thumbnail} />
        )}

        {/* Expert Response Section */}
        {!isPending && item.response ? (
          <View style={styles.responseBox}>
            <View style={styles.expertHeader}>
              <Ionicons name="medkit" size={16} color="#2E8B57" />
              <Text style={styles.expertTitle}>Expert Response</Text>
            </View>
            <Text style={styles.responseText}>{item.response}</Text>
          </View>
        ) : (
          <View style={styles.pendingBox}>
            <Ionicons name="time-outline" size={16} color="#777" />
            <Text style={styles.pendingText}>Waiting for an expert to review...</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2E8B57" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={queries}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No queries sent yet.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  cropName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  date: { fontSize: 12, color: '#999', marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 4 },
  description: { fontSize: 15, color: '#333', lineHeight: 22, marginBottom: 10 },
  thumbnail: { width: '100%', height: 150, borderRadius: 8, marginBottom: 10, backgroundColor: '#eee' },
  responseBox: {
    marginTop: 10,
    backgroundColor: '#F1F8E9',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2E8B57'
  },
  expertHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  expertTitle: { fontWeight: 'bold', color: '#2E8B57', marginLeft: 6 },
  responseText: { color: '#333', lineHeight: 20 },
  pendingBox: { flexDirection: 'row', alignItems: 'center', marginTop: 10, padding: 5 },
  pendingText: { color: '#777', marginLeft: 6, fontStyle: 'italic' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' }
});