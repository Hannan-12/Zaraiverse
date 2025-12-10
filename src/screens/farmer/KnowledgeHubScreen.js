import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { db } from '../../services/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

// --- Categories matching Admin Panel + Videos ---
const categories = [
  'General',
  'Crops',
  'Pests',
  'Tech',
  'Farming Videos', 
];

// --- MOCK DATA FOR VIDEOS ---
const MOCK_VIDEOS = [
  {
    id: 'v1',
    title: 'Modern Wheat Harvesting Techniques',
    duration: '5:20',
    thumbnail: 'https://placehold.co/600x400/2E8B57/FFFFFF?text=Wheat+Harvest',
    source: 'AgriExpert PK',
    views: '12K',
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'v2',
    title: 'How to Prevent Rust in Wheat Crop',
    duration: '8:45',
    thumbnail: 'https://placehold.co/600x400/E67E22/FFFFFF?text=Pest+Control',
    source: 'Zarai Tips',
    views: '5.4K',
    publishedAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 'v3',
    title: 'Best Irrigation Schedule for Rice',
    duration: '6:10',
    thumbnail: 'https://placehold.co/600x400/42A5F5/FFFFFF?text=Irrigation',
    source: 'Farming 101',
    views: '8.9K',
    publishedAt: new Date(Date.now() - 432000000).toISOString(),
  },
];

export default function KnowledgeHubScreen({ navigation }) {
  const [articles, setArticles] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedCategory, setSelectedCategory] = useState('General');
  const [refreshing, setRefreshing] = useState(false);

  const safeFormatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'just now';
      return `${formatDistanceToNow(date)} ago`;
    } catch (e) {
      return 'just now';
    }
  };

  // --- FETCH FROM FIREBASE ---
  useEffect(() => {
    let unsubscribe;

    const fetchData = async () => {
      setLoading(true);

      if (selectedCategory === 'Farming Videos') {
        // Simulate fetching videos
        setTimeout(() => {
          setVideos(MOCK_VIDEOS);
          setLoading(false);
          setRefreshing(false);
        }, 500);
      } else {
        // Fetch Blogs from Firestore
        try {
          const blogsRef = collection(db, 'blogs');
          // Query: Filter by category and sort by date
          // Note: If you get a "Missing Index" error in console, remove the 'orderBy' temporarily or create the index link provided in console.
          const q = query(
            blogsRef, 
            where('category', '==', selectedCategory),
            orderBy('createdAt', 'desc')
          );

          unsubscribe = onSnapshot(q, (snapshot) => {
            const blogsList = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setArticles(blogsList);
            setLoading(false);
            setRefreshing(false);
          }, (error) => {
            console.error("Error fetching blogs:", error);
            setLoading(false);
            setRefreshing(false);
          });

        } catch (error) {
          console.error("Error setting up listener:", error);
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    fetchData();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [selectedCategory]);

  const onRefresh = () => {
    setRefreshing(true);
    // Re-trigger effect by momentarily resetting category or just letting the snapshot handle it. 
    // For Firestore onSnapshot, it's real-time, but we can simulate a reload for videos.
    if (selectedCategory === 'Farming Videos') {
      setTimeout(() => setRefreshing(false), 1000);
    } else {
      // Real-time listener updates automatically, just stop spinner
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const handleVideoPress = (videoTitle) => {
    // In a real app, navigation.navigate('VideoPlayer', { url: ... })
    alert(`Playing: ${videoTitle}`);
  };

  // --- RENDERERS ---

  const renderArticleCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('BlogDetails', { blog: item })}>
      <Image 
        source={{ uri: item.image || 'https://placehold.co/600x400/E8F5E9/2e7d32?text=ZaraiVerse+Blog' }} 
        style={styles.cardImage} 
      />
      <View style={styles.cardContent}>
        <Text style={styles.cardCategory}>{item.category || 'General'}</Text>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.cardAuthor}>
          {item.source?.name || 'Admin'} • {safeFormatDate(item.publishedAt || item.createdAt?.toDate())}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderVideoCard = ({ item }) => (
    <TouchableOpacity style={styles.videoCard} onPress={() => handleVideoPress(item.title)}>
      <View style={styles.thumbnailContainer}>
        <Image source={{ uri: item.thumbnail }} style={styles.videoThumbnail} />
        <View style={styles.playIconOverlay}>
          <Ionicons name="play-circle" size={40} color="rgba(255,255,255,0.9)" />
        </View>
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{item.duration}</Text>
        </View>
      </View>
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.videoMeta}>
          {item.source} • {item.views} views • {safeFormatDate(item.publishedAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderListHeader = () => (
    <>
      <Text style={styles.header}>📚 Knowledge Hub</Text>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          placeholder="Search for articles, videos..."
          style={styles.searchInput}
        />
      </View>

      <Text style={styles.subHeader}>Categories</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(category)}>
            {category === 'Farming Videos' && (
              <Ionicons 
                name="play-circle-outline" 
                size={16} 
                color={selectedCategory === category ? '#FFF' : '#E67E22'} 
                style={{marginRight: 6}}
              />
            )}
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive,
                category === 'Farming Videos' && selectedCategory !== category && { color: '#E67E22' }
              ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.subHeader}>
        {selectedCategory === 'Farming Videos' ? 'Latest Videos' : `Latest in ${selectedCategory}`}
      </Text>
    </>
  );

  // --- MAIN RENDER ---
  const isVideoMode = selectedCategory === 'Farming Videos';

  return (
    <FlatList
      style={styles.outerContainer}
      data={isVideoMode ? videos : articles}
      renderItem={isVideoMode ? renderVideoCard : renderArticleCard}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={renderListHeader}
      ListEmptyComponent={
        !loading && (
          <View style={styles.emptyContainer}>
            <Ionicons name={isVideoMode ? "videocam-off-outline" : "document-text-outline"} size={50} color="#ccc" />
            <Text style={styles.emptyText}>
              No {isVideoMode ? 'videos' : 'articles'} found for "{selectedCategory}".
            </Text>
          </View>
        )
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2e7d32']} />
      }
    />
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#F8F9FA', paddingHorizontal: 20 },
  header: { fontSize: 26, fontWeight: 'bold', color: '#333', marginBottom: 20, paddingTop: 20 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12,
    paddingHorizontal: 15, marginBottom: 25, elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: 50, fontSize: 16 },
  subHeader: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  categoriesContainer: { marginBottom: 25 },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', 
    paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, marginRight: 10,
  },
  categoryChipActive: { backgroundColor: '#2e7d32' },
  categoryText: { fontSize: 14, fontWeight: '600', color: '#2e7d32' },
  categoryTextActive: { color: '#FFFFFF' },
  
  // Article Card Styles
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 15, marginBottom: 20, elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5,
  },
  cardImage: { width: '100%', height: 180, borderTopLeftRadius: 15, borderTopRightRadius: 15, backgroundColor: '#eee' },
  cardContent: { padding: 15 },
  cardCategory: { fontSize: 12, fontWeight: 'bold', color: '#2e7d32', textTransform: 'uppercase', marginBottom: 5 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5, color: '#333' },
  cardAuthor: { fontSize: 14, color: '#777' },

  // Video Card Styles
  videoCard: {
    flexDirection: 'row', backgroundColor: '#fff', marginBottom: 16, borderRadius: 12,
    overflow: 'hidden', elevation: 2
  },
  thumbnailContainer: { width: 120, height: 90, position: 'relative' },
  videoThumbnail: { width: '100%', height: '100%', backgroundColor: '#000' },
  playIconOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)'
  },
  durationBadge: {
    position: 'absolute', bottom: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4
  },
  durationText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  videoInfo: { flex: 1, padding: 10, justifyContent: 'center' },
  videoTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  videoMeta: { fontSize: 12, color: '#666' },

  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { textAlign: 'center', color: '#777', marginTop: 20, fontSize: 16 },
});