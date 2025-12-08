import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ManageBlogs() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Blog Content Management</Text>
      <Text style={styles.subtitle}>You can add, edit, or remove community blogs here.</Text>
      
      <TouchableOpacity style={styles.addButton}>
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.addText}>Post New Blog</Text>
      </TouchableOpacity>

      <View style={styles.listArea}>
        <Text style={styles.emptyText}>No local blogs posted yet.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F8F9FA' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#E67E22',
    padding: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  addText: { color: '#fff', fontWeight: 'bold', marginLeft: 10, fontSize: 16 },
  listArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#999', fontStyle: 'italic' },
});