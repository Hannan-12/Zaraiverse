// src/screens/farmer/KnowledgeHubScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  // --- REMOVED: ScrollView ---
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl, // --- ADDED: For pull-to-refresh ---
  ScrollView, // --- ADDED: For the horizontal category list ---
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';

// --- API Key ---
const API_KEY = 'efde50a7762452d76114e7feb83e9026';

// --- UPDATED: Categories now have query-friendly names ---
const categories = [
  'Crops Farming',
  'Pest Control',
  'Irrigation',
  'Soil Health',
  'Agriculture Technology',
];

export default function KnowledgeHubScreen({ navigation }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true); // For initial load

  // --- NEW STATES for pagination and categories ---
  const [selectedCategory, setSelectedCategory] = useState('Crops Farming');
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false); // For pagination spinner
  const [hasMore, setHasMore] = useState(true); // To stop fetching if no more results
  const [refreshing, setRefreshing] = useState(false); // For pull-to-refresh

  // --- ✅ NEW: Safe date formatting function ---
  const safeFormatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) { // Check if date is invalid
        return 'just now'; // Fallback for invalid date
      }
      return `${formatDistanceToNow(date)} ago`;
    } catch (e) {
      return 'just now'; // Fallback for any error
    }
  };

  // --- ✅ MODIFIED: Fetch function now handles pagination and categories ---
  const fetchArticles = async (query, pageNum, isReset = false) => {
    if (API_KEY === 'PASTE_YOUR_GNEWS.IO_API_KEY_HERE') {
      Alert.alert('API Key Missing', 'Please add your GNews.io key.');
      setLoading(false);
      return;
    }

    // Set loading state
    if (isReset) {
      setLoading(true);
      setHasMore(true); // Reset 'hasMore' on new category
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await fetch(
        `https://gnews.io/api/v4/search?q=${encodeURIComponent(
          query
        )}&lang=en&sortby=publishedAt&page=${pageNum}&apikey=${API_KEY}`
      );
      const json = await response.json();

      if (json.articles) {
        const validArticles = json.articles.filter(
          (article) => article.title && article.title !== '[Removed]' && article.image
        );
        
        // If we got no articles back, stop loading more
        if (validArticles.length === 0) {
          setHasMore(false);
        }

        // Add new articles to the list
        setArticles((prevArticles) =>
          isReset ? validArticles : [...prevArticles, ...validArticles]
        );
      } else {
        setHasMore(false); // Stop fetching if API returns an error
        Alert.alert('Error', json.errors ? json.errors[0] : 'Could not fetch articles.');
      }
    } catch (error) {
      console.error('Error fetching articles: ', error);
      Alert.alert('Error', 'Could not fetch articles. Check your connection.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  // --- ✅ NEW: Effect to fetch articles when category changes ---
  useEffect(() => {
    // This runs when 'selectedCategory' changes
    setPage(1); // Reset page to 1
    fetchArticles(selectedCategory, 1, true); // Fetch with reset
  }, [selectedCategory]); // Dependency

  // --- ✅ NEW: Handler for pull-to-refresh ---
  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchArticles(selectedCategory, 1, true); // Fetch page 1 with reset
  };

  // --- ✅ NEW: Handler for "Load More" ---
  const handleLoadMore = () => {
    // Don't fetch if already loading or no more articles
    if (loadingMore || !hasMore) return;

    const newPage = page + 1;
    setPage(newPage);
    fetchArticles(selectedCategory, newPage, false); // Fetch next page
  };

  // --- ✅ NEW: Handler for tapping a category ---
  const handleCategoryPress = (category) => {
    setSelectedCategory(category); // This will trigger the useEffect
  };

  const renderArticleCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('BlogDetails', { blog: item })}>
      <Image
        source={{
          uri:
            item.image ||
            'https://placehold.co/600x400/E8F5E9/2e7d32?text=Blog+Image',
        }}
        style={styles.cardImage}
      />
      <View style={styles.cardContent}>
        <Text style={styles.cardCategory}>{item.source.name || 'General'}</Text>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardAuthor}>
          By {item.source.name || 'ZaraiVerse Expert'} •{' '}
          {/* --- ✅ MODIFIED: Use safe date function --- */}
          {safeFormatDate(item.publishedAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // --- ✅ NEW: Header component for the FlatList ---
  // This contains all the content that was above the list
  const renderListHeader = () => (
    <>
      <Text style={styles.header}>📚 Knowledge Hub</Text>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          placeholder="Search for articles, guides..."
          style={styles.searchInput}
          // We can add search logic here later
        />
      </View>

      {/* Categories */}
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
              selectedCategory === category && styles.categoryChipActive, // Active style
            ]}
            onPress={() => handleCategoryPress(category)}>
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive,
              ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Featured Articles */}
      <Text style={styles.subHeader}>Featured Articles</Text>

      {/* Show initial loading spinner */}
      {loading && page === 1 && (
        <ActivityIndicator size="large" color="#2e7d32" style={{ marginVertical: 20 }} />
      )}
    </>
  );

  // --- ✅ NEW: Footer component for "Loading More..." spinner ---
  const renderListFooter = () => {
    if (!loadingMore) return null;
    return (
      <ActivityIndicator size="small" color="#2e7d32" style={{ marginVertical: 20 }} />
    );
  };

  // --- ✅ MODIFIED: Return a FlatList instead of ScrollView ---
  return (
    <FlatList
      style={styles.outerContainer}
      data={articles}
      renderItem={renderArticleCard}
      keyExtractor={(item) => item.url}
      ListHeaderComponent={renderListHeader} // All content above the list
      ListFooterComponent={renderListFooter} // "Loading more" spinner
      ListEmptyComponent={
        !loading && ( // Only show if not loading
          <Text style={styles.emptyText}>
            No articles found for "{selectedCategory}".
          </Text>
        )
      }
      onEndReached={handleLoadMore} // Call load more
      onEndReachedThreshold={0.5} // How close to bottom to trigger
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh} // Pull-to-refresh
          colors={['#2e7d32']} // Spinner color
        />
      }
    />
  );
}

// --- ✅ UPDATED: Styles ---
const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20, // Add padding here
  },
  // 'container' style is no longer needed
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    paddingTop: 20, // Add padding from status bar
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  subHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  categoriesContainer: {
    marginBottom: 25,
  },
  categoryChip: {
    backgroundColor: '#E8F5E9', // Light green
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginRight: 10,
  },
  categoryChipActive: {
    backgroundColor: '#2e7d32', // Dark green for active
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32', // Dark green
  },
  categoryTextActive: {
    color: '#FFFFFF', // White text for active
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  cardImage: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  cardContent: {
    padding: 15,
  },
  cardCategory: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2e7d32',
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  cardAuthor: {
    fontSize: 14,
    color: '#777',
  },
  emptyText: {
    textAlign: 'center',
    color: '#777',
    marginTop: 20,
    fontSize: 16,
  },
});


