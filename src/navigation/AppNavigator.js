import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ExpertDashboard from '../screens/expert/ExpertDashboard';
import AdminDashboard from '../screens/admin/AdminDashboard';

import FarmerStack from './FarmerStack';
import SellerStack from './SellerStack'; // ✅ Added Seller Stack import

const Stack = createNativeStackNavigator();

const roleComponentMap = {
  farmer: FarmerStack,
  seller: SellerStack, // ✅ Use SellerStack instead of SellerDashboard
  expert: ExpertDashboard,
  admin: AdminDashboard,
};

function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#2E8B57" />
    </View>
  );
}

/**
 * The main navigator for the application.
 * It dynamically renders the correct navigation stack based on the user's role.
 */
export default function AppNavigator() {
  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Get the correct component for the user's role from the map.
  const UserStackComponent = user ? roleComponentMap[user.role] : null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user && UserStackComponent ? (
        // ✅ Render the correct stack for each user role
        <Stack.Screen name="UserStack" component={UserStackComponent} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
