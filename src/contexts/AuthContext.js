import React, { createContext, useEffect, useState, useContext } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { Alert } from 'react-native';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            
            // --- SECURITY CHECK ---
            // If role is 'admin', allow access regardless of status.
            if (userData.role !== 'admin' && userData.status !== 'active') {
              
              let message = "Your account is pending approval by an admin.";
              if (userData.status === 'blocked') message = "Your account has been blocked.";
              
              Alert.alert("Access Denied", message);
              await signOut(auth);
              setUser(null);
            } 
            else {
              // User is Active OR User is Admin
              setUser({
                ...firebaseUser,
                role: userData.role || 'farmer',
              });
            }
          } else {
            // ✅ FIX: Do NOT sign out immediately. 
            // The profile might be in the process of being created (Registration flow).
            // We just set user to null so the app stays on the Login screen, 
            // but the Firebase Auth session remains alive for setDoc to work.
            console.log("User profile not found yet (new registration?)");
            setUser(null); 
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const value = {
    user,
    setUser,
    isLoading,
    isAuthenticated: !!user,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};