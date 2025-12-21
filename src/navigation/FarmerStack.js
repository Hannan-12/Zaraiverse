import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Farmer Screens
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
import MyFieldsScreen from '../screens/farmer/MyFieldsScreen';
import AddFieldScreen from '../screens/farmer/AddFieldScreen';
import MarketplaceScreen from '../screens/farmer/MarketplaceScreen';
import ProductDetailsScreen from '../screens/farmer/ProductDetailsScreen';
import WeatherForecastScreen from '../screens/farmer/WeatherForecastScreen';
import WeatherDetailScreen from '../screens/farmer/WeatherDetailScreen';

// LEASING SCREENS
import LeaseTermsScreen from '../screens/farmer/LeaseTermsScreen';
import LeaseCalculatorScreen from '../screens/farmer/LeaseCalculatorScreen';
import LeaseConfirmationScreen from '../screens/farmer/LeaseConfirmationScreen';
import LeasePaymentScreen from '../screens/farmer/LeasePaymentScreen';

// Support
import HelpCenterScreen from '../screens/common/HelpCenterScreen';
import PrivacyPolicyScreen from '../screens/common/PrivacyPolicyScreen';

const Stack = createNativeStackNavigator();

export default function FarmerStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#2e7d32' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="FarmerTabs" component={FarmerTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Marketplace" component={MarketplaceScreen} options={{ title: 'Marketplace' }} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} options={{ title: 'Product Details' }} />
      
      {/* Leasing Flow */}
      <Stack.Screen name="LeaseTerms" component={LeaseTermsScreen} options={{ title: 'Lease Agreement' }} />
      <Stack.Screen name="LeaseCalculator" component={LeaseCalculatorScreen} options={{ title: 'Installment Calculator' }} />
      <Stack.Screen name="LeaseConfirmation" component={LeaseConfirmationScreen} options={{ title: 'Confirm Lease Plan' }} />
      <Stack.Screen name="LeasePayment" component={LeasePaymentScreen} options={{ title: 'Installment Tracking' }} />
      
      <Stack.Screen name="Weather" component={WeatherForecastScreen} options={{ title: 'Weather Forecast', headerShown: false }} />
      <Stack.Screen name="WeatherDetail" component={WeatherDetailScreen} options={{ title: 'Hourly Details', headerTransparent: true, headerTitle: '' }} />
      <Stack.Screen name="CropProgress" component={CropProgressScreen} options={{ title: 'Crop Progress' }} />
      <Stack.Screen name="RequestPrescription" component={RequestPrescriptionScreen} options={{ title: 'Request Prescription' }} />
      <Stack.Screen name="MyQueries" component={MyQueriesScreen} options={{ title: 'My Expert Queries' }} />
      <Stack.Screen name="KnowledgeHub" component={KnowledgeHubScreen} options={{ title: 'Knowledge Hub' }} />
      <Stack.Screen name="TaskReminders" component={TaskRemindersScreen} options={{ title: 'Task Reminders' }} />
      <Stack.Screen name="Orders" component={OrdersScreen} options={{ title: 'My Orders' }} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} options={{ title: 'Analytics' }} />
      <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'My Cart' }} />
      <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Payment' }} />
      <Stack.Screen name="BlogDetails" component={BlogDetailsScreen} options={{ title: 'Blog Article' }} />
      <Stack.Screen name="ChatHistory" component={ChatHistoryScreen} options={{ title: 'Chat History' }} />
      <Stack.Screen name="Chatbot" component={ChatbotScreen} options={{ title: 'AI Assistant' }} />
      <Stack.Screen name="MyFields" component={MyFieldsScreen} options={{ title: 'My Fields' }} />
      <Stack.Screen name="AddField" component={AddFieldScreen} options={{ title: 'Add Field' }} />
      <Stack.Screen name="HelpCenter" component={HelpCenterScreen} options={{ title: 'Help Center' }} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: 'Privacy Policy' }} />
    </Stack.Navigator>
  );
}