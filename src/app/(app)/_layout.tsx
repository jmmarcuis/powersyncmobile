// app/(app)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AppLayout() {
  const iconSize = 26;
  const activeTabColor = '#C6F806'; // Yellow color for active tab and special icons
  const inactiveTabColor = '#8E8E93'; // Gray for inactive icons
  const tabBackgroundColor = '#121212'; // Dark background for the tab bar, similar to image


  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Hides the header for screens in this layout
        tabBarShowLabel: false, // Shows only icons, no labels
        tabBarStyle: {
          backgroundColor: tabBackgroundColor,
          borderTopWidth: 0, // Removes the top border line from the tab bar
          height: 80, // Adjust height as needed
          paddingBottom: 30, // Pushes icons up if you have a taller tab bar for safe areas
          paddingTop: 10, // Adds padding to the top of the tab bar
        },
        tabBarActiveTintColor: activeTabColor,
        tabBarInactiveTintColor: inactiveTabColor,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="home" size={iconSize} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: 'Workout',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="dumbbell" size={iconSize} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          title: 'Machine Learning Record',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="record" size={iconSize} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="camera" size={iconSize} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings" // This will link to your app/(app)/settings.tsx
        options={{
          title: 'Settings', // Or "Profile"
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="account" size={iconSize} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
