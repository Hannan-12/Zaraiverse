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
import BlogDetailsScreen from '../screens/farmer/BlogDetailsScreen';

// --- Marketplace Imports ---
import MarketplaceScreen from '../screens/farmer/MarketplaceScreen';
import ProductDetailsScreen from '../screens/farmer/ProductDetailsScreen';

// --- Weather Imports (NEW) ---
import WeatherForecastScreen from '../screens/farmer/WeatherForecastScreen';
import WeatherDetailScreen from '../screens/farmer/WeatherDetailScreen';

const Stack = createNativeStackNavigator();

export default function FarmerStack() {
  return (
    <Stack.Navigator>
      {/* Main Tabs (Dashboard, etc.) */}
      <Stack.Screen
        name="FarmerTabs"
        component={FarmerTabs}
        options={{ headerShown: false }}
      />
      
      {/* --- Marketplace Screens --- */}
      <Stack.Screen
        name="Marketplace"
        component={MarketplaceScreen}
        options={{
          title: 'Marketplace',
          headerStyle: { backgroundColor: '#2e7d32' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen
        name="ProductDetails"
        component={ProductDetailsScreen}
        options={{
          title: 'Product Details',
          headerStyle: { backgroundColor: '#2e7d32' },
          headerTintColor: '#fff',
        }}
      />

      {/* --- Weather Screens (NEW) --- */}
      <Stack.Screen
        name="Weather"
        component={WeatherForecastScreen}
        options={{
          title: 'Weather Forecast',
          headerStyle: { backgroundColor: '#4FC3F7' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
          headerShown: false, // Custom gradient header in component
        }}
      />
      <Stack.Screen
        name="WeatherDetail"
        component={WeatherDetailScreen}
        options={{
          title: 'Hourly Details',
          headerStyle: { backgroundColor: '#4FC3F7' },
          headerTintColor: '#fff',
          headerTransparent: true,
          headerTitle: '',
        }}
      />

      {/* --- Other Features --- */}
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
      <Stack.Screen
        name="BlogDetails"
        component={BlogDetailsScreen}
        options={{
          title: 'Blog Article',
          headerStyle: { backgroundColor: '#2e7d32' },
          headerTintColor: '#fff',
        }}
      />
    </Stack.Navigator>
  );
}