// src/navigation/AdminStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AdminDashboard from '../screens/admin/AdminDashboard';
import ManageUsers from '../screens/admin/ManageUsers';
import ManageBlogs from '../screens/admin/ManageBlogs';
import AddBlogScreen from '../screens/admin/AddBlogScreen';
import AdminAnalyticsScreen from '../screens/admin/AdminAnalyticsScreen';
import ProfileScreen from '../screens/seller/ProfileScreen';

// New Admin Screens (FR-15, SEC-5, REL-3)
import ManageCommentsScreen from '../screens/admin/ManageCommentsScreen';
import ManageDeletionRequestsScreen from '../screens/admin/ManageDeletionRequestsScreen';
import ErrorLogsScreen from '../screens/admin/ErrorLogsScreen';

// Common Screens
import TwoFactorSetupScreen from '../screens/common/TwoFactorSetupScreen';
import DataDeletionRequestScreen from '../screens/common/DataDeletionRequestScreen';

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

      {/* Comment Moderation (FR-15) */}
      <Stack.Screen
        name="ManageComments"
        component={ManageCommentsScreen}
        options={{ title: 'Comment Moderation', headerShown: false }}
      />

      {/* Data Deletion Requests (SEC-5) */}
      <Stack.Screen
        name="ManageDeletionRequests"
        component={ManageDeletionRequestsScreen}
        options={{ title: 'Deletion Requests', headerShown: false }}
      />

      {/* Error Logs (REL-3) */}
      <Stack.Screen
        name="ErrorLogs"
        component={ErrorLogsScreen}
        options={{ title: 'Error Logs', headerShown: false }}
      />

      {/* 2FA Setup (SEC-2) */}
      <Stack.Screen
        name="TwoFactorSetup"
        component={TwoFactorSetupScreen}
        options={{ title: 'Two-Factor Auth', headerShown: false }}
      />

      {/* Data Deletion Request (SEC-5) */}
      <Stack.Screen
        name="DataDeletionRequest"
        component={DataDeletionRequestScreen}
        options={{ title: 'Delete My Data', headerShown: false }}
      />
    </Stack.Navigator>
  );
}