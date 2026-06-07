/**
 * Voice Command Context (FR-28 / M-06)
 * Provides voice command functionality across the app
 * Supports Urdu and English languages
 *
 * NOTE: Real speech-to-text requires @react-native-voice/voice (native module).
 * Until that package is added, commands are processed via text input.
 * Text-to-speech feedback works via expo-speech.
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

export const VoiceCommandProvider = ({ children }) => {
  const navigation = useNavigation();
  const { language } = useLanguage();
  const { logout } = useAuth();

  const [isEnabled, setIsEnabled] = useState(true); // enabled by default
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState(null);
  const [commandHistory, setCommandHistory] = useState([]);
  const [voiceFeedbackEnabled, setVoiceFeedbackEnabled] = useState(true);

  const voiceLang = language === 'ur' ? 'ur' : 'en';
  const feedback = VOICE_FEEDBACK[voiceLang];

  const provideFeedback = useCallback(async (message) => {
    if (voiceFeedbackEnabled) {
      await speak(message, voiceLang);
    }
  }, [voiceFeedbackEnabled, voiceLang]);

  const executeNavigationAction = useCallback(async (screen) => {
    try {
      await provideFeedback(feedback.navigating(screen));

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

  const executeAction = useCallback(async (action) => {
    try {
      switch (action) {
        case 'goBack':
          await provideFeedback('Going back');
          navigation.goBack();
          break;
        case 'logout':
          Alert.alert(
            'Logout',
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
          break;
        case 'search':
          await provideFeedback('Opening search');
          break;
        case 'addToCart':
          await provideFeedback('Adding to cart');
          break;
        case 'checkout':
          await provideFeedback('Going to checkout');
          navigation.navigate('Cart');
          break;
        case 'placeOrder':
          await provideFeedback('Processing order');
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

  const handleVoiceCommand = useCallback(async (inputText) => {
    if (!inputText || !inputText.trim() || isProcessing) return;

    setIsProcessing(true);
    const trimmed = inputText.trim();
    setTranscript(trimmed);

    try {
      const result = processVoiceCommand(trimmed, voiceLang);

      const historyEntry = {
        id: Date.now(),
        transcript: trimmed,
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

  // Mic button: show alert that native STT is not available, guide user to type
  const startListening = useCallback(async () => {
    if (!isEnabled) return false;

    Alert.alert(
      language === 'ur' ? 'آواز سے کمانڈ' : 'Voice Input',
      language === 'ur'
        ? 'آواز پہچان فی الحال دستیاب نہیں۔ نیچے کمانڈ ٹائپ کریں۔\n\nمثال: "go to marketplace" یا "mere order"'
        : 'Live microphone recognition is not available in this build.\n\nPlease type your command below.\n\nExample: "go to marketplace" or "my orders"',
      [{ text: 'OK' }]
    );
    return false;
  }, [isEnabled, language]);

  const stopListening = useCallback(async () => {
    setIsListening(false);
  }, []);

  const processTextCommand = useCallback(async (text) => {
    await handleVoiceCommand(text);
  }, [handleVoiceCommand]);

  const setRecognizedText = useCallback((text) => {
    setTranscript(text);
  }, []);

  const enableVoiceCommands = useCallback(async () => {
    setIsEnabled(true);
    await provideFeedback(feedback.welcome);
  }, [provideFeedback, feedback]);

  const disableVoiceCommands = useCallback(async () => {
    setIsEnabled(false);
    await stopSpeaking();
  }, []);

  const toggleVoiceCommands = useCallback(async () => {
    if (isEnabled) {
      await disableVoiceCommands();
    } else {
      await enableVoiceCommands();
    }
  }, [isEnabled, enableVoiceCommands, disableVoiceCommands]);

  const clearHistory = useCallback(() => {
    setCommandHistory([]);
    setLastCommand(null);
  }, []);

  useEffect(() => {
    return () => { stopSpeaking(); };
  }, []);

  const value = {
    isEnabled,
    isListening,
    isProcessing,
    transcript,
    lastCommand,
    commandHistory,
    voiceFeedbackEnabled,
    startListening,
    stopListening,
    processTextCommand,
    enableVoiceCommands,
    disableVoiceCommands,
    toggleVoiceCommands,
    setVoiceFeedbackEnabled,
    clearHistory,
    setRecognizedText,
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
