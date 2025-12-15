// src/screens/expert/ExpertChatList.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function ExpertChatList() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    // 1. Query all active chats, ordered by most recent message
    const q = query(collection(db, 'chats'), orderBy('updatedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChats(chatList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.chatItem}
      onPress={() => navigation.navigate('ChatScreen', { 
        chatId: item.id,
        title: item.farmerName,
        farmerId: item.farmerId
      })}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.farmerName ? item.farmerName.charAt(0).toUpperCase() : 'U'}
        </Text>
      </View>
      <View style={styles.chatInfo}>
        <Text style={styles.name}>{item.farmerName || 'Unknown Farmer'}</Text>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.lastMessage || 'No messages yet...'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  if (loading) return <ActivityIndicator style={styles.center} size="large" color="#2E8B57" />;

  return (
    <View style={styles.container}>
      {chats.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No active chats.</Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          renderItem={renderItem}
          keyExtractor={item => item.id}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#888', fontSize: 16 },
  chatItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center'
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFB74D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  chatInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  lastMessage: { fontSize: 14, color: '#888', marginTop: 2 }
});