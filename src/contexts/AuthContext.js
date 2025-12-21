// src/contexts/AuthContext.js
import React, { createContext, useEffect, useState, useContext } from 'react';
import { 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword // ✅ Add this import
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { Alert } from 'react-native';

export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let unsubProfile = null;
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        unsubProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            if (userData.status === 'blocked') {
              signOut(auth);
              setUser(null);
              Alert.alert("Access Denied", "Your account has been blocked.");
            } else {
              setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...userData });
            }
          } else {
            setUser({ uid: firebaseUser.uid, email: firebaseUser.email, status: 'pending' });
          }
          setIsLoading(false);
        }, (error) => {
          setIsLoading(false);
          if (error.code === 'permission-denied') setUser(null);
        });
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
    // ✅ Add 'login' and rename/alias 'isLoading' to 'loading' to match LoginScreen.js
    <AuthContext.Provider value={{ user, setUser, isLoading, loading: isLoading, logout, login }}>
      {children}
    </AuthContext.Provider>
  );
};