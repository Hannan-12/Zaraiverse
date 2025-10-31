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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../contexts/AuthContext'; // Import AuthContext
import { db } from '../../services/firebase'; // Import Firestore
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
  getDocs,  // ✅ Re-added for cleanup
  writeBatch, // ✅ Re-added for cleanup
} from 'firebase/firestore';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns'; // Using date-fns for nice formatting

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function TaskRemindersScreen() {
  // --- STATE VARIABLES ---
  const [tasks, setTasks] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [taskText, setTaskText] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- NEW STATE for time picking ---
  const [taskTime, setTaskTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Get current user from AuthContext
  const { user } = useContext(AuthContext);

  // --- 1. Request Notification Permissions & Fetch/Cleanup Tasks ---
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    // Request permissions for notifications
    requestNotificationPermissions();

    // --- ✅ RE-ADDED CALL TO cleanupOldTasks() ---
    // Clean up old tasks first
    cleanupOldTasks(user.uid);

    // Set up the real-time listener for tasks
    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const tasksData = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          tasksData.push({
            ...data,
            id: doc.id,
            // Convert Firestore Timestamp back to JS Date
            taskTime: data.taskTime.toDate(),
          });
        });
        // Sort by time, newest first
        tasksData.sort((a, b) => b.taskTime.getTime() - a.taskTime.getTime());
        setTasks(tasksData);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching tasks: ', error);
        Alert.alert('Error', 'Could not fetch tasks.');
        setIsLoading(false);
      }
    );

    // Unsubscribe from the listener when the component unmounts
    return () => unsubscribe();
  }, [user]); // Re-run if user changes

  // --- 2. Notification Permission Handler ---
  async function requestNotificationPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please enable notifications to receive task reminders.'
      );
    }
  }

  // --- 3. ✅ RE-ADDED Auto-Delete Logic ---
  const cleanupOldTasks = async (userId) => {
    try {
      const now = Timestamp.now();
      const q = query(
        collection(db, 'tasks'),
        where('userId', '==', userId),
        where('taskTime', '<', now) // This query needs the index
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return; // Nothing to delete

      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`Cleaned up ${querySnapshot.size} old tasks.`);
    } catch (error) {
      console.error('Error cleaning up old tasks: ', error);
      // We don't show an alert here, as it's a background task.
      // The console log is enough for debugging.
    }
  };

  // --- 4. Notification Scheduling Logic ---
  const scheduleNotification = async (task, taskId) => {
    // Ensure time is in the future
    if (task.taskTime.getTime() <= new Date().getTime()) {
      console.log('Task time is in the past, not scheduling notification.');
      return null;
    }

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Task Reminder',
          body: task.title,
          data: { taskId: taskId },
        },
        // --- FIX: Use the object format for the trigger ---
        trigger: {
          type: 'date',
          date: task.taskTime,
        },
      });
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  };

  // --- 5. Cancel Notification Logic ---
  const cancelNotification = async (notificationId) => {
    if (!notificationId) return;
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  };

  // --- 6. Modal Handlers ---
  const handleOpenModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      setTaskText(task.title);
      setTaskTime(task.taskTime); // Set time from existing task
    } else {
      setEditingTask(null);
      setTaskText('');
      const defaultTime = new Date();
      defaultTime.setMinutes(defaultTime.getMinutes() + 10); // Default to 10 mins from now
      setTaskTime(defaultTime);
    }
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setEditingTask(null);
    setTaskText('');
  };

  // --- 7. Save/Update Task Handler (CRUD) ---
  const handleSaveTask = async () => {
    if (taskText.trim() === '') {
      Alert.alert('Error', 'Task title cannot be empty.');
      return;
    }
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save tasks.');
      return;
    }

    const taskData = {
      title: taskText,
      taskTime: Timestamp.fromDate(taskTime), // Convert JS Date to Firestore Timestamp
      completed: false,
      userId: user.uid,
    };

    try {
      if (editingTask) {
        // --- UPDATE ---
        // Cancel previous notification before updating
        await cancelNotification(editingTask.notificationId);

        const notificationId = await scheduleNotification(
          { title: taskText, taskTime: taskTime },
          editingTask.id
        );
        const taskRef = doc(db, 'tasks', editingTask.id);
        await updateDoc(taskRef, {
          title: taskText,
          taskTime: taskData.taskTime,
          notificationId: notificationId || null,
        });
      } else {
        // --- CREATE ---
        const docRef = await addDoc(collection(db, 'tasks'), {
          ...taskData,
          notificationId: null,
        });
        const notificationId = await scheduleNotification(
          { title: taskText, taskTime: taskTime },
          docRef.id
        );
        // Update the doc with its new notificationId
        if (notificationId) {
          await updateDoc(docRef, { notificationId: notificationId });
        }
      }
    } catch (error) {
      console.error('Error saving task:', error);
      Alert.alert('Error', 'Could not save the task.');
    }
    handleCloseModal();
  };

  // --- 8. Delete Task Handler (CRUD) ---
  const handleDeleteTask = (task) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Cancel notification first
              await cancelNotification(task.notificationId);
              // Delete from Firestore
              await deleteDoc(doc(db, 'tasks', task.id));
            } catch (error) {
              console.error('Error deleting task:', error);
            }
          },
        },
      ]
    );
  };

  // --- 9. Toggle Completion Handler (CRUD) ---
  const toggleTaskCompletion = async (task) => {
    try {
      const taskRef = doc(db, 'tasks', task.id);
      const newCompletedStatus = !task.completed;
      await updateDoc(taskRef, {
        completed: newCompletedStatus,
      });

      // If task is marked complete, cancel the notification
      if (newCompletedStatus && task.notificationId) {
        await cancelNotification(task.notificationId);
        // Optionally remove notificationId from doc
        await updateDoc(taskRef, { notificationId: null });
      }
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };

  // --- 10. Time Picker Change Handler ---
  const onTimeChange = (event, selectedDate) => {
    const currentDate = selectedDate || taskTime;
    setShowTimePicker(Platform.OS === 'ios'); // On iOS, keep it open
    setTaskTime(currentDate);
  };

  // --- RENDER FUNCTION for each task item ---
  const renderTaskItem = ({ item }) => {
    // We no longer need the 'isPast' check because
    // the cleanup function will remove them automatically.
    
    return (
      <View style={styles.taskCard}>
        <TouchableOpacity
          onPress={() => toggleTaskCompletion(item)}
          style={[
            styles.checkbox,
            item.completed && styles.checkboxCompleted,
          ]}>
          {item.completed && (
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
        <View style={styles.taskTextContainer}>
          <Text
            style={[
              styles.taskTitle,
              item.completed && styles.taskTitleCompleted,
            ]}>
            {item.title}
          </Text>
          <Text style={styles.taskTime}>
            {format(item.taskTime, 'MMM d, yyyy @ h:mm a')}
          </Text>
        </View>
        <TouchableOpacity onPress={() => handleOpenModal(item)}>
          <Ionicons name="pencil" size={20} color="#666" style={{ marginRight: 15 }} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteTask(item)}>
          <Ionicons name="trash-bin-outline" size={20} color="#EF5350" />
        </TouchableOpacity>
      </View>
    );
  };

  // --- Loading Indicator ---
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  // --- Main Render ---
  return (
    <View style={styles.outerContainer}>
      <FlatList
        data={tasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.container}
        ListHeaderComponent={
          <Text style={styles.header}>Today's Tasks</Text>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No tasks found. Add one to get started!
          </Text>
        }
      />

      {/* --- MODAL FOR ADDING/EDITING --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={handleCloseModal}>
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>
              {editingTask ? 'Edit Task' : 'Add New Task'}
            </Text>
             {/* --- ✅ FIX: Changed </Key> to </Text> --- */}
            <TextInput
              style={styles.input}
              placeholder="e.g., Water the crops"
              value={taskText}
              onChangeText={setTaskText}
              autoFocus={true}
            />

            {/* --- NEW Time Picker Button --- */}
            <TouchableOpacity
              style={styles.timePickerButton}
              onPress={() => setShowTimePicker(true)}>
              <Ionicons name="calendar-outline" size={20} color="#2e7d32" />
              <Text style={styles.timePickerText}>
                {format(taskTime, 'MMM d, h:mm a')}
              </Text>
            </TouchableOpacity>

            {/* --- NEW Time Picker Component --- */}
            {showTimePicker && (
              <DateTimePicker
                testID="dateTimePicker"
                value={taskTime}
                mode="datetime"
                is24Hour={false}
                display="default"
                onChange={onTimeChange}
              />
            )}

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose]}
                onPress={handleCloseModal}>
                <Text style={styles.textStyle}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonSave]}
                onPress={handleSaveTask}>
                <Text style={styles.textStyle}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal> 
      {/* --- ✅ FIX: Correct closing tag --- */}

      {/* --- Floating Action Button to Add New Task --- */}
      <TouchableOpacity style={styles.fab} onPress={() => handleOpenModal()}>
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#F8F9FA' },
  container: { padding: 20 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#777',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2e7d32',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  checkboxCompleted: { backgroundColor: '#2e7d32', borderColor: '#2e7d32' },
  taskTextContainer: { flex: 1 },
  taskTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  taskTitleCompleted: { textDecorationLine: 'line-through', color: '#aaa' },
  taskTime: { fontSize: 14, color: '#888', marginTop: 4 },
  // --- Styles for past tasks removed as they are no longer needed ---
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2e7d32',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  button: {
    borderRadius: 10,
    padding: 12,
    elevation: 2,
    width: '48%',
  },
  buttonClose: { backgroundColor: '#aaa' },
  buttonSave: { backgroundColor: '#2e7d32' },
  textStyle: { color: 'white', fontWeight: 'bold', textAlign: 'center' },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    marginBottom: 20,
  },
  timePickerText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
});