// src/screens/farmer/KnowledgeHubScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Mock data for demonstration
const categories = ['Pest Control', 'Irrigation', 'Soil Health', 'Crop Guide'];
const featuredArticles = [
  {
    id: '1',
    title: 'Modern Irrigation Techniques for Water Conservation',
    author: 'Dr. Ayesha Khan',
    image: 'https://images.unsplash.com/photo-1599577238237-73b9cf3b85b4?q=80&w=2070&auto=format&fit=crop', // Example image URL
  },
  {
    id: '2',
    title: 'Identifying and Managing Common Wheat Diseases',
    author: 'Faisal Ahmed',
    image: 'https://images.unsplash.com/photo-1627896152334-a25172288390?q=80&w=2070&auto=format&fit=crop', // Example image URL
  },
  {
    id: '3',
    title: 'The Ultimate Guide to Organic Fertilizers',
    author: 'Sana Javed',
    image: 'https://images.unsplash.com/photo-1605000797434-a2a294b733e3?q=80&w=1974&auto=format&fit=crop', // Example image URL
  },
];

export default function KnowledgeHubScreen() {

  const renderArticleCard = ({ item }) => (
    <TouchableOpacity style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardAuthor}>By {item.author}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.outerContainer} contentContainerStyle={styles.container}>
      <Text style={styles.header}>📚 Knowledge Hub</Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          placeholder="Search for articles, guides..."
          style={styles.searchInput}
        />
      </View>

      {/* Categories */}
      <Text style={styles.subHeader}>Categories</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
        {categories.map((category, index) => (
          <TouchableOpacity key={index} style={styles.categoryChip}>
            <Text style={styles.categoryText}>{category}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Featured Articles */}
      <Text style={styles.subHeader}>Featured Articles</Text>
      <FlatList
        data={featuredArticles}
        renderItem={renderArticleCard}
        keyExtractor={item => item.id}
        scrollEnabled={false} // Disable FlatList scrolling inside ScrollView
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    padding: 20,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
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
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32', // Dark green
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
});