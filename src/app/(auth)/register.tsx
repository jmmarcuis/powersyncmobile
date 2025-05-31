import { View, TextInput, Keyboard, TouchableWithoutFeedback } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../firebaseConfig'; // Your firebase config file

export default function RegisterScreen() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        setLoading(true);
        try {
            // Use Firebase Web SDK
            await createUserWithEmailAndPassword(auth, email, password);
            alert("Registration successful!");
            router.replace('/(app)/');
        }
        catch (error) {
            console.error("Registration failed:", error);
            alert("Registration failed. Please check your credentials and try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
            <View className="flex-1 justify-center items-center p-4 bg-bgdark">
                <View className="w-full max-w-md">
                    <AppText bold className="color-white text-2xl mb-6 text-center">
                        Register
                    </AppText>
                    
                    <TextInput
                        className="border border-secondary bg-secondary rounded-md p-4 mb-4 text-white placeholder:text-white"
                        placeholder="Email"
                        placeholderTextColor="white"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                        editable={!loading}
                    />

                    <TextInput
                        className="border border-secondary bg-secondary rounded-md p-4 mb-6 text-white placeholder:text-white"
                        placeholder="Password"
                        placeholderTextColor="white"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        editable={!loading}
                    />

                    <Button title="Register" onPress={handleRegister} />

                    <AppText className="mt-4 text-secondary text-center">
                        Already have an account?{" "}
                        <Link href="/(auth)/login" className="text-primary">
                            Login
                        </Link>
                    </AppText>
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
}