import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

import FarmerStack from './FarmerStack';
import SellerStack from './SellerStack';
import ExpertStack from './ExpertStack';
import AdminStack from './AdminStack'; 

const Stack = createNativeStackNavigator();

const roleComponentMap = {
  farmer: FarmerStack,
  seller: SellerStack,
  expert: ExpertStack,
  admin: AdminStack, // ✅ UPDATE THIS
};

function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#2E8B57" />
    </View>
  );
}

export default function AppNavigator() {
  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return <LoadingScreen />;
  }

  const UserStackComponent = user ? roleComponentMap[user.role] : null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user && UserStackComponent ? (
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