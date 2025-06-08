// app/(app)/index.tsx
import { View, Image, TouchableOpacity } from "react-native";
import { AppText } from "@/components/AppText";
import React from "react";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { useUserProfile } from "../../hooks/UserHooks";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function IndexScreen() {
  const { userProfile, loadingProfile } = useUserProfile();
  const router = useRouter();

  return (
    <View className="flex-1 p-6 pt-16 bg-neutral-900">
      <View className="flex-row justify-between items-center">
        {/* Header */}
        <View>
          <AppText className="text-2xl text-white">
            {(() => {
              const hour = new Date().getHours();
              if (hour < 12) {
                return "Good Morning 🔥";
              } else if (hour < 18) {
                return "Good Afternoon ☀️";
              } else {
                return "Good Evening 🌙";
              }
            })()}
          </AppText>

          {loadingProfile ? (
            <SkeletonLoader width={160} height={30} />
          ) : (
            <AppText className="text-2xl font-bold text-white">
              {userProfile?.displayName || "User"}
            </AppText>
          )}
        </View>

        {loadingProfile ? (
          <SkeletonLoader width={60} height={60} />
        ) : userProfile?.profileImageUrl ? (
          <TouchableOpacity onPress={() => router.replace("/(app)/settings")}>
        <Image
          source={{ uri: userProfile.profileImageUrl }}
          className="w-16 h-16 rounded-md"
          resizeMode="cover"
        />
      </TouchableOpacity>
      ) : (
      <TouchableOpacity  onPress={() => router.replace("/(app)/settings")}>
        <MaterialCommunityIcons name="account-circle" size={56} color="#C6F806" />
      </TouchableOpacity>
        )}
    </View>
    </View >
  );
}
