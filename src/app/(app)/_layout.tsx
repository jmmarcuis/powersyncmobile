import { Stack } from "expo-router";
import React from "react";
import { StatusBar } from "expo-status-bar";
 
export default function AppLayout() {

  return (
    <React.Fragment>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: "Home",
    
          }}
        />
        <Stack.Screen
          name="settings"
          options={{ title: "Settings" }}
        />
      </Stack>
    </React.Fragment>
  );
}