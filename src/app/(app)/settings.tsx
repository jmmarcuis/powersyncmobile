import { View } from "react-native";
import { AppText } from "@/components/AppText";
import { Link } from "expo-router";

export default function SettingsScreen() {
  return (
    <View className="justify-center flex-1 p-4">
      <AppText center>
        This is the Settings Screen.
      </AppText>
      <Link href="/(app)/" className="mt-4 text-blue-500">
        Go back to Home
      </Link>
    </View>
  );
}