// src/navigation/ExpertStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import ExpertDashboard from '../screens/expert/ExpertDashboard';
import PendingPrescriptions from '../screens/expert/PendingPrescriptions';
import ExpertChatList from '../screens/expert/ExpertChatList';
import ProfileScreen from '../screens/farmer/ProfileScreen'; // Reusing the generic profile

// ✅ IMPORT FIX: Import the ChatScreen
import ChatScreen from '../screens/chat/ChatScreen';

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
      
      {/* ✅ ADD THIS SCREEN so navigation works */}
      <Stack.Screen 
        name="ChatScreen" 
        component={ChatScreen} 
        options={{ title: 'Chat' }} 
      />

      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'My Profile' }} 
      />
    </Stack.Navigator>
  );
}