// src/navigation/AppNavigator.js
import React, { useContext } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthContext } from '../contexts/AuthContext';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OTPScreen from '../screens/auth/OTPScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Role-Based Stacks
import FarmerStack from './FarmerStack';
import SellerStack from './SellerStack';
import ExpertStack from './ExpertStack';
import AdminStack from './AdminStack';

const Stack = createStackNavigator();
const KNOWN_ROLES = ['farmer', 'seller', 'expert', 'admin'];

// Shown while user is authenticated but role hasn't loaded from Firestore yet
function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator size="large" color="#2E8B57" />
    </View>
  );
}

export default function AppNavigator() {
  const { user, loading } = useContext(AuthContext);

  // Still resolving auth state — render nothing to avoid flash
  if (loading) return null;

  // User is logged in but role hasn't been read from Firestore yet
  if (user && !user.role) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Loading" component={LoadingScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // Role-Based Routing — role is guaranteed to be defined here
        <>
          {user.role === 'farmer' && <Stack.Screen name="FarmerHome" component={FarmerStack} />}
          {user.role === 'seller' && <Stack.Screen name="SellerHome" component={SellerStack} />}
          {user.role === 'expert' && <Stack.Screen name="ExpertHome" component={ExpertStack} />}
          {user.role === 'admin' && <Stack.Screen name="AdminHome" component={AdminStack} />}
          {/* Fallback: unrecognised role — show login */}
          {!KNOWN_ROLES.includes(user.role) && (
            <Stack.Screen name="Login" component={LoginScreen} />
          )}
        </>
      ) : (
        // Auth Stack
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="OTP" component={OTPScreen} />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{ headerShown: true, title: 'Reset Password' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
