// src/screens/chat/ChatScreen.js
import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../contexts/AuthContext';
import { db } from '../../services/firebase';
import {
  collection,
  addDoc,
  doc,
  setDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';

export default function ChatScreen({ route, navigation }) {
  const { user } = useContext(AuthContext);
  
  // 1. DETERMINE CHAT ID
  // If Farmer: Use 'support_USERID' so they have a private support channel.
  // If Expert: They must get chatId from the previous screen.
  const getChatId = () => {
    if (route.params?.chatId) return route.params.chatId;
    if (user?.role === 'farmer') return `support_${user.uid}`;
    return null;
  };

  const chatId = getChatId();
  const chatTitle = route.params?.title || (user?.role === 'farmer' ? 'Expert Support' : 'Chat');

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef();

  useEffect(() => {
    navigation.setOptions({ title: chatTitle });
    
    if (!chatId) return;

    // 2. LISTEN TO MESSAGES
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chatId, navigation, chatTitle]);

  const sendMessage = async () => {
    if (inputText.trim().length === 0 || !chatId) return;

    const text = inputText;
    setInputText('');

    try {
      // A. Add Message to Subcollection
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      await addDoc(messagesRef, {
        text: text,
        createdAt: serverTimestamp(),
        senderId: user.uid,
        senderName: user.name || user.email,
        role: user.role
      });

      // B. ✅ CRITICAL: Update Parent Chat Document
      // This ensures the chat appears in the Expert's list!
      const chatRef = doc(db, 'chats', chatId);
      await setDoc(chatRef, {
        lastMessage: text,
        updatedAt: serverTimestamp(),
        farmerId: user.role === 'farmer' ? user.uid : (route.params?.farmerId || ''),
        farmerName: user.role === 'farmer' ? (user.name || user.email) : (route.params?.farmerName || 'Farmer'),
      }, { merge: true });

    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === user.uid;
    return (
      <View style={[styles.messageRow, isMe ? styles.rowRight : styles.rowLeft]}>
        <View style={[styles.bubble, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
          <Text style={[styles.messageText, isMe ? styles.textRight : styles.textLeft]}>
            {item.text}
          </Text>
          <Text style={styles.timeText}>
             {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}
          </Text>
        </View>
      </View>
    );
  };

  if (!chatId) {
    return (
      <View style={styles.center}>
        <Text>Error: No Chat ID found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#2E8B57" style={styles.center} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          onLayout={() => flatListRef.current?.scrollToEnd()}
        />
      )}

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
          />
          <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
            <Ionicons name="send" size={24} color="#2E8B57" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 15, paddingBottom: 20 },
  messageRow: { flexDirection: 'row', marginBottom: 10 },
  rowRight: { justifyContent: 'flex-end' },
  rowLeft: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '75%', padding: 12, borderRadius: 15 },
  bubbleRight: { backgroundColor: '#2E8B57', borderBottomRightRadius: 2 },
  bubbleLeft: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 2 },
  messageText: { fontSize: 16 },
  textRight: { color: '#fff' },
  textLeft: { color: '#333' },
  timeText: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end', opacity: 0.7 },
  inputArea: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 20, padding: 10, marginRight: 10 },
  sendButton: { padding: 5 }
});