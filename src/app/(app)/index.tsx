// app/(app)/index.tsx
import { View } from "react-native";
import { AppText } from "@/components/AppText";
import React from "react";   
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { useUserProfile } from "../../hooks/UserHooks";

export default function IndexScreen() {
   const { userProfile, loadingProfile } = useUserProfile();
 
  return (
    <View className="flex-1 p-6 pt-16 bg-neutral-900">
      <AppText className="text-2xl text-white">Good Morning 🔥</AppText>

      {loadingProfile ? (
        <SkeletonLoader width={160} height={30} />
      ) : (
        <AppText className="text-2xl font-bold text-white">
          {userProfile?.displayName || "User"}
        </AppText>
      )}
    </View>
  );
}
