// src/navigation/AdminStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AdminDashboard from '../screens/admin/AdminDashboard';
import ManageUsers from '../screens/admin/ManageUsers';
import ManageBlogs from '../screens/admin/ManageBlogs';
import AddBlogScreen from '../screens/admin/AddBlogScreen'; // <--- IMPORT THIS
import AdminAnalyticsScreen from '../screens/admin/AdminAnalyticsScreen';
import ProfileScreen from '../screens/seller/ProfileScreen'; // Reusing profile

const Stack = createNativeStackNavigator();

export default function AdminStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#333' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="AdminDashboard" 
        component={AdminDashboard} 
        options={{ title: 'Admin Panel', headerShown: false }} 
      />
      <Stack.Screen 
        name="ManageUsers" 
        component={ManageUsers} 
        options={{ title: 'User Management' }} 
      />
      <Stack.Screen 
        name="ManageBlogs" 
        component={ManageBlogs} 
        options={{ title: 'Content Moderation' }} 
      />
      {/* --- ADD THIS SCREEN --- */}
      <Stack.Screen 
        name="AddBlog" 
        component={AddBlogScreen} 
        options={{ title: 'Blog Editor' }} 
      />
      
      <Stack.Screen 
        name="AdminAnalytics" 
        component={AdminAnalyticsScreen} 
        options={{ title: 'System Analytics' }} 
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'Admin Profile' }} 
      />
    </Stack.Navigator>
  );
}