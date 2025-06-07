import {
    Text,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    View,
} from "react-native"; import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Link, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useAuthentication } from "../../hooks/AuthenticationHooks";

export default function LoginScreen() {
    const router = useRouter();
    const {
        register,
        setValue,
        handleSubmit,
        onLogin,
        errors,
        loading,
    } = useAuthentication();

    useEffect(() => {
        register("email", { required: "Email is required" });
        register("password", { required: "Password is required" });
    }, [register]);

    return (
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
            <KeyboardAvoidingView
                className="flex-1 justify-center px-2 bg-bgdark"
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={80}
            >
                <View className="flex-1 justify-center items-center p-4 bg-bgdark">
                    <View className="w-full max-w-md">
                        <AppText bold className="color-white text-2xl mb-6 text-center">
                            Login
                        </AppText>

                        <View>                  
                            <TextInput
                            className="border border-secondary bg-secondary rounded-md p-4 mb-4  placeholder:text-white"
                            placeholder="Email"
                            placeholderTextColor="white"
                            keyboardType="email-address"
                            editable={!loading}
                            autoCapitalize="none"
                            autoCorrect={false}
                            onChangeText={(text) => setValue("email", text)}
                        />
                            {errors.email && (
                                <Text className="text-red-500 mt-1">{errors.email.message}</Text>
                            )}

                        </View>

                        <View>
                            <TextInput
                                className="border border-secondary bg-secondary rounded-md p-4 mb-6  placeholder:text-white"
                                placeholder="Password"
                                placeholderTextColor="white"
                                secureTextEntry
                                editable={!loading}
                                onChangeText={(text) => setValue("password", text)}

                            />
                            {errors.password && (
                                <Text className="text-red-500 mt-1 ">{errors.password.message}</Text>
                            )}
                        </View>
                        <Button title={loading ? "Logging in..." : "Login"} onPress={handleSubmit(onLogin)} disabled={loading} />


                        <AppText className="mt-4 text-secondary text-center">
                            Don't have an account?{" "}
                            <Link href="/(auth)/register" className="text-primary">
                                Register
                            </Link>
                        </AppText>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
    );
}