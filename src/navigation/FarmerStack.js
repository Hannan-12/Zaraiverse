import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// --- Farmer Screen Imports ---
import FarmerTabs from './FarmerTabs';
import CropProgressScreen from '../screens/farmer/CropProgressScreen';
import RequestPrescriptionScreen from '../screens/farmer/RequestPrescriptionScreen';
import KnowledgeHubScreen from '../screens/farmer/KnowledgeHubScreen';
import TaskRemindersScreen from '../screens/farmer/TaskRemindersScreen';
import OrdersScreen from '../screens/farmer/OrdersScreen';
import AnalyticsScreen from '../screens/farmer/AnalyticsScreen';
import CartScreen from '../screens/farmer/CartScreen';
// --- ✅ NEW: Import BlogDetailsScreen ---
import BlogDetailsScreen from '../screens/farmer/BlogDetailsScreen';


const Stack = createNativeStackNavigator();

export default function FarmerStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="FarmerTabs"
        component={FarmerTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CropProgress"
        component={CropProgressScreen}
        options={{
          title: 'Crop Progress',
          headerStyle: { backgroundColor: '#2e7d32' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen
        name="RequestPrescription"
        component={RequestPrescriptionScreen}
        options={{
          title: 'Request Prescription',
          headerStyle: { backgroundColor: '#2e7d32' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen
        name="KnowledgeHub"
        component={KnowledgeHubScreen}
        options={{
          title: 'Knowledge Hub',
          headerStyle: { backgroundColor: '#2e7d32' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen
        name="TaskReminders"
        component={TaskRemindersScreen}
        options={{
          title: 'Task Reminders',
          headerStyle: { backgroundColor: '#2e7d32' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          title: 'My Orders',
          headerStyle: { backgroundColor: '#2e7d32' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          title: 'Prescriptive Analytics',
          headerStyle: { backgroundColor: '#2e7d32' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: 'My Cart',
          headerStyle: { backgroundColor: '#2e7d32' },
          headerTintColor: '#fff',
        }}
      />

      {/* --- ✅ NEW: Add BlogDetailsScreen to the stack --- */}
      <Stack.Screen
        name="BlogDetails"
        component={BlogDetailsScreen}
        options={{
          title: 'Blog Article', // The screen itself will override this
          headerStyle: { backgroundColor: '#2e7d32' },
          headerTintColor: '#fff',
        }}
      />
      
    </Stack.Navigator>
  );
}
