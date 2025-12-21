import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SellerDashboard from '../screens/seller/SellerDashboard';
import AddNewProduct from '../screens/seller/AddNewProduct';
import ManageProducts from '../screens/seller/ManageProducts';
import SellerOrders from '../screens/seller/SellerOrders';
import ManageShipment from '../screens/seller/ManageShipment';
import ProfileScreen from '../screens/seller/ProfileScreen';

// --- ADD THESE IMPORTS ---
import HelpCenterScreen from '../screens/common/HelpCenterScreen';
import PrivacyPolicyScreen from '../screens/common/PrivacyPolicyScreen';

const Stack = createStackNavigator();

export default function SellerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: '#2E8B57' }}>
      <Stack.Screen name="SellerDashboard" component={SellerDashboard} options={{ title: 'Dashboard' }} />
      <Stack.Screen name="PostProduct" component={AddNewProduct} options={{ title: 'Add Product' }} />
      <Stack.Screen name="ManageProducts" component={ManageProducts} options={{ title: 'My Products' }} />
      <Stack.Screen name="SellerOrders" component={SellerOrders} options={{ title: 'Orders' }} />
      <Stack.Screen name="ManageShipment" component={ManageShipment} options={{ title: 'Shipments' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      
      {/* --- ADD THESE SCREENS --- */}
      <Stack.Screen name="HelpCenter" component={HelpCenterScreen} options={{ title: 'Help Center' }} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: 'Privacy Policy' }} />
    </Stack.Navigator>
  );
}