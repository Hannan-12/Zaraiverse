// src/contexts/AuthContext.js
import React, { createContext, useEffect, useState, useContext } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { Alert } from 'react-native';

export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubProfile = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        // Sync profile data in real-time
        unsubProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            
            // Security: Auto-logout blocked or pending users
            if (userData.role !== 'admin' && userData.status !== 'active') {
              signOut(auth);
              setUser(null);
              Alert.alert("Access Denied", "Your account is not active.");
            } else {
              setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...userData });
            }
          }
          setIsLoading(false);
        }, (error) => {
          console.error("Profile sync error:", error);
          setIsLoading(false);
          // If we lose permission (during logout), clear the user state
          if (error.code === 'permission-denied') setUser(null);
        });
      } else {
        // If Auth state is null, stop the profile listener and clear state
        if (unsubProfile) unsubProfile();
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null); // Force local state clearing
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};