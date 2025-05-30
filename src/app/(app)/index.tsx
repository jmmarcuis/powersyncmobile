import { View } from "react-native";
import { AppText } from "@/components/AppText";
import { Link } from "expo-router";
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { Button } from "@/components/Button";



export default function IndexScreen() {
    const { signOut } = useAuth(); // Destructure signOut from your auth context

    const handleLogout = async () => {
        console.log("Logging out...");
        await signOut(); // Call the signOut function from the AuthContext
        // The signOut function in AuthContext will handle the redirect.
    };

    return (
        <View className="justify-center flex-1 p-4">
            <AppText center>
                Open up <AppText bold>app/(app)/index.tsx</AppText> to start working on your
                app!
            </AppText>
            <Link href="/(app)/settings" className="mt-4 text-blue-500">
                Go to Settings
            </Link>
            <Button title="Logout" onPress={handleLogout}  />

        </View>
    );
}