// src/navigation/ExpertStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import ExpertDashboard from '../screens/expert/ExpertDashboard';
import PendingPrescriptions from '../screens/expert/PendingPrescriptions'; // New file below
import ExpertChatList from '../screens/expert/ExpertChatList'; // New file below
import ProfileScreen from '../screens/farmer/ProfileScreen'; // Reusing the generic profile

const Stack = createNativeStackNavigator();

export default function ExpertStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#2E8B57' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="ExpertDashboard" 
        component={ExpertDashboard} 
        options={{ title: 'Expert Dashboard', headerShown: false }} 
      />
      <Stack.Screen 
        name="PendingPrescriptions" 
        component={PendingPrescriptions} 
        options={{ title: 'Pending Requests' }} 
      />
      <Stack.Screen 
        name="ExpertChatList" 
        component={ExpertChatList} 
        options={{ title: 'Farmer Chats' }} 
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'My Profile' }} 
      />
    </Stack.Navigator>
  );
}