import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { AuthContext } from '../../contexts/AuthContext';

export default function ChatHistoryScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Fetch chats where the current user is a participant
    // Note: Requires "participants" array in your chat document structure
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChats(chatList);
      setLoading(false);
    }, (err) => {
      console.log("Chat fetch error (might need index):", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const renderItem = ({ item }) => {
    // Basic logic to find the "other" person's name
    const otherName = item.participantNames 
      ? item.participantNames.find(name => name !== user.displayName) || 'Support Agent'
      : 'Support';

    return (
      <TouchableOpacity 
        style={styles.chatItem}
        onPress={() => navigation.navigate('Chat', { chatId: item.id, title: otherName })}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{otherName[0]}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{otherName}</Text>
          <Text style={styles.lastMsg} numberOfLines={1}>
            {item.lastMessage || 'Tap to view conversation'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </TouchableOpacity>
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
        data={chats}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="chatbubbles-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>No conversation history.</Text>
            <TouchableOpacity 
              style={styles.startBtn}
              onPress={() => navigation.navigate('Chat', { chatId: 'general_support', title: 'General Support' })}
            >
              <Text style={styles.btnText}>Start Support Chat</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { alignItems: 'center', marginTop: 50 },
  list: { padding: 15 },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  avatarText: { fontSize: 20, color: '#2E8B57', fontWeight: 'bold' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  lastMsg: { fontSize: 14, color: '#777', marginTop: 2 },
  emptyText: { marginTop: 10, color: '#777' },
  startBtn: { marginTop: 20, backgroundColor: '#2E8B57', padding: 12, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: 'bold' }
});