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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // --- Fetch profile data (name, role, status) from Firestore ---
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        // Use onSnapshot for real-time updates (e.g., if an admin blocks the user)
        const unsubProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            
            // Security Check: Only allow Active users or Admins
            if (userData.role !== 'admin' && userData.status !== 'active') {
              let message = "Your account is pending approval by an admin.";
              if (userData.status === 'blocked') message = "Your account has been blocked.";
              
              Alert.alert("Access Denied", message);
              signOut(auth);
              setUser(null);
            } else {
              // Successfully set user with name and other profile fields
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                ...userData, // This ensures 'name' is available
              });
            }
          } else {
            console.log("Profile not found yet.");
            setUser(null); 
          }
          setIsLoading(false);
        }, (error) => {
          console.error("Profile sync error:", error);
          setIsLoading(false);
        });

        return () => unsubProfile();
      } else {
        setUser(null);
        setIsLoading(false);
      }
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

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};