import Constants from 'expo-constants';

// Primary: injected via app.config.js extra
// Fallback: EXPO_PUBLIC_ vars are automatically available in the bundle
export const GROQ_API_KEY =
  Constants.expoConfig?.extra?.groqApiKey ||
  process.env.EXPO_PUBLIC_GROQ_API_KEY;

export const GROQ_BASE =
  Constants.expoConfig?.extra?.groqBase ||
  'https://api.groq.com/openai/v1';
