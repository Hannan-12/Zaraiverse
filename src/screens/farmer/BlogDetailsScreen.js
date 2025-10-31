// src/screens/farmer/BlogDetailsScreen.js
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

// --- ✅ NEW: Safe date formatting function ---
const safeFormatDateDetail = (dateString) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) { // Check if date is invalid
      return 'Unknown date'; // Fallback
    }
    return format(date, 'MMMM d, yyyy');
  } catch (e) {
    return 'Unknown date'; // Fallback
  }
};

export default function BlogDetailsScreen({ route, navigation }) {
  // Get the blog item passed from the previous screen
  const { blog } = route.params;

  // Set the screen title to the blog's title
  useEffect(() => {
    if (blog) {
      // Shorten title if too long for a header
      const shortTitle = blog.title.length > 30 ? `${blog.title.substring(0, 30)}...` : blog.title;
      navigation.setOptions({ title: shortTitle });
    }
  }, [blog, navigation]);

  // --- Handle opening the full article ---
  const handleReadFullArticle = async () => {
    // GNews uses 'url'
    if (blog.url) {
      const supported = await Linking.canOpenURL(blog.url);
      if (supported) {
        await Linking.openURL(blog.url);
      } else {
        Alert.alert('Error', `Don't know how to open this URL: ${blog.url}`);
      }
    }
  };

  if (!blog) {
    return (
      <View style={styles.container}>
        <Text>Blog post not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image
        source={{
          uri:
            blog.image || // GNews uses 'image'
            'https://placehold.co/600x400/E8F5E9/2e7d32?text=Blog+Image',
        }}
        style={styles.headerImage}
      />
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{blog.title}</Text>
        <Text style={styles.meta}>
          By {blog.source.name || 'ZaraiVerse Expert'} •{' '}
          {/* --- MODIFIED: Use safe date function --- */}
          {safeFormatDateDetail(blog.publishedAt)}
        </Text>
        <Text style={styles.category}>{blog.source.name || 'General'}</Text>

        <View style={styles.separator} />

        {/* Use 'description' or 'content' */}
        <Text style={styles.body}>
          {/* --- ✅ FIX: Changed </Read> to </Text> --- */}
          {blog.description || blog.content || 'No content available.'}
        </Text>

        {/* Button to read full article */}
        <TouchableOpacity
          style={styles.readMoreButton}
          onPress={handleReadFullArticle}>
          <Ionicons name="open-outline" size={20} color="#FFFFFF" />
          <Text style={styles.readMoreButtonText}>Read Full Article</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerImage: {
    width: '100%',
    height: 250,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  meta: {
    fontSize: 14,
    color: '#777',
    marginBottom: 5,
  },
  category: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 15,
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 15,
  },
  body: {
    fontSize: 17,
    lineHeight: 26,
    color: '#444',
  },
  readMoreButton: {
    flexDirection: 'row',
    backgroundColor: '#2e7d32',
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30, // Add space above
    elevation: 2,
  },
  readMoreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

