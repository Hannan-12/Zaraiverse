// src/navigation/FarmerTabs.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Screens
import FarmerDashboard from '../screens/farmer/FarmerDashboard';
// --- 1. REMOVE MyCropsScreen import ---
// import MyCropsScreen from '../screens/farmer/MyCropsScreen'; 
import TaskRemindersScreen from '../screens/farmer/TaskRemindersScreen';
import WeatherForecastScreen from '../screens/farmer/WeatherForecastScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import ProfileScreen from '../screens/farmer/ProfileScreen';

// --- 2. ADD MyCropsStack import ---
import MyCropsStack from './MyCropsStack';

const Tab = createBottomTabNavigator();

export default function FarmerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // --- 3. HIDE header for MyCrops tab, as the stack has its own ---
        headerShown: route.name !== 'MyCrops', 
        tabBarIcon: ({ color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Dashboard':
              iconName = 'home-outline';
              break;
            case 'MyCrops':
              iconName = 'leaf-outline';
              break;
            // ... (rest of the icons)
            case 'TaskReminders':
              iconName = 'alarm-outline';
              break;
            case 'Weather':
              iconName = 'cloud-outline';
              break;
            case 'Chat':
              iconName = 'chatbubble-outline';
              break;
            case 'Profile':
              iconName = 'person-outline';
              break;
            default:
              iconName = 'ellipse-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2e7d32',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Dashboard" component={FarmerDashboard} />
      
      {/* --- 4. CHANGE component from MyCropsScreen to MyCropsStack --- */}
      <Tab.Screen 
        name="MyCrops" 
        component={MyCropsStack} // Use the stack here
      />
      
      <Tab.Screen name="TaskReminders" component={TaskRemindersScreen} />
      <Tab.Screen name="Weather" component={WeatherForecastScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}