import { View, TextInput, Keyboard, TouchableWithoutFeedback } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Link, useRouter } from "expo-router";

export default function RegisterScreen() {
    const router = useRouter();

    const handleRegister = () => {
        // In a real app, you'd perform registration logic here.
        // After successful registration, you might want to automatically log them in
        // or navigate them to the login screen.
        console.log("Attempting to register...");
        router.replace('/(app)/'); // For now, simulate success and go to main app
    };

    return (
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>

            <View className="flex-1 justify-center items-center p-4 bg-bgdark">
                <AppText bold className="color-white  text-2xl mb-6 text-center">
                    Register
                </AppText>                
                <AppText>
                    This is the Registration Screen.
                </AppText>

                <Button title="Simulate Registration (and go to app)" onPress={handleRegister} />

                <AppText className="mt-4 text-secondary text-center">
                    Already have an account?{" "}
                    <Link href="/(auth)/login" className="text-primary">
                        Login
                    </Link>
                </AppText>
            </View>
        </TouchableWithoutFeedback>

    );
}