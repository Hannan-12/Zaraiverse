// index.js (Update this file)
import 'react-native-gesture-handler';
import React from 'react';
import { registerRootComponent } from 'expo';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/contexts/AuthContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { CartProvider } from './src/contexts/CartContext'; // <--- IMPORT
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <CartProvider> 
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </CartProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

registerRootComponent(App);