/**
 * Voice Command Context (FR-28 / M-06)
 * Provides voice command functionality across the app
 * Supports Urdu and English languages
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from './LanguageContext';
import { useAuth } from './AuthContext';
import VoiceCommandService, {
  processVoiceCommand,
  speak,
  stopSpeaking,
  VOICE_FEEDBACK
} from '../services/voiceCommandService';

const VoiceCommandContext = createContext();

// Simulated voice recognition for Expo (react-native-voice requires native modules)
// In production, you would use @react-native-voice/voice with expo-dev-client
const useSimulatedVoiceRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);

  const startListening = useCallback(async () => {
    setIsListening(true);
    setTranscript('');
    setError(null);
    // In real implementation, this would start the native voice recognition
    return true;
  }, []);

  const stopListening = useCallback(async () => {
    setIsListening(false);
    return transcript;
  }, [transcript]);

  const setRecognizedText = useCallback((text) => {
    setTranscript(text);
  }, []);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    setRecognizedText,
    setError
  };
};

export const VoiceCommandProvider = ({ children }) => {
  const navigation = useNavigation();
  const { language } = useLanguage();
  const { logout } = useAuth();

  const [isEnabled, setIsEnabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCommand, setLastCommand] = useState(null);
  const [commandHistory, setCommandHistory] = useState([]);
  const [voiceFeedbackEnabled, setVoiceFeedbackEnabled] = useState(true);

  const voiceRecognition = useSimulatedVoiceRecognition();
  const commandQueueRef = useRef([]);

  // Get language code for voice service
  const voiceLang = language === 'ur' ? 'ur' : 'en';
  const feedback = VOICE_FEEDBACK[voiceLang];

  /**
   * Provide voice feedback to user
   */
  const provideFeedback = useCallback(async (message) => {
    if (voiceFeedbackEnabled) {
      await speak(message, voiceLang);
    }
  }, [voiceFeedbackEnabled, voiceLang]);

  /**
   * Execute a navigation action
   */
  const executeNavigationAction = useCallback(async (screen) => {
    try {
      await provideFeedback(feedback.navigating(screen));

      // Map screen names to actual navigation routes
      const screenRoutes = {
        'Dashboard': 'FarmerDashboard',
        'Marketplace': 'Marketplace',
        'Cart': 'Cart',
        'Orders': 'OrdersScreen',
        'Profile': 'FarmerProfile',
        'WeatherForecast': 'WeatherForecast',
        'MyCrops': 'MyCrops',
        'Chat': 'Chat',
        'Chatbot': 'Chatbot',
        'Blogs': 'BlogList',
        'TaskReminders': 'TaskReminders',
        'HelpCenter': 'HelpCenter',
        'Settings': 'SettingsScreen',
        'Analytics': 'FarmerAnalytics',
        'Notifications': 'NotificationSettings',
      };

      const route = screenRoutes[screen] || screen;
      navigation.navigate(route);

      return true;
    } catch (error) {
      console.error('Navigation error:', error);
      return false;
    }
  }, [navigation, provideFeedback, feedback]);

  /**
   * Execute a general action
   */
  const executeAction = useCallback(async (action) => {
    try {
      switch (action) {
        case 'goBack':
          await provideFeedback('Going back');
          navigation.goBack();
          break;

        case 'logout':
          Alert.alert(
            language === 'ur' ? 'Logout' : 'Logout',
            language === 'ur' ? 'Kya aap logout karna chahtay hain?' : 'Are you sure you want to logout?',
            [
              { text: language === 'ur' ? 'Nahi' : 'Cancel', style: 'cancel' },
              {
                text: language === 'ur' ? 'Haan' : 'Logout',
                onPress: async () => {
                  await provideFeedback(feedback.goodbye);
                  logout();
                }
              }
            ]
          );
          break;

        case 'refresh':
          await provideFeedback('Refreshing');
          // This would trigger a refresh in the current screen
          // Implementation depends on screen-specific refresh logic
          break;

        case 'search':
          await provideFeedback('Opening search');
          // Navigate to search or open search modal
          break;

        case 'addToCart':
          await provideFeedback('Adding to cart');
          // This would be handled by the specific product screen
          break;

        case 'checkout':
          await provideFeedback('Going to checkout');
          navigation.navigate('Cart');
          break;

        case 'placeOrder':
          await provideFeedback('Processing order');
          // This would trigger order placement in checkout screen
          break;

        default:
          await provideFeedback(feedback.notRecognized);
          return false;
      }

      return true;
    } catch (error) {
      console.error('Action execution error:', error);
      await provideFeedback(feedback.error);
      return false;
    }
  }, [navigation, logout, language, provideFeedback, feedback]);

  /**
   * Process and execute a voice command
   */
  const handleVoiceCommand = useCallback(async (transcript) => {
    if (!transcript || isProcessing) return;

    setIsProcessing(true);
    await provideFeedback(feedback.processing);

    try {
      const result = processVoiceCommand(transcript, voiceLang);

      // Add to history
      const historyEntry = {
        id: Date.now(),
        transcript,
        result,
        timestamp: new Date().toISOString()
      };
      setCommandHistory(prev => [historyEntry, ...prev.slice(0, 49)]);
      setLastCommand(historyEntry);

      if (result.success) {
        if (result.action === 'navigate' && result.screen) {
          await executeNavigationAction(result.screen);
        } else if (result.action) {
          await executeAction(result.action);
        }
      } else {
        await provideFeedback(result.message || feedback.notRecognized);
      }
    } catch (error) {
      console.error('Voice command processing error:', error);
      await provideFeedback(feedback.error);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, voiceLang, provideFeedback, feedback, executeNavigationAction, executeAction]);

  /**
   * Start listening for voice commands
   */
  const startListening = useCallback(async () => {
    if (!isEnabled) {
      Alert.alert(
        'Voice Commands',
        'Voice commands are disabled. Enable them in settings.',
        [{ text: 'OK' }]
      );
      return false;
    }

    try {
      await stopSpeaking();
      await provideFeedback(feedback.listening);
      const started = await voiceRecognition.startListening();
      return started;
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      await provideFeedback(feedback.error);
      return false;
    }
  }, [isEnabled, voiceRecognition, provideFeedback, feedback]);

  /**
   * Stop listening and process the command
   */
  const stopListening = useCallback(async () => {
    try {
      const transcript = await voiceRecognition.stopListening();
      if (transcript) {
        await handleVoiceCommand(transcript);
      }
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
    }
  }, [voiceRecognition, handleVoiceCommand]);

  /**
   * Process text input as a voice command (for testing/accessibility)
   */
  const processTextCommand = useCallback(async (text) => {
    await handleVoiceCommand(text);
  }, [handleVoiceCommand]);

  /**
   * Enable voice commands
   */
  const enableVoiceCommands = useCallback(async () => {
    setIsEnabled(true);
    await provideFeedback(feedback.welcome);
  }, [provideFeedback, feedback]);

  /**
   * Disable voice commands
   */
  const disableVoiceCommands = useCallback(async () => {
    setIsEnabled(false);
    await stopSpeaking();
    await provideFeedback(feedback.goodbye);
  }, [provideFeedback, feedback]);

  /**
   * Toggle voice commands
   */
  const toggleVoiceCommands = useCallback(async () => {
    if (isEnabled) {
      await disableVoiceCommands();
    } else {
      await enableVoiceCommands();
    }
  }, [isEnabled, enableVoiceCommands, disableVoiceCommands]);

  /**
   * Clear command history
   */
  const clearHistory = useCallback(() => {
    setCommandHistory([]);
    setLastCommand(null);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const value = {
    // State
    isEnabled,
    isListening: voiceRecognition.isListening,
    isProcessing,
    transcript: voiceRecognition.transcript,
    lastCommand,
    commandHistory,
    voiceFeedbackEnabled,

    // Actions
    startListening,
    stopListening,
    processTextCommand,
    enableVoiceCommands,
    disableVoiceCommands,
    toggleVoiceCommands,
    setVoiceFeedbackEnabled,
    clearHistory,

    // For testing - set transcript directly
    setRecognizedText: voiceRecognition.setRecognizedText,

    // Utilities
    speak,
    stopSpeaking,
    getAvailableCommands: () => VoiceCommandService.getAvailableCommands(voiceLang),
  };

  return (
    <VoiceCommandContext.Provider value={value}>
      {children}
    </VoiceCommandContext.Provider>
  );
};

export const useVoiceCommand = () => {
  const context = useContext(VoiceCommandContext);
  if (!context) {
    throw new Error('useVoiceCommand must be used within a VoiceCommandProvider');
  }
  return context;
};

export default VoiceCommandContext;
