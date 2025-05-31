import { Stack, SplashScreen } from "expo-router";
import "../../global.css";
import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from '../contexts/AuthContext';

// Keep the splash screen visible until the authentication state is checked
SplashScreen.preventAutoHideAsync();

function AppWrapper() {
  const { isAuthenticated, isLoading } = useAuth();

  // No need for manual navigation here - let the router handle it naturally
  // based on the file structure and authentication state

  if (isLoading) {
    // While loading, show nothing (splash screen is still visible)
    return null;
  }

  return (
    <React.Fragment>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        {/* 
          Expo Router will automatically handle routing based on:
          - If authenticated: show (app) routes
          - If not authenticated: show (auth) routes
          You can also add specific redirects in individual _layout files
        */}
      </Stack>
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