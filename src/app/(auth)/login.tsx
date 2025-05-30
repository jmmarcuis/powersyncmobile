import { View, TextInput, Keyboard, TouchableWithoutFeedback } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Link } from "expo-router";
import { useAuth } from '@/contexts/AuthContext';
import { useState } from "react";

export default function LoginScreen() {
    const { signIn } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async () => {
        console.log("Attempting to log in...");
         const mockToken = "some-jwt-token-from-server";
        await signIn(mockToken); // Call signIn from AuthContext
        // The signIn function in AuthContext will handle the redirect to /(app).
    };

    return (
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
            <View className="flex-1 justify-center items-center p-4 bg-bgdark">
                <View className="w-full max-w-md">
                    <AppText bold className="color-white  text-2xl mb-6 text-center">
                        Login
                    </AppText>

                    <TextInput
                        className="border border-secondary  bg-secondary rounded-md p-4 mb-4 text-white placeholder:text-white"
                        placeholder="Email"
                        placeholderTextColor="white"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                    />

                    <TextInput
                        className="border border-secondary  bg-secondary rounded-md p-4 mb-6 text-white placeholder:text-white"
                        placeholder="Password"
                        placeholderTextColor="white"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />

                    <Button title="Login" onPress={handleLogin} />

                    <AppText className="mt-4 text-secondary text-center">
                        Don't have an account?{" "}
                        <Link href="/(auth)/register" className="text-primary">
                            Register
                        </Link>
                    </AppText>
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
}