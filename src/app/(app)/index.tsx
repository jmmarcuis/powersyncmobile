// app/(app)/index.tsx
import { View } from "react-native";
import { AppText } from "@/components/AppText"; // Assuming AppText is your custom text component
// import { useAuth } from '@/contexts/AuthContext'; // Uncomment if you fetch the user's name dynamically

export default function IndexScreen() {
  // const { user } = useAuth(); // Example: const userName = user?.displayName || "John Doe";
  const userName = "John Doe"; // Using placeholder name for now

  return (
    <View className="flex-1 p-6 pt-16 bg-bgdark">
      {/* Assumes bg-bgdark is a dark background class, e.g., from NativeWind */}
      <AppText className="text-2xl text-white">
        Good Morning 🔥
      </AppText>
      <AppText className="text-2xl font-bold text-white">
        {userName}
      </AppText>
    </View>
  );
}