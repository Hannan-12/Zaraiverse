import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
  Alert,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import * as Clipboard from "expo-clipboard";
import { GROQ_API_KEY, GROQ_BASE } from "../../config/keys";
import AsyncStorage from "@react-native-async-storage/async-storage";

// --- FIREBASE IMPORTS ---
import { db } from "../../services/firebase"; //
import { useAuth } from "../../contexts/AuthContext"; //
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from "firebase/firestore";

export default function ChatbotScreen() {
  const { user } = useAuth(); //
  const userId = user?.uid;

  // ---------- STORAGE KEYS (Keeping local storage for current draft only) ----------
  const STORAGE_CURRENT = "@zarai_current_chat_v1";

  // ---------- CHAT ----------
  const [messages, setMessages] = useState([
    {
      id: "1",
      text: "Assalam-o-Alaikum! I am your ZaraiVerse AI assistant. Ask me anything about your crops, soil, irrigation, pests, or farming techniques — I'm here to help!",
      sender: "bot",
    },
  ]);

  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ---------- MODEL ----------
  const [modelName, setModelName] = useState(null);
  const [modelLoading, setModelLoading] = useState(true);

  // ---------- HISTORY UI ----------
  const [historyVisible, setHistoryVisible] = useState(false);
  const [sessions, setSessions] = useState([]); 
  const [activeSessionId, setActiveSessionId] = useState(null);

  const flatListRef = useRef(null);

  const axiosClient = useMemo(() => {
    return axios.create({
      baseURL: GROQ_BASE,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
    });
  }, []);

  // ---------- Helpers ----------
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const extractFullTextAndFinish = (apiResponse) => {
    const choice = apiResponse?.choices?.[0];
    const fullText = choice?.message?.content || "";
    const finishReason = choice?.finish_reason;
    return { fullText, finishReason };
  };

  const looksTruncated = (text) => {
    if (!text) return false;
    const t = text.trim();
    const badEndings = ["**", "*", "-", ":", ",", "(", "and", "or"];
    if (badEndings.some((x) => t.endsWith(x))) return true;
    const last = t.slice(-1);
    const ok = [".", "!", "?", "”", "’", "\""];
    if (!ok.includes(last) && t.length > 120) return true;
    return false;
  };

  const buildContentsFromChat = (chat) => {
    const contents = [];
    for (const m of chat) {
      if (m.sender === "user") contents.push({ role: "user", content: m.text });
      if (m.sender === "bot") contents.push({ role: "assistant", content: m.text });
    }
    return contents;
  };

  // ---------- FIREBASE / STORAGE LOGIC ----------
  
  // Load current unsaved chat from local storage
  const loadCurrentFromStorage = async () => {
    try {
      const cur = await AsyncStorage.getItem(STORAGE_CURRENT);
      if (cur) {
        const parsed = JSON.parse(cur);
        if (Array.isArray(parsed) && parsed.length) setMessages(parsed);
      }
    } catch (e) {
      console.log("Storage load error:", e?.message);
    }
  };

  // Fetch all saved sessions from Firestore for this user
  const loadSessionsFromFirebase = async () => {
    if (!userId) return;
    try {
      const q = query(
        collection(db, "users", userId, "chat_history"), 
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const fetchedSessions = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
        // Convert Firestore timestamp to ISO string for UI compatibility
        createdAt: docSnap.data().createdAt?.toDate().toISOString() || new Date().toISOString()
      }));
      setSessions(fetchedSessions);
    } catch (e) {
      console.log("Error fetching sessions:", e.message);
    }
  };

  const saveCurrentChatLocally = async (chat) => {
    try {
      await AsyncStorage.setItem(STORAGE_CURRENT, JSON.stringify(chat));
    } catch (e) {
      console.log("Storage save current error:", e?.message);
    }
  };

  useEffect(() => {
    loadCurrentFromStorage();
    if (userId) loadSessionsFromFirebase();
  }, [userId]);

  useEffect(() => {
    saveCurrentChatLocally(messages);
  }, [messages]);

  // ---------- MODEL RESOLVER ----------
  useEffect(() => {
    setModelName("llama-3.3-70b-versatile");
    setModelLoading(false);
  }, []);

  // ---------- SYSTEM INSTRUCTION ----------
  const SYSTEM_INSTRUCTION = `You are ZaraiVerse AI — a smart, helpful agricultural assistant for Pakistani farmers.

Your role:
- Answer questions about crops, soil, irrigation, fertilizers, pesticides, seeds, and farming techniques.
- Provide advice on equipment rental and usage for farming.
- Help with weather-related farming decisions.
- Offer guidance on pest control and disease management in crops.
- Suggest best practices for common Pakistani crops: wheat, rice, sugarcane, cotton, maize, and vegetables.

Rules you MUST follow:
1. Give SPECIFIC, ACTIONABLE answers — never give vague or generic advice.
2. NEVER repeat the same answer you gave before in this conversation. If asked a similar question, give a different angle or more detail.
3. Keep answers concise and easy to understand. Use bullet points for lists.
4. If a question is completely unrelated to farming or agriculture, politely redirect: "I'm specialized in agricultural topics. Could you ask me something about farming?"
5. When giving recommendations, always mention quantities, timings, or specific product names when relevant.
6. Use simple Urdu/English terms where helpful (e.g., write "کھاد (fertilizer)").
7. Do not start consecutive responses with the same opening phrase.`;

  // ---------- GROQ CALL ----------
  const callGroqChat = async (contents, { maxOutputTokens = 1400 } = {}) => {
    const messages = [
      { role: "system", content: SYSTEM_INSTRUCTION },
      ...contents,
    ];
    const payload = {
      model: modelName,
      messages,
      temperature: 0.7,
      max_tokens: maxOutputTokens,
      top_p: 0.9,
    };

    const MAX_RETRIES = 3;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await axiosClient.post("/chat/completions", payload);
        return res?.data;
      } catch (err) {
        const data = err?.response?.data;
        const msg = data?.error?.message || err.message;
        const isOverloaded = msg?.toLowerCase().includes("overloaded") || err?.response?.status === 429;
        if (!isOverloaded || attempt === MAX_RETRIES) throw err;
        await sleep(600 * (attempt + 1));
      }
    }
  };

  const askAI = async (chatSnapshot) => {
    if (!modelName) return "AI model not available. Please check your API key.";
    const contents = buildContentsFromChat(chatSnapshot);
    const data1 = await callGroqChat(contents, { maxOutputTokens: 1400 });
    const { fullText: t1, finishReason: r1 } = extractFullTextAndFinish(data1);
    let finalText = (t1 || "").trim();

    if (r1 === "length" || looksTruncated(finalText)) {
      const continuePrompt = "Continue from exactly where you stopped.";
      const contents2 = [...contents, { role: "assistant", content: finalText }, { role: "user", content: continuePrompt }];
      const data2 = await callGroqChat(contents2, { maxOutputTokens: 1400 });
      const { fullText: t2 } = extractFullTextAndFinish(data2);
      if (t2) finalText = `${finalText}\n${t2}`.trim();
    }
    return finalText || "I'm sorry, I couldn't process that.";
  };

  // ---------- SEND ----------
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isLoading || modelLoading) return;

    const userMsg = { id: Date.now().toString(), text, sender: "user" };
    const chatSnapshot = [...messages, userMsg];
    setMessages(chatSnapshot);
    setInputText("");
    setIsLoading(true);

    let botText = "";
    try {
      botText = await askAI(chatSnapshot);
    } catch (e) {
      botText = `API error: ${e?.response?.data?.error?.message || e.message}`;
    }

    const botMsg = { id: (Date.now() + 1).toString(), text: botText, sender: "bot" };
    setMessages((prev) => [...prev, botMsg]);
    setIsLoading(false);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
  };

  // ---------- ACTIONS ----------
  const copyMessage = async (text) => {
    await Clipboard.setStringAsync(text);
    Alert.alert("Copied ✅", "Message copied to clipboard.");
  };

  const pasteFromClipboard = async () => {
    const clip = await Clipboard.getStringAsync();
    if (clip) setInputText((prev) => (prev ? prev + " " + clip : clip));
  };

  const makeTitleFromChat = (chat) => {
    const lastUser = [...chat].reverse().find((m) => m.sender === "user");
    if (!lastUser?.text) return "New Chat";
    return lastUser.text.length > 32 ? lastUser.text.slice(0, 32) + "..." : lastUser.text;
  };

  // Save to Firebase Firestore instead of AsyncStorage
  const saveAsSessionAndNewChat = async () => {
    const chat = messages;
    const hasUserMsg = chat.some((m) => m.sender === "user");

    if (hasUserMsg && userId) {
      const sessionData = {
        title: makeTitleFromChat(chat),
        createdAt: serverTimestamp(),
        messagesCount: chat.length,
        messages: chat,
      };

      try {
        const docRef = await addDoc(collection(db, "users", userId, "chat_history"), sessionData);
        // Add to local state list immediately
        const newLocalSession = { 
          id: docRef.id, 
          ...sessionData, 
          createdAt: new Date().toISOString() 
        };
        setSessions([newLocalSession, ...sessions]);
      } catch (e) {
        Alert.alert("Error", "Could not save chat to cloud.");
        console.log("Firestore error:", e);
      }
    }

    setMessages([{
      id: "1",
      text: "Assalam-o-Alaikum! I am your ZaraiVerse AI assistant. Ask me anything about your crops, soil, irrigation, pests, or farming techniques — I'm here to help!",
      sender: "bot",
    }]);
    setInputText("");
  };

  const loadSession = (session) => {
    setMessages(session.messages || []);
    setActiveSessionId(session.id);
    setHistoryVisible(false);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
  };

  const deleteSession = async (id) => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, "users", userId, "chat_history", id));
      setSessions(sessions.filter((s) => s.id !== id));
      if (activeSessionId === id) setActiveSessionId(null);
    } catch (e) {
      Alert.alert("Error", "Failed to delete chat history.");
    }
  };

  const regenerateLast = async () => {
    if (isLoading || modelLoading) return;
    const lastUserIndex = [...messages].map((m) => m.sender).lastIndexOf("user");
    if (lastUserIndex === -1) return;

    let chatSnapshot = [...messages];
    if (chatSnapshot[chatSnapshot.length - 1]?.sender === "bot") {
      chatSnapshot = chatSnapshot.slice(0, -1);
      setMessages(chatSnapshot);
    }

    setIsLoading(true);
    try {
      const botText = await askAI(chatSnapshot);
      const botMsg = { id: (Date.now() + 1).toString(), text: botText, sender: "bot" };
      setMessages((prev) => [...prev, botMsg]);
    } catch (e) {
      console.log(e);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------- RENDER ----------
  const renderItem = ({ item }) => {
    const isBot = item.sender === "bot";
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onLongPress={() => copyMessage(item.text)}
        style={[styles.messageBubble, isBot ? styles.botBubble : styles.userBubble]}
      >
        <Text style={[styles.messageText, isBot ? styles.botText : styles.userText]}>
          {item.text}
        </Text>
      </TouchableOpacity>
    );
  };

  const canSend = inputText.trim().length > 0 && !isLoading && !modelLoading;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#2E8B57" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerRow}>
                <Text style={styles.headerTitle}>🌱 ZaraiVerse AI</Text>
                <View style={styles.headerBtns}>
                  <TouchableOpacity onPress={() => setHistoryVisible(true)} style={styles.iconBtn}>
                    <Ionicons name="time-outline" size={20} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={saveAsSessionAndNewChat} style={styles.iconBtn}>
                    <Ionicons name="add-circle-outline" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.headerSub}>
                {modelLoading ? "Connecting..." : modelName ? `Model: ${modelName}` : "Offline"}
              </Text>
              <View style={styles.headerRow2}>
                <TouchableOpacity onPress={regenerateLast} style={styles.smallBtn} disabled={isLoading}>
                  <Ionicons name="refresh" size={16} color="#fff" />
                  <Text style={styles.smallBtnText}>Regenerate</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => Alert.alert("Clear", "Clear current chat?", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Clear", style: "destructive", onPress: () => setMessages([{ id: "1", text: "Assalam-o-Alaikum! I am your ZaraiVerse AI assistant. Ask me anything about your crops, soil, irrigation, pests, or farming techniques — I'm here to help!", sender: "bot" }]) }
                  ])}
                  style={styles.smallBtn}
                >
                  <Ionicons name="trash-outline" size={16} color="#fff" />
                  <Text style={styles.smallBtnText}>Clear</Text>
                </TouchableOpacity>
              </View>
            </View>

            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            {(isLoading || modelLoading) && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#2E8B57" size="small" />
                <Text style={styles.loadingText}>{modelLoading ? "Loading model..." : "AI is thinking..."}</Text>
              </View>
            )}

            <View style={styles.inputArea}>
              <View style={styles.inputContainer}>
                <TouchableOpacity onPress={pasteFromClipboard} style={styles.pasteBtn}>
                  <Ionicons name="clipboard-outline" size={20} color="#2E8B57" />
                </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Ask a question..."
                  onSubmitEditing={handleSend}
                  editable={!isLoading && !modelLoading}
                />
                <TouchableOpacity
                  style={[styles.sendButton, !canSend && { opacity: 0.5 }]}
                  onPress={handleSend}
                  disabled={!canSend}
                >
                  <Ionicons name="send" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
              <Text style={styles.tipText}>Tip: Long-press any message to copy ✅</Text>
            </View>

            {/* HISTORY MODAL */}
            <Modal visible={historyVisible} animationType="slide" transparent={true}>
              <View style={styles.modalOverlay}>
                <View style={styles.modalCard}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Cloud Chat History</Text>
                    <Pressable onPress={() => setHistoryVisible(false)}>
                      <Ionicons name="close" size={22} color="#333" />
                    </Pressable>
                  </View>
                  {sessions.length === 0 ? (
                    <Text style={styles.modalEmpty}>No saved chats found in cloud.</Text>
                  ) : (
                    <FlatList
                      data={sessions}
                      keyExtractor={(s) => s.id}
                      renderItem={({ item }) => (
                        <View style={styles.sessionRow}>
                          <TouchableOpacity
                            style={[styles.sessionItem, item.id === activeSessionId && { borderColor: "#2E8B57" }]}
                            onPress={() => loadSession(item)}
                          >
                            <Text style={styles.sessionTitle}>{item.title}</Text>
                            <Text style={styles.sessionMeta}>{new Date(item.createdAt).toLocaleString()} • {item.messagesCount} msgs</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => deleteSession(item.id)} style={styles.sessionDelete}>
                            <Ionicons name="trash-outline" size={18} color="#b00020" />
                          </TouchableOpacity>
                        </View>
                      )}
                    />
                  )}
                  <View style={styles.modalFooter}>
                    <TouchableOpacity style={styles.modalBtn} onPress={saveAsSessionAndNewChat}>
                      <Ionicons name="add-circle-outline" size={18} color="#fff" />
                      <Text style={styles.modalBtnText}>New Chat</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F4F8" },
  header: { paddingVertical: 12, paddingHorizontal: 12, backgroundColor: "#2E8B57", elevation: 4, borderBottomLeftRadius: 15, borderBottomRightRadius: 15 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerRow2: { flexDirection: "row", gap: 10, marginTop: 10, justifyContent: "center" },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  headerSub: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 4, textAlign: "center" },
  headerBtns: { flexDirection: "row", gap: 10 },
  iconBtn: { padding: 8, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.18)" },
  smallBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.18)" },
  smallBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  listContent: { padding: 15, paddingBottom: 20 },
  messageBubble: { padding: 14, borderRadius: 18, marginBottom: 10, maxWidth: "80%", elevation: 1 },
  botBubble: { backgroundColor: "#fff", alignSelf: "flex-start", borderBottomLeftRadius: 2 },
  userBubble: { backgroundColor: "#2E8B57", alignSelf: "flex-end", borderBottomRightRadius: 2 },
  messageText: { fontSize: 15, lineHeight: 22 },
  botText: { color: "#333" },
  userText: { color: "#fff" },
  loadingContainer: { flexDirection: "row", alignItems: "center", marginLeft: 15, marginBottom: 10 },
  loadingText: { marginLeft: 8, color: "#666", fontSize: 12, fontStyle: "italic" },
  inputArea: { backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#eee", paddingBottom: Platform.OS === "ios" ? 10 : 0 },
  inputContainer: { flexDirection: "row", padding: 10, alignItems: "center" },
  pasteBtn: { width: 42, height: 42, borderRadius: 21, justifyContent: "center", alignItems: "center", backgroundColor: "#E9F5EF", marginRight: 8 },
  input: { flex: 1, backgroundColor: "#F0F2F5", borderRadius: 25, paddingHorizontal: 16, paddingVertical: 10, marginRight: 10, fontSize: 16, color: "#000" },
  sendButton: { backgroundColor: "#2E8B57", width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  tipText: { textAlign: "center", color: "#777", fontSize: 11, paddingBottom: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#fff", borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 14, maxHeight: "75%" },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#222" },
  modalEmpty: { color: "#666", marginTop: 20, textAlign: "center" },
  sessionRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  sessionItem: { flex: 1, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: "#eee", backgroundColor: "#fafafa" },
  sessionTitle: { fontSize: 14, fontWeight: "700", color: "#222" },
  sessionMeta: { fontSize: 11, color: "#666", marginTop: 4 },
  sessionDelete: { padding: 10, marginLeft: 8 },
  modalFooter: { marginTop: 10 },
  modalBtn: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#2E8B57", paddingVertical: 10, borderRadius: 14 },
  modalBtnText: { color: "#fff", fontWeight: "700" },
});