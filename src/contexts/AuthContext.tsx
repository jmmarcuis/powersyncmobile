import React, { createContext, useContext, useState, useEffect } from 'react';
import { router, SplashScreen } from 'expo-router'; // Import router for programmatic navigation
import * as SecureStore from 'expo-secure-store'; // For storing tokens securely

interface AuthContextType {
  isAuthenticated: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean; // To indicate if auth state is being checked
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Initial loading state

  useEffect(() => {
    const loadAuthStatus = async () => {
      try {
        // Check for a stored token or user session
        const userToken = await SecureStore.getItemAsync('userToken'); // Example
        if (userToken) {
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.error("Failed to load auth status:", e);
        // Handle error, e.g., token invalid or corrupted
      } finally {
        setIsLoading(false);
        SplashScreen.hideAsync(); // Hide splash screen once auth status is determined
      }
    };

    loadAuthStatus();
  }, []);

  const signIn = async (token: string) => {
    setIsAuthenticated(true);
    // Navigate to the main app routes after successful sign-in
    router.replace('/(app)');
  };

  const signOut = async () => {
    setIsAuthenticated(false);
    router.replace('/(auth)/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, signIn, signOut, isLoading }}>
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