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
        
        unsubProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            
            // ✅ Only auto-logout if the user is BLOCKED. 
            // Allow 'pending' and 'active' users to stay logged in.
            if (userData.status === 'blocked') {
              signOut(auth);
              setUser(null);
              Alert.alert("Access Denied", "Your account has been blocked.");
            } else {
              setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...userData });
            }
          } else {
            // Profile document creation might be in progress
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
    <AuthContext.Provider value={{ user, setUser, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};