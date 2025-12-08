import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ChatbotScreen() {
  const [messages, setMessages] = useState([
    { id: '1', text: 'Hello! I am your ZaraiVerse AI assistant. Ask me about crop diseases, fertilizers, or weather.', sender: 'bot' }
  ]);
  const [inputText, setInputText] = useState('');

  // Simple rule-based logic to simulate AI (Replace with actual API call if needed)
  const getBotResponse = (text) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('wheat') || lowerText.includes('gandum')) {
      return "For wheat, ensure proper irrigation during the crown root initiation stage (20-25 days after sowing). Use Nitrogen fertilizers for better growth.";
    } else if (lowerText.includes('pest') || lowerText.includes('worm')) {
      return "If you see signs of pests, please upload a photo in the 'Expert Prescription' section for a specific diagnosis. For general prevention, remove weeds regularly.";
    } else if (lowerText.includes('weather') || lowerText.includes('rain')) {
      return "You can check the detailed 5-day forecast in the Weather section of the dashboard.";
    } else if (lowerText.includes('hello') || lowerText.includes('salam')) {
      return "Walaikum Assalam! How can I help you with your farm today?";
    } else {
      return "I'm not sure about that yet. Please try asking about 'wheat', 'pests', or 'weather', or contact an expert.";
    }
  };

  const handleSend = () => {
    if (inputText.trim() === '') return;

    const userMsg = { id: Date.now().toString(), text: inputText, sender: 'user' };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    // Simulate network delay
    setTimeout(() => {
      const botResponseText = getBotResponse(userMsg.text);
      const botMsg = { id: (Date.now() + 1).toString(), text: botResponseText, sender: 'bot' };
      setMessages((prev) => [...prev, botMsg]);
    }, 1000);
  };

  const renderItem = ({ item }) => {
    const isBot = item.sender === 'bot';
    return (
      <View style={[styles.messageBubble, isBot ? styles.botBubble : styles.userBubble]}>
        <Text style={[styles.messageText, isBot ? styles.botText : styles.userText]}>
          {item.text}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🤖 AI Assistant</Text>
      </View>

      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your question..."
          placeholderTextColor="#888"
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F4F8' },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#2E8B57',
    alignItems: 'center',
    elevation: 4,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  listContent: { padding: 15, paddingBottom: 80 },
  messageBubble: {
    padding: 12,
    borderRadius: 15,
    marginBottom: 10,
    maxWidth: '80%',
  },
  botBubble: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 2,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: '#2E8B57',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 2,
    elevation: 1,
  },
  messageText: { fontSize: 15, lineHeight: 22 },
  botText: { color: '#333' },
  userText: { color: '#fff' },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#2E8B57',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});