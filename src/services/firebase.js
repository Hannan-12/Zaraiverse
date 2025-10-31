import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// --- NEW IMPORTS (Corrected) ---
// This line is fixed:
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyD_pl1UERWaLEj2NnsMBKeA3ggLb31qYZ8",
  authDomain: "zaraiverseapp-1f456.firebaseapp.com",
  projectId: "zaraiverseapp-1f456",
  storageBucket: "zaraiverseapp-1f456.appspot.com",
  messagingSenderId: "441550375127",
  appId: "1:441550375127:android:37ed67dbd4d52ff6e88892"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Export other Firebase services
export const db = getFirestore(app);
export const storage = getStorage(app);