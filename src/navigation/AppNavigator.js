// src/navigation/AppNavigator.js
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

  // Logic: 
  // 1. No user? Show Auth (Login/Register)
  // 2. User logged in but pending? Force OTP Screen
  // 3. User logged in and active? Show Role Stack
  
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
      <Stack.Navigator>
        <Stack.Screen 
          name="OTP" 
          component={OTPScreen} 
          initialParams={{ email: user.email }}
          options={{ title: 'Verify Account', headerTintColor: '#2E8B57' }} 
        />
      </Stack.Navigator>
    );
  }

  const UserStackComponent = roleComponentMap[user.role];

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {UserStackComponent ? (
        <Stack.Screen name="UserStack" component={UserStackComponent} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}