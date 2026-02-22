import Constants from 'expo-constants';

// Values are injected at build time via app.config.js extra (read from .env by Expo CLI)
export const GROQ_API_KEY = Constants.expoConfig?.extra?.groqApiKey;
export const GROQ_BASE = Constants.expoConfig?.extra?.groqBase ?? 'https://api.groq.com/openai/v1';
