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
import ChatHistoryScreen from '../screens/farmer/ChatHistoryScreen';
import PaymentScreen from '../screens/farmer/PaymentScreen';
import MyQueriesScreen from '../screens/farmer/MyQueriesScreen';
import ChatbotScreen from '../screens/farmer/ChatbotScreen';

// --- NEW FIELD SCREENS ---
import MyFieldsScreen from '../screens/farmer/MyFieldsScreen';
import AddFieldScreen from '../screens/farmer/AddFieldScreen';

// --- Marketplace & Weather Imports ---
import MarketplaceScreen from '../screens/farmer/MarketplaceScreen';
import ProductDetailsScreen from '../screens/farmer/ProductDetailsScreen';
import WeatherForecastScreen from '../screens/farmer/WeatherForecastScreen';
import WeatherDetailScreen from '../screens/farmer/WeatherDetailScreen';

const Stack = createNativeStackNavigator();

export default function FarmerStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="FarmerTabs"
        component={FarmerTabs}
        options={{ headerShown: false }}
      />
      
      {/* ... Other Screens ... */}
      <Stack.Screen name="Marketplace" component={MarketplaceScreen} options={{ title: 'Marketplace', headerStyle: { backgroundColor: '#2e7d32' }, headerTintColor: '#fff' }} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} options={{ title: 'Product Details', headerStyle: { backgroundColor: '#2e7d32' }, headerTintColor: '#fff' }} />
      <Stack.Screen name="Weather" component={WeatherForecastScreen} options={{ title: 'Weather Forecast', headerShown: false }} />
      <Stack.Screen name="WeatherDetail" component={WeatherDetailScreen} options={{ title: 'Hourly Details', headerStyle: { backgroundColor: '#4FC3F7' }, headerTintColor: '#fff', headerTransparent: true, headerTitle: '' }} />
      <Stack.Screen name="CropProgress" component={CropProgressScreen} options={{ title: 'Crop Progress', headerStyle: { backgroundColor: '#2e7d32' }, headerTintColor: '#fff' }} />
      <Stack.Screen name="RequestPrescription" component={RequestPrescriptionScreen} options={{ title: 'Request Prescription', headerStyle: { backgroundColor: '#2e7d32' }, headerTintColor: '#fff' }} />
      <Stack.Screen name="MyQueries" component={MyQueriesScreen} options={{ title: 'My Expert Queries', headerStyle: { backgroundColor: '#2e7d32' }, headerTintColor: '#fff' }} />
      <Stack.Screen name="KnowledgeHub" component={KnowledgeHubScreen} options={{ title: 'Knowledge Hub', headerStyle: { backgroundColor: '#2e7d32' }, headerTintColor: '#fff' }} />
      <Stack.Screen name="TaskReminders" component={TaskRemindersScreen} options={{ title: 'Task Reminders', headerStyle: { backgroundColor: '#2e7d32' }, headerTintColor: '#fff' }} />
      <Stack.Screen name="Orders" component={OrdersScreen} options={{ title: 'My Orders', headerStyle: { backgroundColor: '#2e7d32' }, headerTintColor: '#fff' }} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} options={{ title: 'Prescriptive Analytics', headerStyle: { backgroundColor: '#2e7d32' }, headerTintColor: '#fff' }} />
      <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'My Cart', headerStyle: { backgroundColor: '#2e7d32' }, headerTintColor: '#fff' }} />
      <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Payment', headerStyle: { backgroundColor: '#2e7d32' }, headerTintColor: '#fff' }} />
      <Stack.Screen name="BlogDetails" component={BlogDetailsScreen} options={{ title: 'Blog Article', headerStyle: { backgroundColor: '#2e7d32' }, headerTintColor: '#fff' }} />
      <Stack.Screen name="ChatHistory" component={ChatHistoryScreen} options={{ title: 'Chat History', headerStyle: { backgroundColor: '#2e7d32' }, headerTintColor: '#fff' }} />
      <Stack.Screen name="Chatbot" component={ChatbotScreen} options={{ title: 'AI Assistant', headerStyle: { backgroundColor: '#2e7d32' }, headerTintColor: '#fff' }} />

      {/* --- FIELD ROUTES --- */}
      <Stack.Screen name="MyFields" component={MyFieldsScreen} options={{ title: 'My Fields', headerStyle: { backgroundColor: '#2e7d32' }, headerTintColor: '#fff' }} />
      <Stack.Screen name="AddField" component={AddFieldScreen} options={{ title: 'Add/Edit Field', headerStyle: { backgroundColor: '#2e7d32' }, headerTintColor: '#fff' }} />
    </Stack.Navigator>
  );
}