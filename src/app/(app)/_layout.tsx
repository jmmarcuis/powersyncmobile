// app/(app)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { FontAwesome, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons'; // Or your preferred icon library

export default function AppLayout() {
  const iconSize = 26;
  const activeTabColor = '#FFFF00'; // Yellow color for active tab and special icons
  const inactiveTabColor = '#8E8E93'; // Gray for inactive icons
  const tabBackgroundColor = '#121212'; // Dark background for the tab bar, similar to image
  const plusIconBackgroundColor = '#FFFF00'; // Yellow background for the plus icon's circle
  const plusIconColor = '#1C1C1E'; // Dark color for the plus symbol itself

  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Hides the header for screens in this layout
        tabBarShowLabel: false, // Shows only icons, no labels
        tabBarStyle: {
          backgroundColor: tabBackgroundColor,
          borderTopWidth: 0, // Removes the top border line from the tab bar
          height: 90, // Adjust height as needed
          paddingBottom: 30, // Pushes icons up if you have a taller tab bar for safe areas
        },
        tabBarActiveTintColor: activeTabColor,
        tabBarInactiveTintColor: inactiveTabColor,
      }}
    >
      <Tabs.Screen
        name="index" // Links to app/(app)/index.tsx
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <FontAwesome name="home" size={iconSize} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="workouts" // Create app/(app)/workouts.tsx for this tab
        options={{
          title: 'Workouts',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="dumbbell" size={iconSize} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create" // Create app/(app)/create.tsx for this tab
        options={{
          title: 'Create',
          tabBarIcon: ({ focused }) => ( // `focused` can be used if its style changes when active
            <View
              style={{
                width: iconSize + 14, // Making the circle a bit larger
                height: iconSize + 14,
                borderRadius: (iconSize + 14) / 2,
                backgroundColor: plusIconBackgroundColor,
                justifyContent: 'center',
                alignItems: 'center',
                // You can add a slight elevation or shadow here if desired
              }}
            >
              <Ionicons name="add" size={iconSize} color={plusIconColor} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="chat" // Create app/(app)/chat.tsx for this tab
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => (
            <Ionicons name="chatbubble-ellipses-outline" size={iconSize} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings" // This will link to your app/(app)/settings.tsx
        options={{
          title: 'Settings', // Or "Profile"
          tabBarIcon: ({ color }) => (
            <FontAwesome name="user" size={iconSize} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}