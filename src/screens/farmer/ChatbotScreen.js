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
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ChatbotScreen() {
  // ---------- STORAGE KEYS ----------
  const STORAGE_CURRENT = "@zarai_current_chat_v1";
  const STORAGE_SESSIONS = "@zarai_chat_sessions_v1";

  // ---------- CHAT ----------
  const [messages, setMessages] = useState([
    {
      id: "1",
      text: "Hello Hannan! I am your ZaraiVerse AI assistant. Ask me anything about your farm.",
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
  const [sessions, setSessions] = useState([]); // [{id,title,createdAt,messagesCount,messages}]
  const [activeSessionId, setActiveSessionId] = useState(null);

  const flatListRef = useRef(null);

  // ✅ Put your rotated key here
  const API_KEY = "AIzaSyBh3cgMOwkiA2rlbb049Mz5eGSAGUyxPBU";
  const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

  const axiosClient = useMemo(() => {
    return axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": API_KEY,
      },
    });
  }, [API_KEY]);

  // ---------- Helpers ----------
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const extractFullTextAndFinish = (apiResponse) => {
    const candidate = apiResponse?.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    const fullText = parts.map((p) => (typeof p?.text === "string" ? p.text : "")).join("");
    const finishReason = candidate?.finishReason;
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
      if (m.sender === "user") contents.push({ role: "user", parts: [{ text: m.text }] });
      if (m.sender === "bot") contents.push({ role: "model", parts: [{ text: m.text }] });
    }
    return contents;
  };

  // ---------- STORAGE: LOAD/SAVE ----------
  const loadFromStorage = async () => {
    try {
      const [cur, sess] = await Promise.all([
        AsyncStorage.getItem(STORAGE_CURRENT),
        AsyncStorage.getItem(STORAGE_SESSIONS),
      ]);

      if (cur) {
        const parsed = JSON.parse(cur);
        if (Array.isArray(parsed) && parsed.length) setMessages(parsed);
      }

      if (sess) {
        const parsed = JSON.parse(sess);
        if (Array.isArray(parsed)) setSessions(parsed);
      }
    } catch (e) {
      console.log("Storage load error:", e?.message);
    }
  };

  const saveCurrentChat = async (chat) => {
    try {
      await AsyncStorage.setItem(STORAGE_CURRENT, JSON.stringify(chat));
    } catch (e) {
      console.log("Storage save current error:", e?.message);
    }
  };

  const saveSessions = async (list) => {
    try {
      await AsyncStorage.setItem(STORAGE_SESSIONS, JSON.stringify(list));
    } catch (e) {
      console.log("Storage save sessions error:", e?.message);
    }
  };

  useEffect(() => {
    loadFromStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // autosave chat (debounced light)
  useEffect(() => {
    saveCurrentChat(messages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // ---------- MODEL RESOLVER ----------
  const resolveModel = async () => {
    try {
      setModelLoading(true);
      const res = await axiosClient.get("/models");
      const models = res?.data?.models || [];
      const usable = models.filter((m) =>
        (m.supportedGenerationMethods || []).includes("generateContent")
      );

      const preferred =
        usable.find((m) => m.name?.includes("gemini-2.5-flash")) ||
        usable.find((m) => m.name?.includes("gemini-1.5-flash")) ||
        usable.find((m) => m.name?.includes("flash")) ||
        usable[0];

      setModelName(preferred?.name || null);
    } catch (e) {
      console.log("ListModels error:", e?.response?.data || e.message);
      setModelName(null);
    } finally {
      setModelLoading(false);
    }
  };

  useEffect(() => {
    resolveModel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- GEMINI CALL ----------
  const callGeminiGenerateContent = async (contents, { maxOutputTokens = 1400 } = {}) => {
    const payload = {
      contents,
      generationConfig: { temperature: 0.4, maxOutputTokens },
    };

    const MAX_RETRIES = 3;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await axiosClient.post(`/${modelName}:generateContent`, payload);
        return res?.data;
      } catch (err) {
        const data = err?.response?.data;
        const msg = data?.error?.message || err.message;
        const isOverloaded =
          msg?.toLowerCase().includes("overloaded") ||
          msg?.toLowerCase().includes("resource exhausted") ||
          err?.response?.status === 429 ||
          err?.response?.status === 503;

        if (!isOverloaded || attempt === MAX_RETRIES) throw err;
        await sleep(600 * (attempt + 1));
      }
    }
  };

  const askAI = async (chatSnapshot) => {
    if (!modelName) return "AI model not available. Please check your API key.";

    const contents = buildContentsFromChat(chatSnapshot);

    const data1 = await callGeminiGenerateContent(contents, { maxOutputTokens: 1400 });
    const { fullText: t1, finishReason: r1 } = extractFullTextAndFinish(data1);
    let finalText = (t1 || "").trim();

    const needContinue = r1 === "MAX_TOKENS" || looksTruncated(finalText);
    if (needContinue) {
      const continuePrompt =
        "Continue from exactly where you stopped. Do NOT repeat. Keep the same formatting and complete the remaining points.";

      const contents2 = [
        ...contents,
        { role: "model", parts: [{ text: finalText }] },
        { role: "user", parts: [{ text: continuePrompt }] },
      ];

      const data2 = await callGeminiGenerateContent(contents2, { maxOutputTokens: 1400 });
      const { fullText: t2 } = extractFullTextAndFinish(data2);
      const more = (t2 || "").trim();
      if (more) finalText = `${finalText}\n${more}`.trim();
    }

    return finalText || "I'm sorry, I couldn't process that. Try again!";
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
      const errData = e?.response?.data;
      const msg = errData?.error?.message || e.message;
      botText = `API error: ${msg}`;
    }

    const botMsg = { id: (Date.now() + 1).toString(), text: botText, sender: "bot" };
    setMessages((prev) => [...prev, botMsg]);
    setIsLoading(false);

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
  };

  // ---------- COPY / PASTE ----------
  const copyMessage = async (text) => {
    await Clipboard.setStringAsync(text);
    Alert.alert("Copied ✅", "Message copied to clipboard.");
  };

  const pasteFromClipboard = async () => {
    const clip = await Clipboard.getStringAsync();
    if (!clip) {
      Alert.alert("Clipboard empty", "No text found in clipboard.");
      return;
    }
    setInputText((prev) => (prev ? prev + " " + clip : clip));
  };

  // ---------- HISTORY (SESSIONS) ----------
  const makeTitleFromChat = (chat) => {
    const lastUser = [...chat].reverse().find((m) => m.sender === "user");
    if (!lastUser?.text) return "New Chat";
    return lastUser.text.length > 32 ? lastUser.text.slice(0, 32) + "..." : lastUser.text;
  };

  const saveAsSessionAndNewChat = async () => {
    const chat = messages;

    // avoid saving default-only chat
    const hasUserMsg = chat.some((m) => m.sender === "user");
    if (hasUserMsg) {
      const session = {
        id: Date.now().toString(),
        title: makeTitleFromChat(chat),
        createdAt: new Date().toISOString(),
        messagesCount: chat.length,
        messages: chat,
      };

      const updated = [session, ...sessions].slice(0, 50); // keep last 50 sessions
      setSessions(updated);
      await saveSessions(updated);
      setActiveSessionId(session.id);
    }

    // new chat reset
    setMessages([
      {
        id: "1",
        text: "Hello Hannan! I am your ZaraiVerse AI assistant. Ask me anything about your farm.",
        sender: "bot",
      },
    ]);
    setInputText("");
  };

  const loadSession = (session) => {
    setMessages(session.messages || []);
    setActiveSessionId(session.id);
    setHistoryVisible(false);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
  };

  const deleteSession = async (id) => {
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    await saveSessions(updated);
    if (activeSessionId === id) setActiveSessionId(null);
  };

  // ---------- REGENERATE ----------
  const regenerateLast = async () => {
    if (isLoading || modelLoading) return;

    // find last user message and remove last bot message (if last is bot)
    const lastUserIndex = [...messages].map((m) => m.sender).lastIndexOf("user");
    if (lastUserIndex === -1) return;

    let chatSnapshot = [...messages];
    if (chatSnapshot[chatSnapshot.length - 1]?.sender === "bot") {
      chatSnapshot = chatSnapshot.slice(0, -1);
      setMessages(chatSnapshot);
    }

    setIsLoading(true);
    let botText = "";
    try {
      botText = await askAI(chatSnapshot);
    } catch (e) {
      const errData = e?.response?.data;
      const msg = errData?.error?.message || e.message;
      botText = `API error: ${msg}`;
    }

    const botMsg = { id: (Date.now() + 1).toString(), text: botText, sender: "bot" };
    setMessages((prev) => [...prev, botMsg]);
    setIsLoading(false);
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
                {modelLoading
                  ? "Connecting to AI..."
                  : modelName
                  ? `Model: ${modelName.replace("models/", "")}`
                  : "Model: Not available"}
              </Text>

              <View style={styles.headerRow2}>
                <TouchableOpacity onPress={regenerateLast} style={styles.smallBtn} disabled={isLoading}>
                  <Ionicons name="refresh" size={16} color="#fff" />
                  <Text style={styles.smallBtnText}>Regenerate</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    Alert.alert("Clear Chat", "Clear current chat?", [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Clear",
                        style: "destructive",
                        onPress: () =>
                          setMessages([
                            {
                              id: "1",
                              text: "Hello Hannan! I am your ZaraiVerse AI assistant. Ask me anything about your farm.",
                              sender: "bot",
                            },
                          ]),
                      },
                    ]);
                  }}
                  style={styles.smallBtn}
                >
                  <Ionicons name="trash-outline" size={16} color="#fff" />
                  <Text style={styles.smallBtnText}>Clear</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Messages */}
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            {/* Loading */}
            {(isLoading || modelLoading) && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#2E8B57" size="small" />
                <Text style={styles.loadingText}>
                  {modelLoading ? "Loading model..." : "AI is thinking..."}
                </Text>
              </View>
            )}

            {/* Input */}
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
                  placeholderTextColor="#888"
                  multiline={false}
                  returnKeyType="send"
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

              <Text style={styles.tipText}>
                Tip: Long-press any message to copy ✅
              </Text>
            </View>

            {/* HISTORY MODAL */}
            <Modal visible={historyVisible} animationType="slide" transparent={true}>
              <View style={styles.modalOverlay}>
                <View style={styles.modalCard}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Chat History</Text>
                    <Pressable onPress={() => setHistoryVisible(false)}>
                      <Ionicons name="close" size={22} color="#333" />
                    </Pressable>
                  </View>

                  {sessions.length === 0 ? (
                    <Text style={styles.modalEmpty}>No saved chats yet. Tap ➕ to start a new chat.</Text>
                  ) : (
                    <FlatList
                      data={sessions}
                      keyExtractor={(s) => s.id}
                      renderItem={({ item }) => (
                        <View style={styles.sessionRow}>
                          <TouchableOpacity
                            style={[
                              styles.sessionItem,
                              item.id === activeSessionId && { borderColor: "#2E8B57" },
                            ]}
                            onPress={() => loadSession(item)}
                          >
                            <Text style={styles.sessionTitle}>{item.title}</Text>
                            <Text style={styles.sessionMeta}>
                              {new Date(item.createdAt).toLocaleString()} • {item.messagesCount} msgs
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() =>
                              Alert.alert("Delete", "Delete this chat history?", [
                                { text: "Cancel", style: "cancel" },
                                {
                                  text: "Delete",
                                  style: "destructive",
                                  onPress: () => deleteSession(item.id),
                                },
                              ])
                            }
                            style={styles.sessionDelete}
                          >
                            <Ionicons name="trash-outline" size={18} color="#b00020" />
                          </TouchableOpacity>
                        </View>
                      )}
                    />
                  )}

                  <View style={styles.modalFooter}>
                    <TouchableOpacity
                      style={styles.modalBtn}
                      onPress={saveAsSessionAndNewChat}
                    >
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

  header: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#2E8B57",
    elevation: 4,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerRow2: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  headerSub: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 4, textAlign: "center" },

  headerBtns: { flexDirection: "row", gap: 10 },
  iconBtn: {
    padding: 8,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  smallBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  listContent: { padding: 15, paddingBottom: 20 },

  messageBubble: {
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
    maxWidth: "80%",
    elevation: 1,
  },
  botBubble: {
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 2,
  },
  userBubble: {
    backgroundColor: "#2E8B57",
    alignSelf: "flex-end",
    borderBottomRightRadius: 2,
  },

  messageText: { fontSize: 15, lineHeight: 22 },
  botText: { color: "#333" },
  userText: { color: "#fff" },

  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 15,
    marginBottom: 10,
  },
  loadingText: {
    marginLeft: 8,
    color: "#666",
    fontSize: 12,
    fontStyle: "italic",
  },

  inputArea: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingBottom: Platform.OS === "ios" ? 10 : 0,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    alignItems: "center",
  },

  pasteBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E9F5EF",
    marginRight: 8,
  },

  input: {
    flex: 1,
    backgroundColor: "#F0F2F5",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    fontSize: 16,
    color: "#000",
  },

  sendButton: {
    backgroundColor: "#2E8B57",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },

  tipText: {
    textAlign: "center",
    color: "#777",
    fontSize: 11,
    paddingBottom: 8,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 14,
    maxHeight: "75%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#222" },
  modalEmpty: { color: "#666", marginTop: 20, textAlign: "center" },

  sessionRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  sessionItem: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fafafa",
  },
  sessionTitle: { fontSize: 14, fontWeight: "700", color: "#222" },
  sessionMeta: { fontSize: 11, color: "#666", marginTop: 4 },
  sessionDelete: { padding: 10, marginLeft: 8 },

  modalFooter: { marginTop: 10 },
  modalBtn: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2E8B57",
    paddingVertical: 10,
    borderRadius: 14,
  },
  modalBtnText: { color: "#fff", fontWeight: "700" },
});
