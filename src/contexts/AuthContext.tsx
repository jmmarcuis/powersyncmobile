import React, { createContext, useContext, useState, useEffect } from 'react';
import { SplashScreen } from 'expo-router';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  user: FirebaseAuthTypes.User | null;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = auth().onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        setIsAuthenticated(true);
        setUser(firebaseUser);
      } else {
        // User is signed out
        setIsAuthenticated(false);
        setUser(null);
      }
      
      setIsLoading(false);
      SplashScreen.hideAsync();
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await auth().signOut();
      // The onAuthStateChanged listener will handle state updates and navigation
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, signOut, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};