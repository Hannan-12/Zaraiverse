import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack'; 
import { View, ActivityIndicator } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OTPScreen from '../screens/auth/OTPScreen';
import FarmerStack from './FarmerStack';
import SellerStack from './SellerStack';
import ExpertStack from './ExpertStack';
import AdminStack from './AdminStack';

const Stack = createNativeStackNavigator(); 

const roleComponentMap = {
  farmer: FarmerStack,
  seller: SellerStack,
  expert: ExpertStack,
  admin: AdminStack,
};

export default function AppNavigator() {
  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2E8B57" />
      </View>
    );
  }

  // 1. If user is not logged in
  if (!user) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
      </Stack.Navigator>
    );
  }
  if (user.status === 'pending' && user.role !== 'admin') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="OTP" component={OTPScreen} />
      </Stack.Navigator>
    );
  }

  // 3. If user is 'active', show their specific Role Stack
  const UserStackComponent = roleComponentMap[user.role];

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {UserStackComponent ? (
        <Stack.Screen name="UserStack" component={UserStackComponent} />
      ) : (
        // Fallback to Login if role is undefined
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}