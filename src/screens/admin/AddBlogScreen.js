// src/screens/admin/AddBlogScreen.js
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { db } from '../../services/firebase';
import { collection, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';

export default function AddBlogScreen({ navigation, route }) {
  // Check if we are editing an existing blog
  const blogToEdit = route.params?.blog;

  const [title, setTitle] = useState(blogToEdit ? blogToEdit.title : '');
  const [content, setContent] = useState(blogToEdit ? blogToEdit.content : '');
  // Added category state (Default to 'General' to ensure it always shows up somewhere)
  const [category, setCategory] = useState(blogToEdit ? blogToEdit.category : 'General');
  const [loading, setLoading] = useState(false);

  // Categories available in your Knowledge Hub
  const categories = ['General', 'Crops', 'Pests', 'Tech'];

  const handleSave = async () => {
    if (!title || !content) {
      Alert.alert("Error", "Please fill in title and content.");
      return;
    }

    setLoading(true);
    try {
      const blogData = {
        title,
        content,
        category, // Saving the selected category
        updatedAt: Timestamp.now(),
        // Simple placeholder image logic
        image: 'https://placehold.co/600x400/E8F5E9/2e7d32?text=ZaraiVerse+Blog', 
        source: { name: 'Admin' }
      };

      if (blogToEdit) {
        // Update existing
        await updateDoc(doc(db, 'blogs', blogToEdit.id), blogData);
        Alert.alert("Success", "Blog updated successfully!");
      } else {
        // Create new
        await addDoc(collection(db, 'blogs'), {
          ...blogData,
          publishedAt: new Date().toISOString(),
          createdAt: Timestamp.now(),
        });
        Alert.alert("Success", "Blog posted successfully!");
      }
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not save blog.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Blog Title</Text>
      <TextInput 
        style={styles.input} 
        placeholder="Enter blog title..." 
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.categoryRow}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.catChip, category === cat && styles.catChipActive]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.catText, category === cat && styles.catTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Content</Text>
      <TextInput 
        style={[styles.input, styles.textArea]} 
        placeholder="Write your article here..." 
        value={content}
        onChangeText={setContent}
        multiline
        textAlignVertical="top"
      />

      <TouchableOpacity 
        style={styles.saveButton} 
        onPress={handleSave} 
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>
            {blogToEdit ? "Update Blog" : "Publish Blog"}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', flexGrow: 1 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 5, color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#F8F9FA'
  },
  textArea: {
    height: 200,
  },
  // New styles for category chips
  categoryRow: { 
    flexDirection: 'row', 
    marginBottom: 20, 
    flexWrap: 'wrap' 
  },
  catChip: {
    paddingVertical: 8, 
    paddingHorizontal: 15, 
    borderRadius: 20, 
    backgroundColor: '#E0E0E0', 
    marginRight: 10, 
    marginBottom: 5
  },
  catChipActive: { 
    backgroundColor: '#2E8B57' 
  },
  catText: { 
    color: '#555' 
  },
  catTextActive: { 
    color: '#fff', 
    fontWeight: 'bold' 
  },
  saveButton: {
    backgroundColor: '#E67E22',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});