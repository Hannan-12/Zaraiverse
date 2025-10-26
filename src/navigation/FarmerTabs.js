import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Screens
import FarmerDashboard from '../screens/farmer/FarmerDashboard';
import MyCropsScreen from '../screens/farmer/MyCropsScreen';
import TaskRemindersScreen from '../screens/farmer/TaskRemindersScreen';
import WeatherForecastScreen from '../screens/farmer/WeatherForecastScreen';
import ChatScreen from '../screens/farmer/ChatScreen';
import ProfileScreen from '../screens/farmer/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function FarmerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarIcon: ({ color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Dashboard':
              iconName = 'home-outline';
              break;
            case 'MyCrops':
              iconName = 'leaf-outline';
              break;
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
      <Tab.Screen name="MyCrops" component={MyCropsScreen} />
      <Tab.Screen name="TaskReminders" component={TaskRemindersScreen} />
      <Tab.Screen name="Weather" component={WeatherForecastScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
