import { Stack, Redirect, SplashScreen, router } from "expo-router";
import "../../global.css";
import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from '../contexts/AuthContext'; // Import your AuthProvider and useAuth

// Keep the splash screen visible until the authentication state is checked
SplashScreen.preventAutoHideAsync();

function AppWrapper() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      // Once loading is complete, redirect based on auth status
      if (isAuthenticated) {
        router.replace('/(app)'); // Go to main app if authenticated
      } else {
        router.replace('/(auth)/login'); // Go to login if not authenticated
      }
    }
  }, [isAuthenticated, isLoading]); // Depend on isAuthenticated and isLoading

  if (isLoading) {
    // While loading, you might show nothing or a custom loading screen
    return null; // Or a custom <LoadingScreen /> component
  }

  return (
    <React.Fragment>
      <StatusBar style="auto" />
      {isAuthenticated ? (
        // If authenticated, render the main app stack
        // This will automatically pick up src/app/(app)/_layout.tsx
        <Stack screenOptions={{ headerShown: false }} />
      ) : (
        // If not authenticated, render the authentication stack
        // This will automatically pick up src/app/(auth)/_layout.tsx
        <Stack screenOptions={{ headerShown: false }} />
      )}
    </React.Fragment>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppWrapper />
    </AuthProvider>
  );
}