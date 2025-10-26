import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MyCropsScreen from '../screens/farmer/MyCropsScreen';
import CropProgressScreen from '../screens/farmer/CropProgressScreen';
// --- 1. MAKE SURE THIS IMPORT IS HERE ---
import AddCropScreen from '../screens/farmer/AddCropScreen'; 

const Stack = createStackNavigator();

export default function MyCropsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MyCropsList"
        component={MyCropsScreen} 
        options={{ title: 'My Crops' }}
      />
      <Stack.Screen 
        name="CropProgress" 
        component={CropProgressScreen} 
        options={{ title: 'Crop Progress' }} 
      />
      
      {/* --- 2. MAKE SURE THIS SCREEN IS REGISTERED --- */}
      <Stack.Screen 
        name="AddCrop" 
        component={AddCropScreen} 
        options={{ 
          title: 'Add New Crop',
          presentation: 'modal'
        }} 
      />
    </Stack.Navigator>
  );
}