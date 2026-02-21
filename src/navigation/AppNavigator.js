// src/navigation/AppNavigator.js
import React, { useContext } from 'react';
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

export default function AppNavigator() {
  const { user, loading } = useContext(AuthContext);

  // Still resolving auth/Firestore — render nothing to avoid any flash
  if (loading) return null;

  // Determine which navigator to show
  const hasValidRole = user && KNOWN_ROLES.includes(user.role);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {hasValidRole ? (
        // Authenticated with a known role
        <>
          {user.role === 'farmer' && <Stack.Screen name="FarmerHome" component={FarmerStack} />}
          {user.role === 'seller' && <Stack.Screen name="SellerHome" component={SellerStack} />}
          {user.role === 'expert' && <Stack.Screen name="ExpertHome" component={ExpertStack} />}
          {user.role === 'admin'  && <Stack.Screen name="AdminHome"  component={AdminStack}  />}
        </>
      ) : (
        // Not logged in, no role yet, or unknown role — show auth screens
        <>
          <Stack.Screen name="Login"    component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="OTP"      component={OTPScreen} />
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
