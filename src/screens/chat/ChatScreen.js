// src/screens/chat/ChatScreen.js
import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../contexts/AuthContext';
import { db } from '../../services/firebase';
import {
  collection, addDoc, doc, setDoc, query, orderBy,
  onSnapshot, serverTimestamp, arrayUnion 
} from 'firebase/firestore';

export default function ChatScreen({ route, navigation }) {
  const { user } = useContext(AuthContext);
  
  const chatId = route.params?.chatId || (user?.role === 'farmer' ? `support_${user.uid}` : null);
  const chatTitle = route.params?.title || (user?.role === 'farmer' ? 'Expert Support' : 'Chat');

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef();

  useEffect(() => {
    navigation.setOptions({ title: chatTitle });
    if (!chatId) return;

    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [chatId]);

  const sendMessage = async () => {
    if (inputText.trim().length === 0 || !chatId) return;
    const text = inputText;
    setInputText('');

    try {
      // 1. Send the message
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text, createdAt: serverTimestamp(), senderId: user.uid, senderName: user.name || user.email, role: user.role
      });

      // 2. Update parent chat so it shows up for Experts
      await setDoc(doc(db, 'chats', chatId), {
        lastMessage: text,
        updatedAt: serverTimestamp(),
        type: 'support', // Required for ExpertChatList query
        participants: arrayUnion(user.uid), // Required for Security Rules
        farmerId: user.role === 'farmer' ? user.uid : (route.params?.farmerId || ''),
        farmerName: user.role === 'farmer' ? (user.name || user.email) : (route.params?.title || 'Farmer'),
      }, { merge: true });
    } catch (e) { console.error(e); }
  };

  if (!chatId) return <View style={styles.center}><Text>Chat initialization error.</Text></View>;

  return (
    <View style={styles.container}>
      {loading ? <ActivityIndicator style={styles.center} /> : (
        <FlatList ref={flatListRef} data={messages} keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const isMe = item.senderId === user.uid;
            return (
              <View style={[styles.messageRow, isMe ? styles.rowRight : styles.rowLeft]}>
                <View style={[styles.bubble, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
                  <Text style={[styles.messageText, isMe ? styles.textRight : styles.textLeft]}>{item.text}</Text>
                </View>
              </View>
            );
          }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />
      )}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.inputArea}>
          <TextInput style={styles.input} value={inputText} onChangeText={setInputText} placeholder="Type a message..." />
          <TouchableOpacity onPress={sendMessage}><Ionicons name="send" size={24} color="#2E8B57" /></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messageRow: { flexDirection: 'row', marginBottom: 10, paddingHorizontal: 15 },
  rowRight: { justifyContent: 'flex-end' },
  rowLeft: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 15 },
  bubbleRight: { backgroundColor: '#2E8B57' },
  bubbleLeft: { backgroundColor: '#FFF' },
  messageText: { fontSize: 16 },
  textRight: { color: '#fff' },
  textLeft: { color: '#333' },
  inputArea: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, marginRight: 10 }
});