// src/screens/expert/ExpertDashboard.js
import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../contexts/AuthContext';

export default function ExpertDashboard({ navigation }) {
  const { user } = useContext(AuthContext);

  const menuItems = [
    {
      title: 'Pending Prescriptions',
      subtitle: 'Review and answer farmer queries',
      icon: 'medical-services', // MaterialIcon
      screen: 'PendingPrescriptions',
      color: '#4CAF50',
      iconLibrary: 'MaterialIcons'
    },
    {
      title: 'Chat with Farmers',
      subtitle: 'Real-time consultation',
      icon: 'chatbubble-ellipses', // Ionicons
      screen: 'ExpertChatList',
      color: '#2196F3',
      iconLibrary: 'Ionicons'
    },
    {
      title: 'Manage Profile',
      subtitle: 'Update details & settings',
      icon: 'person', // Ionicons
      screen: 'Profile',
      color: '#FF9800',
      iconLibrary: 'Ionicons'
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome Back,</Text>
          <Text style={styles.name}>{user?.displayName || 'Expert'}</Text>
        </View>
        <Image 
          source={require('../../assets/ZaraiVerse.png')} 
          style={styles.logo} 
        />
      </View>

      <Text style={styles.sectionTitle}>Dashboard Overview</Text>

      {/* Grid Menu */}
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.card}
            onPress={() => navigation.navigate(item.screen)}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
              {item.iconLibrary === 'MaterialIcons' ? (
                <MaterialIcons name={item.icon} size={32} color="#fff" />
              ) : (
                <Ionicons name={item.icon} size={32} color="#fff" />
              )}
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#2E8B57',
    paddingTop: 60, // Safe area padding
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    color: '#E8F5E9',
    fontSize: 16,
  },
  name: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 20,
    marginBottom: 15,
  },
  menuContainer: {
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#777',
    marginTop: 2,
  },
});