import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Ionicons } from '@expo/vector-icons';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(collection(db, 'users'));
        const querySnapshot = await getDocs(q);
        const usersList = [];
        querySnapshot.forEach((doc) => {
          usersList.push({ id: doc.id, ...doc.data() });
        });
        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (loading) return <ActivityIndicator style={styles.center} size="large" color="#333" />;

  const renderUser = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.avatar}>
        <Ionicons name="person" size={20} color="#fff" />
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name || 'Unnamed User'}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <Text style={styles.userRole}>Role: {item.role || 'user'}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList 
        data={users} 
        renderItem={renderUser} 
        keyExtractor={item => item.id}
        ListEmptyComponent={<Text style={styles.empty}>No users found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  userCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2
  },
  avatar: {
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#333', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 15
  },
  userInfo: { flex: 1 },
  userName: { fontWeight: 'bold', fontSize: 16 },
  userEmail: { color: '#666', fontSize: 14 },
  userRole: { color: '#4A90E2', fontSize: 12, fontWeight: 'bold', marginTop: 2, textTransform: 'uppercase' },
  empty: { textAlign: 'center', marginTop: 50, color: '#777' }
});