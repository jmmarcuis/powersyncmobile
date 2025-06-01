import { View, ScrollView, TouchableOpacity } from "react-native";
import { AppText } from "@/components/AppText";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "@/components/Button";
import React, { useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function SettingsScreen() {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    console.log("Attempting Firebase logout...");
    try {
      await signOut();
      console.log("User logged out successfully");
      alert("You have been logged out successfully!");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const placeholderAction = (action: string) => {
    console.log(`${action} pressed`);
    alert(`${action} action triggered! This will be a new feature in the upcoming updates`);
  };

  return (
    <View className="flex-1 bg-neutral-900">
      {/* Header */}
      <View className="flex-row items-center p-4 pt-12 bg-neutral-900">
        <TouchableOpacity onPress={() => placeholderAction("Go Back")} className="p-2">
          <MaterialCommunityIcons name="arrow-left" size={24} color="#C6F806" />
        </TouchableOpacity>
        <View className="flex-1 items-center">
          <AppText className="text-2xl text-white font-bold ml-[-32px]">Profile</AppText>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 30, paddingHorizontal: 16 }}
      >
        {/* Profile Section */}
        <View className="items-center mt-6 mb-8">
          <View className="w-28 h-28 bg-neutral-700 rounded-full mb-3 items-center justify-center">
            <MaterialCommunityIcons name="account-circle" size={56} color="#C6F806" />
          </View>
          <AppText className="text-3xl text-white font-semibold">User</AppText>
          <Button title="Edit Profile" onPress={() => placeholderAction("Edit Profile Main")} />
        </View>

        {/* Stats Section */}
        <View className="flex-row justify-around mb-10">
          <View className="bg-neutral-800 p-4 rounded-xl items-center w-[100px] mx-1">
            <AppText className="text-xl text-primary font-bold">180cm</AppText>
            <AppText className="text-sm text-neutral-400">Height</AppText>
          </View>
          <View className="bg-neutral-800 p-4 rounded-xl items-center w-[100px] mx-1">
            <AppText className="text-xl text-primary font-bold">65kg</AppText>
            <AppText className="text-sm text-neutral-400">Weight</AppText>
          </View>
          <View className="bg-neutral-800 p-4 rounded-xl items-center w-[100px] mx-1">
            <AppText className="text-xl text-primary font-bold">22yo</AppText>
            <AppText className="text-sm text-neutral-400">Age</AppText>
          </View>
        </View>

        {/* Account Section */}
        <View className="mb-6">
          <AppText className="text-lg text-neutral-400 font-semibold mb-3 px-2">Account</AppText>
          <View className="bg-neutral-800 rounded-xl p-1">
            <SettingItem
              icon="pencil"
              text="Edit profile information"
              onPress={() => placeholderAction("Edit Profile Info")}
            />
            <SettingItem
              icon="web"
              text="Language"
              value="English"
              isValueGreen
              onPress={() => placeholderAction("Language")}
            />
            <SettingItem
              icon="lock"
              text="Change Password"
              onPress={() => placeholderAction("Change Password")}
            />
          </View>
        </View>

        {/* Help & Support Section */}
        <View className="mb-8">
          <View className="bg-neutral-800 rounded-xl p-1">
            <SettingItem
              icon="phone"
              text="Contact us"
              onPress={() => placeholderAction("Contact Us")}
            />
            <SettingItem
              icon="shield"
              text="Privacy policy"
              onPress={() => placeholderAction("Privacy Policy")}
            />
          </View>
        </View>

        {/* Logout Button */}
        <View className="bg-neutral-800 rounded-xl p-1">
          <TouchableOpacity onPress={handleLogout} className="flex-row items-center p-4">
            <MaterialCommunityIcons name="logout" size={24} color="#AE1C1C" />
            <AppText className="text-lg text-red-500 flex-1 ml-4">Logout</AppText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// Helper component for settings items to reduce repetition
interface SettingItemProps {
  icon: string;
  text: string;
  value?: string;
  onPress: () => void;
  isValueGreen?: boolean;
}



const SettingItem = ({ icon, text, value, onPress, isValueGreen }: SettingItemProps) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center p-4 "
  >
    <View className="w-6 items-center justify-center mr-4 self-center">
      <MaterialCommunityIcons name={icon as any} size={24} color="#ffffff" />
    </View>
    <AppText className="  text-white flex-1 self-center">{text}</AppText>
    {value && (
      <AppText className={`  ${isValueGreen ? "text-lime-500" : "text-neutral-400"} self-center`}>
        {value}
      </AppText>
    )}
  </TouchableOpacity>
);