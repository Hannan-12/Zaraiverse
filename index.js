// index.js
import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { registerRootComponent } from 'expo';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/contexts/AuthContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { CartProvider } from './src/contexts/CartContext';
import { OfflineSyncProvider } from './src/contexts/OfflineSyncContext';
import { VoiceCommandProvider } from './src/contexts/VoiceCommandContext';
import AppNavigator from './src/navigation/AppNavigator';
import VoiceCommandButton from './src/components/VoiceCommandButton';

// Initialize error logging service (REL-3)
import { initializeErrorLogging } from './src/services/errorLoggingService';

// Inner app component that uses navigation
function AppContent() {
  return (
    <>
      <AppNavigator />
      <VoiceCommandButton position="bottom-right" />
    </>
  );
}

function App() {
  // Initialize services on app start
  useEffect(() => {
    // Initialize error logging (REL-3)
    initializeErrorLogging().catch(error => {
      console.log('Error logging initialization failed:', error);
    });
  }, []);

  return (
    <AuthProvider>
      <LanguageProvider>
        <CartProvider>
          <OfflineSyncProvider>
            <NavigationContainer>
              <VoiceCommandProvider>
                <AppContent />
              </VoiceCommandProvider>
            </NavigationContainer>
          </OfflineSyncProvider>
        </CartProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

registerRootComponent(App);