import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function PostBlogScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [loading, setLoading] = useState(false);

  // Placeholder for image (since we aren't using Storage bucket yet)
  const image = 'https://placehold.co/600x400/2E8B57/FFFFFF?text=Blog+Image';

  const handlePost = async () => {
    if (!title || !content) {
      Alert.alert('Missing Fields', 'Please add a title and content.');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'blogs'), {
        title,
        content,
        category,
        image,
        publishedAt: new Date().toISOString(), // Use ISO string for easier parsing
        createdAt: serverTimestamp(),
        source: { name: 'ZaraiVerse Admin' } // Matches GNews format structure
      });

      Alert.alert('Success', 'Blog posted successfully!');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not post blog.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Blog Title</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter article title..."
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.categoryRow}>
        {['General', 'Crops', 'Pests', 'Tech'].map((cat) => (
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
      />

      {/* Image Preview */}
      <Text style={styles.label}>Cover Image (Preview)</Text>
      <Image source={{ uri: image }} style={styles.imagePreview} />

      <TouchableOpacity
        style={styles.postButton}
        onPress={handlePost}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
            <Text style={styles.postButtonText}>Publish Blog</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F8F9FA' },
  label: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8, marginTop: 10 },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  textArea: { height: 150, textAlignVertical: 'top' },
  categoryRow: { flexDirection: 'row', marginBottom: 10 },
  catChip: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    marginRight: 10,
  },
  catChipActive: { backgroundColor: '#2E8B57' },
  catText: { color: '#555' },
  catTextActive: { color: '#fff', fontWeight: 'bold' },
  imagePreview: { width: '100%', height: 150, borderRadius: 10, marginBottom: 20 },
  postButton: {
    backgroundColor: '#E67E22',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 40,
  },
  postButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
});