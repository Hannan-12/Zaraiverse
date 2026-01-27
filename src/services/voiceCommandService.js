/**
 * Voice Command Service (FR-28 / M-06 / SI-5)
 * Provides speech-to-text and voice command processing
 * Supports both Urdu and English languages
 */

import * as Speech from 'expo-speech';

// Voice command mappings for navigation and actions
const VOICE_COMMANDS = {
  // English commands
  en: {
    // Navigation commands
    'go to dashboard': { action: 'navigate', screen: 'Dashboard' },
    'open dashboard': { action: 'navigate', screen: 'Dashboard' },
    'go to home': { action: 'navigate', screen: 'Dashboard' },
    'go to marketplace': { action: 'navigate', screen: 'Marketplace' },
    'open marketplace': { action: 'navigate', screen: 'Marketplace' },
    'go to shop': { action: 'navigate', screen: 'Marketplace' },
    'go to cart': { action: 'navigate', screen: 'Cart' },
    'open cart': { action: 'navigate', screen: 'Cart' },
    'view cart': { action: 'navigate', screen: 'Cart' },
    'go to orders': { action: 'navigate', screen: 'Orders' },
    'my orders': { action: 'navigate', screen: 'Orders' },
    'go to profile': { action: 'navigate', screen: 'Profile' },
    'open profile': { action: 'navigate', screen: 'Profile' },
    'go to weather': { action: 'navigate', screen: 'WeatherForecast' },
    'check weather': { action: 'navigate', screen: 'WeatherForecast' },
    'weather forecast': { action: 'navigate', screen: 'WeatherForecast' },
    'go to crops': { action: 'navigate', screen: 'MyCrops' },
    'my crops': { action: 'navigate', screen: 'MyCrops' },
    'go to chat': { action: 'navigate', screen: 'Chat' },
    'open chat': { action: 'navigate', screen: 'Chat' },
    'go to chatbot': { action: 'navigate', screen: 'Chatbot' },
    'open chatbot': { action: 'navigate', screen: 'Chatbot' },
    'talk to assistant': { action: 'navigate', screen: 'Chatbot' },
    'go to blogs': { action: 'navigate', screen: 'Blogs' },
    'open blogs': { action: 'navigate', screen: 'Blogs' },
    'go to tasks': { action: 'navigate', screen: 'TaskReminders' },
    'my tasks': { action: 'navigate', screen: 'TaskReminders' },
    'task reminders': { action: 'navigate', screen: 'TaskReminders' },
    'go to help': { action: 'navigate', screen: 'HelpCenter' },
    'help center': { action: 'navigate', screen: 'HelpCenter' },
    'go to settings': { action: 'navigate', screen: 'Settings' },
    'open settings': { action: 'navigate', screen: 'Settings' },
    'go to analytics': { action: 'navigate', screen: 'Analytics' },
    'view analytics': { action: 'navigate', screen: 'Analytics' },
    'go to notifications': { action: 'navigate', screen: 'Notifications' },
    'view notifications': { action: 'navigate', screen: 'Notifications' },

    // Action commands
    'go back': { action: 'goBack' },
    'back': { action: 'goBack' },
    'logout': { action: 'logout' },
    'log out': { action: 'logout' },
    'sign out': { action: 'logout' },
    'refresh': { action: 'refresh' },
    'search': { action: 'search' },
    'add to cart': { action: 'addToCart' },
    'checkout': { action: 'checkout' },
    'place order': { action: 'placeOrder' },
  },

  // Urdu commands (romanized for easier voice recognition)
  ur: {
    // Navigation commands
    'dashboard kholein': { action: 'navigate', screen: 'Dashboard' },
    'ghar jaein': { action: 'navigate', screen: 'Dashboard' },
    'market jaein': { action: 'navigate', screen: 'Marketplace' },
    'dukaan kholein': { action: 'navigate', screen: 'Marketplace' },
    'cart kholein': { action: 'navigate', screen: 'Cart' },
    'tokri dekhein': { action: 'navigate', screen: 'Cart' },
    'order dekhein': { action: 'navigate', screen: 'Orders' },
    'mere order': { action: 'navigate', screen: 'Orders' },
    'profile kholein': { action: 'navigate', screen: 'Profile' },
    'mausam dekhein': { action: 'navigate', screen: 'WeatherForecast' },
    'mausam ki report': { action: 'navigate', screen: 'WeatherForecast' },
    'faslen dekhein': { action: 'navigate', screen: 'MyCrops' },
    'meri faslen': { action: 'navigate', screen: 'MyCrops' },
    'chat kholein': { action: 'navigate', screen: 'Chat' },
    'baat karein': { action: 'navigate', screen: 'Chat' },
    'madad': { action: 'navigate', screen: 'HelpCenter' },
    'madad center': { action: 'navigate', screen: 'HelpCenter' },
    'settings kholein': { action: 'navigate', screen: 'Settings' },
    'blogs dekhein': { action: 'navigate', screen: 'Blogs' },
    'kaam dekhein': { action: 'navigate', screen: 'TaskReminders' },
    'yaad dahani': { action: 'navigate', screen: 'TaskReminders' },

    // Action commands
    'wapis jaein': { action: 'goBack' },
    'peechay': { action: 'goBack' },
    'logout karein': { action: 'logout' },
    'bahar jaein': { action: 'logout' },
    'taza karein': { action: 'refresh' },
    'talash karein': { action: 'search' },
    'cart mein dalein': { action: 'addToCart' },
    'order karein': { action: 'placeOrder' },
  }
};

// Fuzzy matching threshold
const SIMILARITY_THRESHOLD = 0.7;

/**
 * Calculate similarity between two strings using Levenshtein distance
 */
const calculateSimilarity = (str1, str2) => {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  const matrix = [];

  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const maxLen = Math.max(s1.length, s2.length);
  return 1 - matrix[s1.length][s2.length] / maxLen;
};

/**
 * Find the best matching command for the given input
 */
export const findMatchingCommand = (input, language = 'en') => {
  if (!input || typeof input !== 'string') return null;

  const normalizedInput = input.toLowerCase().trim();
  const commands = VOICE_COMMANDS[language] || VOICE_COMMANDS.en;

  // First, try exact match
  if (commands[normalizedInput]) {
    return {
      command: normalizedInput,
      match: commands[normalizedInput],
      confidence: 1
    };
  }

  // Try fuzzy matching
  let bestMatch = null;
  let bestSimilarity = 0;

  for (const [command, action] of Object.entries(commands)) {
    const similarity = calculateSimilarity(normalizedInput, command);

    // Also check if input contains the command
    if (normalizedInput.includes(command) || command.includes(normalizedInput)) {
      const containsSimilarity = Math.max(similarity, 0.8);
      if (containsSimilarity > bestSimilarity) {
        bestSimilarity = containsSimilarity;
        bestMatch = { command, match: action, confidence: containsSimilarity };
      }
    } else if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestMatch = { command, match: action, confidence: similarity };
    }
  }

  if (bestMatch && bestMatch.confidence >= SIMILARITY_THRESHOLD) {
    return bestMatch;
  }

  return null;
};

/**
 * Speak text using text-to-speech
 */
export const speak = async (text, language = 'en') => {
  try {
    const langCode = language === 'ur' ? 'ur-PK' : 'en-US';

    await Speech.speak(text, {
      language: langCode,
      pitch: 1,
      rate: 0.9,
      onError: (error) => console.error('Speech error:', error),
    });
  } catch (error) {
    console.error('Error speaking:', error);
  }
};

/**
 * Stop any ongoing speech
 */
export const stopSpeaking = async () => {
  try {
    await Speech.stop();
  } catch (error) {
    console.error('Error stopping speech:', error);
  }
};

/**
 * Check if speech is currently playing
 */
export const isSpeaking = async () => {
  try {
    return await Speech.isSpeakingAsync();
  } catch (error) {
    console.error('Error checking speech status:', error);
    return false;
  }
};

/**
 * Get available voices for a language
 */
export const getAvailableVoices = async () => {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    return voices;
  } catch (error) {
    console.error('Error getting voices:', error);
    return [];
  }
};

/**
 * Process voice command and return action
 */
export const processVoiceCommand = (transcript, language = 'en') => {
  const matchResult = findMatchingCommand(transcript, language);

  if (matchResult) {
    return {
      success: true,
      action: matchResult.match.action,
      screen: matchResult.match.screen,
      command: matchResult.command,
      confidence: matchResult.confidence,
      originalTranscript: transcript
    };
  }

  return {
    success: false,
    action: null,
    screen: null,
    command: null,
    confidence: 0,
    originalTranscript: transcript,
    message: language === 'ur'
      ? 'Maaf kijiye, command samajh nahi aayi. Dobara koshish karein.'
      : 'Sorry, command not recognized. Please try again.'
  };
};

/**
 * Get list of available commands for display
 */
export const getAvailableCommands = (language = 'en') => {
  const commands = VOICE_COMMANDS[language] || VOICE_COMMANDS.en;
  return Object.keys(commands);
};

/**
 * Voice feedback messages
 */
export const VOICE_FEEDBACK = {
  en: {
    listening: 'Listening...',
    processing: 'Processing your command...',
    navigating: (screen) => `Navigating to ${screen}`,
    actionExecuted: (action) => `${action} executed`,
    notRecognized: 'Command not recognized. Please try again.',
    error: 'An error occurred. Please try again.',
    welcome: 'Voice commands activated. How can I help you?',
    goodbye: 'Voice commands deactivated.',
  },
  ur: {
    listening: 'Sun raha hoon...',
    processing: 'Aapki command par amal ho raha hai...',
    navigating: (screen) => `${screen} par ja raha hoon`,
    actionExecuted: (action) => `${action} mukammal`,
    notRecognized: 'Command samajh nahi aayi. Dobara koshish karein.',
    error: 'Koi masla ho gaya. Dobara koshish karein.',
    welcome: 'Voice commands shuru. Main aapki kya madad kar sakta hoon?',
    goodbye: 'Voice commands band.',
  }
};

export default {
  findMatchingCommand,
  processVoiceCommand,
  speak,
  stopSpeaking,
  isSpeaking,
  getAvailableVoices,
  getAvailableCommands,
  VOICE_FEEDBACK
};
