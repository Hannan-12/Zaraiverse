// src/screens/farmer/TaskRemindersScreen.js
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  TextInput,
  Alert,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; // Modern Gradient
import { AuthContext } from '../../contexts/AuthContext';
import { db } from '../../services/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  getDocs,
  writeBatch,
  orderBy,
} from 'firebase/firestore';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

// --- Notification Handler ---
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function TaskRemindersScreen() {
  // --- STATE ---
  const [tasks, setTasks] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [taskText, setTaskText] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [taskTime, setTaskTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  const { user } = useContext(AuthContext);

  // --- LOGIC (Kept same as before) ---
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    requestNotificationPermissions();
    cleanupOldTasks(user.uid);

    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid),
      orderBy('taskTime', 'asc') // Changed to 'asc' so soonest tasks are at top
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tasksData = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
          taskTime: doc.data().taskTime.toDate(),
        }));
        setTasks(tasksData);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching tasks: ', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  async function requestNotificationPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      // Optional: Handle permission denial gracefully
    }
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default Channel',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  }

  const cleanupOldTasks = async (userId) => {
    try {
      const now = Timestamp.now();
      const q = query(
        collection(db, 'tasks'),
        where('userId', '==', userId),
        where('taskTime', '<', now)
      );
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    } catch (error) {
      console.error('Error cleaning tasks:', error);
    }
  };

  const scheduleNotification = async (task, taskId) => {
    if (task.taskTime.getTime() <= new Date().getTime()) return null;
    try {
      return await Notifications.scheduleNotificationAsync({
        content: { title: 'Task Reminder', body: task.title, data: { taskId } },
        trigger: { date: task.taskTime },
      });
    } catch (e) {
      return null;
    }
  };

  const cancelNotification = async (notifId) => {
    if (notifId) await Notifications.cancelScheduledNotificationAsync(notifId);
  };

  // --- CRUD HANDLERS ---
  const handleOpenModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      setTaskText(task.title);
      setTaskTime(task.taskTime);
    } else {
      setEditingTask(null);
      setTaskText('');
      const nextTime = new Date();
      nextTime.setMinutes(nextTime.getMinutes() + 30);
      setTaskTime(nextTime);
    }
    setIsModalVisible(true);
  };

  const handleSaveTask = async () => {
    if (!taskText.trim()) {
      Alert.alert('Missing Title', 'Please enter a task title.');
      return;
    }
    const taskData = {
      title: taskText,
      taskTime: Timestamp.fromDate(taskTime),
      completed: false,
      userId: user.uid,
    };

    try {
      if (editingTask) {
        if (editingTask.notificationId) await cancelNotification(editingTask.notificationId);
        const notifId = await scheduleNotification({ ...taskData, taskTime }, editingTask.id);
        await updateDoc(doc(db, 'tasks', editingTask.id), {
          ...taskData,
          notificationId: notifId || null,
        });
      } else {
        const docRef = await addDoc(collection(db, 'tasks'), { ...taskData, notificationId: null });
        const notifId = await scheduleNotification({ ...taskData, taskTime }, docRef.id);
        if (notifId) await updateDoc(docRef, { notificationId: notifId });
      }
      setIsModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Could not save task.');
    }
  };

  const handleDeleteTask = (task) => {
    Alert.alert('Delete Task', 'Remove this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await cancelNotification(task.notificationId);
          await deleteDoc(doc(db, 'tasks', task.id));
        },
      },
    ]);
  };

  const toggleTaskCompletion = async (task) => {
    const newStatus = !task.completed;
    await updateDoc(doc(db, 'tasks', task.id), { completed: newStatus });
    if (newStatus && task.notificationId) {
      await cancelNotification(task.notificationId);
      await updateDoc(doc(db, 'tasks', task.id), { notificationId: null });
    }
  };

  // --- RENDER ITEM (Modern Card) ---
  const renderTaskItem = ({ item }) => {
    const isCompleted = item.completed;
    return (
      <View style={[styles.card, isCompleted && styles.cardCompleted]}>
        {/* Color Strip */}
        <View style={[styles.cardStrip, { backgroundColor: isCompleted ? '#B0BEC5' : '#2E8B57' }]} />
        
        <View style={styles.cardContent}>
          {/* Checkbox Area */}
          <TouchableOpacity
            onPress={() => toggleTaskCompletion(item)}
            style={[styles.checkboxBase, isCompleted && styles.checkboxChecked]}
          >
            {isCompleted && <Ionicons name="checkmark" size={18} color="#fff" />}
          </TouchableOpacity>

          {/* Text Area */}
          <View style={styles.textContainer}>
            <Text style={[styles.taskTitle, isCompleted && styles.textCompleted]} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.dateRow}>
              <Ionicons name="time-outline" size={14} color={isCompleted ? '#999' : '#2E8B57'} />
              <Text style={styles.taskDate}>
                {format(item.taskTime, 'MMM d, h:mm a')}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => handleOpenModal(item)} style={styles.actionBtn}>
              <Ionicons name="pencil-outline" size={20} color="#78909C" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteTask(item)} style={styles.actionBtn}>
              <Ionicons name="trash-outline" size={20} color="#EF5350" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2E8B57" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* --- HEADER GRADIENT --- */}
      <LinearGradient
        colors={['#2E8B57', '#1B5E20']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Tasks</Text>
          <Text style={styles.headerSubtitle}>Stay organized & productive</Text>
        </View>
      </LinearGradient>

      {/* --- TASK LIST --- */}
      <FlatList
        data={tasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="calendar-outline" size={50} color="#2E8B57" />
            </View>
            <Text style={styles.emptyTitle}>No Tasks Yet</Text>
            <Text style={styles.emptySubtitle}>Tap the + button to add a new reminder.</Text>
          </View>
        }
      />

      {/* --- FAB (Floating Action Button) --- */}
      <TouchableOpacity
        style={styles.fabContainer}
        onPress={() => handleOpenModal()}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#2E8B57', '#1B5E20']}
          style={styles.fab}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* --- MODAL --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalHeader}>
              {editingTask ? 'Edit Task' : 'New Task'}
            </Text>
            
            <Text style={styles.inputLabel}>Task Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Water Wheat Field"
              value={taskText}
              onChangeText={setTaskText}
              placeholderTextColor="#999"
            />

            <Text style={styles.inputLabel}>Due Time</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="calendar" size={20} color="#2E8B57" />
              <Text style={styles.dateButtonText}>
                {format(taskTime, 'MMM d, yyyy  •  h:mm a')}
              </Text>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={taskTime}
                mode="datetime"
                display="default"
                onChange={(e, d) => {
                  setShowTimePicker(Platform.OS === 'ios');
                  if (d) setTaskTime(d);
                }}
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={handleSaveTask}>
                <LinearGradient
                  colors={['#2E8B57', '#1B5E20']}
                  style={styles.saveBtn}
                >
                  <Text style={styles.saveBtnText}>Save Task</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// --- MODERN STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Header
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#E8F5E9', marginTop: 4, opacity: 0.9 },

  // List
  listContent: { padding: 20, paddingBottom: 100 },
  
  // Card
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden', // For the strip
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  cardCompleted: { opacity: 0.7 },
  cardStrip: { width: 6, height: '100%' },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  
  // Checkbox
  checkboxBase: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CFD8DC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  checkboxChecked: {
    backgroundColor: '#2E8B57',
    borderColor: '#2E8B57',
  },

  // Text
  textContainer: { flex: 1 },
  taskTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 4 },
  textCompleted: { textDecorationLine: 'line-through', color: '#999' },
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  taskDate: { fontSize: 12, color: '#666', marginLeft: 6, fontWeight: '500' },

  // Actions
  actions: { flexDirection: 'row' },
  actionBtn: { padding: 8 },

  // FAB
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    shadowColor: '#2E8B57',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty State
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  emptySubtitle: { fontSize: 14, color: '#777', marginTop: 5 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    elevation: 10,
  },
  modalHeader: { fontSize: 22, fontWeight: 'bold', color: '#2E8B57', marginBottom: 20, textAlign: 'center' },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8, marginLeft: 4 },
  input: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 20,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 25,
  },
  dateButtonText: { marginLeft: 10, fontSize: 16, color: '#333' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#ECEFF1',
    padding: 14,
    borderRadius: 12,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelBtnText: { color: '#546E7A', fontWeight: 'bold', fontSize: 16 },
  saveBtn: {
    flex: 1, // Fix: Changed width to flex to fill space nicely
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});