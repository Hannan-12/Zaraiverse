import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SellerDashboard from '../screens/seller/SellerDashboard';
import AddNewProduct from '../screens/seller/AddNewProduct';
import ManageProducts from '../screens/seller/ManageProducts';
import SellerOrders from '../screens/seller/SellerOrders';
import ManageShipment from '../screens/seller/ManageShipment';
import ProfileScreen from '../screens/seller/ProfileScreen';

const Stack = createNativeStackNavigator();

export default function SellerStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#2E8B57' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen
        name="SellerDashboard"
        component={SellerDashboard}
        options={{ title: 'Seller Dashboard' }}
      />
      <Stack.Screen
        name="PostProduct"
        component={AddNewProduct}
        options={{ title: 'Add New Product' }}
      />
      <Stack.Screen
        name="ManageProducts"
        component={ManageProducts}
        options={{ title: 'Manage Products' }}
      />
      <Stack.Screen
        name="SellerOrders"
        component={SellerOrders}
        options={{ title: 'Manage Orders' }}
      />
      <Stack.Screen
        name="ManageShipment"
        component={ManageShipment}
        options={{ title: 'Manage Shipment' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Stack.Navigator>
  );
}
