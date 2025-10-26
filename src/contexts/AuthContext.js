// src/contexts/AuthContext.js
import React, { createContext, useEffect, useState, useContext } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch user profile from Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userProfileData = userDocSnap.data();
            setUser({
              ...firebaseUser,
              role: userProfileData.role || 'Seller',
            });
          } else {
            console.warn("⚠️ User document doesn't exist in Firestore!");
            setUser(firebaseUser); // fallback
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setUser(null);
      }

      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  // ✅ Logout function
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('❌ Error during logout:', error);
    }
  };

  const value = {
    user,
    setUser,
    isLoading,
    isAuthenticated: !!user,
    logout, // ✅ expose logout function
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
