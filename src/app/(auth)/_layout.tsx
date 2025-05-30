import { Stack } from "expo-router";
import React from "react";
import { StatusBar } from "expo-status-bar";

export default function AuthLayout() {
  return (
    <React.Fragment>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        {/*
          Define specific screen options for auth screens if needed.
          For example, if you want a custom header for login but not register, you can specify it here.
        */}
        <Stack.Screen name="login" options={{ title: "Login" }} />
        <Stack.Screen name="register" options={{ title: "Register" }} />
      </Stack>
    </React.Fragment>
  );
}