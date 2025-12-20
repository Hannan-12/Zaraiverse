// src/contexts/AuthContext.js
import React, { createContext, useEffect, useState, useContext } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/snapshot';
import { auth, db } from '../services/firebase';
import { Alert } from 'react-native';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubProfile = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        unsubProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            
            // Only force logout for BLOCKED users
            if (userData.status === 'blocked') {
              signOut(auth);
              setUser(null);
              Alert.alert("Denied", "Your account is blocked.");
            } else {
              setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...userData });
            }
          } else {
            setUser({ uid: firebaseUser.uid, email: firebaseUser.email, status: 'pending' });
          }
          setIsLoading(false);
        }, () => setIsLoading(false));
      } else {
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
    try { await signOut(auth); setUser(null); } catch (e) { console.error(e); }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};