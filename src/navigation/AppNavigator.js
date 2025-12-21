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
// ✅ Updated: Import FarmerStack instead of FarmerTabs to fix navigation errors
import FarmerStack from './FarmerStack'; 
import SellerStack from './SellerStack';
import ExpertStack from './ExpertStack';
import AdminStack from './AdminStack';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useContext(AuthContext);

  if (loading) return null; 

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // Role-Based Routing
        <>
          {/* ✅ Updated: Changed component to FarmerStack */}
          {user.role === 'farmer' && <Stack.Screen name="FarmerHome" component={FarmerStack} />}
          {user.role === 'seller' && <Stack.Screen name="SellerHome" component={SellerStack} />}
          {user.role === 'expert' && <Stack.Screen name="ExpertHome" component={ExpertStack} />}
          {user.role === 'admin' && <Stack.Screen name="AdminHome" component={AdminStack} />}
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