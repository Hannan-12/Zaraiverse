// src/screens/admin/ManageBlogs.js
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';

export default function ManageBlogs({ navigation }) {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Order by creation time if available, otherwise just fetch
    const q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const blogList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBlogs(blogList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching blogs:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = (id) => {
    Alert.alert(
      "Delete Blog",
      "Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            await deleteDoc(doc(db, 'blogs', id)); 
          }
        }
      ]
    );
  };

  const renderBlogItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.textContainer}>
        <Text style={styles.blogTitle}>{item.title}</Text>
        <Text style={styles.blogSnippet} numberOfLines={2}>
          {item.content}
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity 
          onPress={() => navigation.navigate('AddBlog', { blog: item })} 
          style={styles.iconBtn}
        >
          <Ionicons name="create-outline" size={24} color="#4A90E2" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => handleDelete(item.id)} 
          style={styles.iconBtn}
        >
          <Ionicons name="trash-outline" size={24} color="#C62828" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Blog Content</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AddBlog')}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addText}>New Post</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#E67E22" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={blogs}
          renderItem={renderBlogItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No blogs found. Post one!</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    elevation: 2,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#E67E22',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addText: { color: '#fff', fontWeight: 'bold', marginLeft: 5, fontSize: 14 },
  list: { padding: 15 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  textContainer: { flex: 1, marginRight: 10 },
  blogTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  blogSnippet: { fontSize: 14, color: '#666' },
  actions: { flexDirection: 'row' },
  iconBtn: { padding: 8 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 30, fontSize: 16 },
});