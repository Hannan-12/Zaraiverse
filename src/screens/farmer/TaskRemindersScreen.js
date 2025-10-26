// src/screens/farmer/TaskRemindersScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Initial data for demonstration
const initialTasks = [
  { id: '1', title: 'Irrigate the cornfield', time: '9:00 AM', completed: true },
  { id: '2', title: 'Apply fertilizer to Section B', time: '11:00 AM', completed: false },
  { id: '3', title: 'Check pest traps', time: '2:00 PM', completed: false },
];

export default function TaskRemindersScreen() {
  // --- STATE VARIABLES ---
  const [tasks, setTasks] = useState(initialTasks);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [taskText, setTaskText] = useState('');
  const [editingTask, setEditingTask] = useState(null); // To know if we are editing or adding

  // --- HANDLER FUNCTIONS ---

  // Opens the modal for adding or editing a task
  const handleOpenModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      setTaskText(task.title);
    } else {
      setEditingTask(null);
      setTaskText('');
    }
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setEditingTask(null);
    setTaskText('');
  };

  // Saves a new task or updates an existing one
  const handleSaveTask = () => {
    if (taskText.trim() === '') {
      Alert.alert("Error", "Task title cannot be empty.");
      return;
    }

    if (editingTask) {
      // Update existing task
      setTasks(tasks.map(task => 
        task.id === editingTask.id ? { ...task, title: taskText } : task
      ));
    } else {
      // Add new task
      const newTask = {
        id: Date.now().toString(), // Simple unique ID
        title: taskText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        completed: false,
      };
      setTasks([newTask, ...tasks]);
    }
    handleCloseModal();
  };
  
  // Deletes a task after confirmation
  const handleDeleteTask = (id) => {
    Alert.alert(
      "Delete Task",
      "Are you sure you want to delete this task?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => {
          setTasks(tasks.filter(task => task.id !== id));
        }}
      ]
    );
  };

  // Toggles the completion status of a task
  const toggleTaskCompletion = (id) => {
    setTasks(
      tasks.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  // Opens an alert with Edit/Delete options
  const showTaskOptions = (task) => {
    Alert.alert(
        "Task Options",
        "What would you like to do?",
        [
            { text: "Edit", onPress: () => handleOpenModal(task) },
            { text: "Delete", style: "destructive", onPress: () => handleDeleteTask(task.id) },
            { text: "Cancel", style: "cancel" },
        ]
    );
  };


  // --- RENDER FUNCTION for each task item ---
  const renderTaskItem = ({ item }) => (
    <View style={styles.taskCard}>
      <TouchableOpacity onPress={() => toggleTaskCompletion(item.id)} style={[styles.checkbox, item.completed && styles.checkboxCompleted]}>
        {item.completed && <Ionicons name="checkmark" size={20} color="#FFFFFF" />}
      </TouchableOpacity>
      <View style={styles.taskTextContainer}>
        <Text style={[styles.taskTitle, item.completed && styles.taskTitleCompleted]}>
          {item.title}
        </Text>
        <Text style={styles.taskTime}>{item.time}</Text>
      </View>
      <TouchableOpacity onPress={() => showTaskOptions(item)}>
        <Ionicons name="ellipsis-vertical" size={20} color="#ccc" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.outerContainer}>
        <FlatList
            data={tasks}
            renderItem={renderTaskItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.container}
            ListHeaderComponent={<Text style={styles.header}>Today's Tasks</Text>}
        />
      
      {/* --- MODAL FOR ADDING/EDITING --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>{editingTask ? "Edit Task" : "Add New Task"}</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Water the crops"
              value={taskText}
              onChangeText={setTaskText}
              autoFocus={true}
            />
            <View style={styles.modalButtonContainer}>
                <TouchableOpacity style={[styles.button, styles.buttonClose]} onPress={handleCloseModal}>
                    <Text style={styles.textStyle}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.buttonSave]} onPress={handleSaveTask}>
                    <Text style={styles.textStyle}>Save</Text>
                </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  header: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  taskCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 12, padding: 15, marginBottom: 12, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 5,
  },
  checkbox: {
    width: 28, height: 28, borderRadius: 8,
    borderWidth: 2, borderColor: '#2e7d32',
    justifyContent: 'center', alignItems: 'center', marginRight: 15,
  },
  checkboxCompleted: { backgroundColor: '#2e7d32', borderColor: '#2e7d32' },
  taskTextContainer: { flex: 1 },
  taskTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  taskTitleCompleted: { textDecorationLine: 'line-through', color: '#aaa' },
  taskTime: { fontSize: 14, color: '#888', marginTop: 2 },
  fab: {
    position: 'absolute', right: 20, bottom: 20, width: 60, height: 60,
    borderRadius: 30, backgroundColor: '#2e7d32', justifyContent: 'center',
    alignItems: 'center', elevation: 8,
  },
  modalContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%', margin: 20, backgroundColor: 'white',
    borderRadius: 20, padding: 35, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4, elevation: 5,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  input: {
    width: '100%', borderWidth: 1, borderColor: '#ddd',
    padding: 10, borderRadius: 8, marginBottom: 20,
  },
  modalButtonContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  button: { borderRadius: 10, padding: 10, elevation: 2, width: '48%' },
  buttonClose: { backgroundColor: '#ccc' },
  buttonSave: { backgroundColor: '#2e7d32' },
  textStyle: { color: 'white', fontWeight: 'bold', textAlign: 'center' },
});