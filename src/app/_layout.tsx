import { Stack, SplashScreen } from "expo-router";
import "../../global.css";
import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { useSegments, useRouter } from 'expo-router';

// Keep the splash screen visible while we check auth state
SplashScreen.preventAutoHideAsync();

function AppWrapper() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated and not in auth group
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to app if authenticated and in auth group
      router.replace('/(app)');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return null; // Splash screen is still visible
  }

  return (
    <React.Fragment>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
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