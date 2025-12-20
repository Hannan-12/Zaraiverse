import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { AuthContext } from '../../contexts/AuthContext';

export default function ChatHistoryScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChats(list);
      setFilteredChats(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleSearch = (text) => {
    setSearch(text);
    if (!text) {
      setFilteredChats(chats);
      return;
    }
    const filtered = chats.filter(chat => {
      const otherName = chat.participantNames?.find(name => name !== user.displayName) || '';
      return otherName.toLowerCase().includes(text.toLowerCase());
    });
    setFilteredChats(filtered);
  };

  const renderItem = ({ item }) => {
    const otherName = item.participantNames ? item.participantNames.find(n => n !== user.displayName) || 'User' : 'Support';
    return (
      <TouchableOpacity style={styles.chatItem} onPress={() => navigation.navigate('Chat', { chatId: item.id, title: otherName })}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{otherName[0]}</Text></View>
        <View style={styles.info}>
          <Text style={styles.name}>{otherName}</Text>
          <Text style={styles.lastMsg} numberOfLines={1}>{item.lastMessage || 'View conversation'}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={{ marginRight: 10 }} />
        <TextInput 
          placeholder="Search conversations..." 
          style={styles.searchInput} 
          value={search} 
          onChangeText={handleSearch} 
        />
      </View>
      <FlatList 
        data={filteredChats} 
        renderItem={renderItem} 
        keyExtractor={item => item.id} 
        contentContainerStyle={styles.list} 
        ListEmptyComponent={<Text style={styles.emptyText}>No matching history found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  searchContainer: { flexDirection: 'row', backgroundColor: '#f0f0f0', margin: 15, padding: 10, borderRadius: 10, alignItems: 'center' },
  searchInput: { flex: 1, fontSize: 16 },
  list: { paddingHorizontal: 15 },
  chatItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { fontSize: 20, color: '#2E8B57', fontWeight: 'bold' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold' },
  lastMsg: { fontSize: 14, color: '#777' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#888' }
});