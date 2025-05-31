import { View, TextInput, Keyboard, TouchableWithoutFeedback } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { signInWithEmailAndPassword } from 'firebase/auth'; 
import { auth } from '../../../firebaseConfig'; 
 
export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    
    const handleLogin = async () => {
        setLoading(true);
        try {
            // Attempt to sign in with Firebase - pass auth instance and credentials
            await signInWithEmailAndPassword(auth, email, password);
            alert("Login successful!");
            console.log("Login successful");
            router.replace('/(app)/'); // Navigate to main app
        } catch (error: any) {
            console.error("Login failed:", error);
            let errorMessage = "Login failed. Please check your credentials and try again.";
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
            <View className="flex-1 justify-center items-center p-4 bg-bgdark">
                <View className="w-full max-w-md">
                    <AppText bold className="color-white text-2xl mb-6 text-center">
                        Login
                    </AppText>
                    
                    <TextInput
                        className="border border-secondary bg-secondary rounded-md p-4 mb-4 text-white placeholder:text-white"
                        placeholder="Email"
                        placeholderTextColor="white"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                        editable={!loading}
                        autoCapitalize="none"
                        autoCorrect={false}
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
                    
                    <Button 
                        title={loading ? "Logging in..." : "Login"} 
                        onPress={handleLogin} 
                        disabled={loading || !email.trim() || !password.trim()} 
                    />
                    
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