// app/(modal)/change-password.tsx
import {
    View, Platform, TouchableOpacity, TextInput, TouchableWithoutFeedback,
    KeyboardAvoidingView, Keyboard, Alert
} from "react-native";
import React, { useState, useEffect } from "react";
import { AppText } from "@/components/AppText";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button } from "@/components/Button";
import { useForm, Controller } from "react-hook-form";
import { useUserProfile } from "../../hooks/UserHooks"; // Assuming this hook provides user details if needed
import { useAuthentication } from "../../hooks/AuthenticationHooks"; // Import your authentication hook
import { AppAlert } from "@/components/AppAlert"; 
import { useAppAlert } from "../../hooks/AppAlertHooks";
export default function ChangePassword() {
    const router = useRouter();
    const { loadingProfile } = useUserProfile(); // Keep if you use userProfile for anything else
    const { reauthenticateAndChangePassword, loading } = useAuthentication(); // Destructure new function and loading state

    const { alertState, showAlert, showError, hideAlert } = useAppAlert(); // Initialize the alert hook

    const [passwordRequirements, setPasswordRequirements] = useState({
        minLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false,
    });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
        setError,
        clearErrors
    } = useForm({
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmNewPassword: "",
        },
    });

    const newPassword = watch("newPassword");

    useEffect(() => {
        if (newPassword) {
            setPasswordRequirements({
                minLength: newPassword.length >= 8,
                hasUpperCase: /[A-Z]/.test(newPassword),
                hasLowerCase: /[a-z]/.test(newPassword),
                hasNumber: /[0-9]/.test(newPassword),
                hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
            });
        } else {
            setPasswordRequirements({
                minLength: false,
                hasUpperCase: false,
                hasLowerCase: false,
                hasNumber: false,
                hasSpecialChar: false,
            });
        }
    }, [newPassword]);


    const handleGoBacktoSettings = () => {
        router.replace("/(app)/settings");
    };

    const onSubmit = async (data: any) => {
        if (data.newPassword !== data.confirmNewPassword) {
            setError("confirmNewPassword", {
                type: "manual",
                message: "New password and confirm password do not match.",
            });
            showError("New password and confirm password do not match.");
            return;
        }

        // Check password requirements before attempting to change
        if (
            !passwordRequirements.minLength ||
            !passwordRequirements.hasUpperCase ||
            !passwordRequirements.hasLowerCase ||
            !passwordRequirements.hasNumber ||
            !passwordRequirements.hasSpecialChar
        ) {
            showError("Please ensure your new password meets all the security requirements.");
            return;
        }

        try {
            await reauthenticateAndChangePassword(data.currentPassword, data.newPassword);
            showAlert("Password changed successfully!"); // Show success message from the hook
            router.replace("/(app)/settings");
        } catch (error: any) {
 
            // Error handling from the hook
            console.error("Password change error:", error);
            showError(error.message || "Failed to change password. Please try again.");
        }
    };

    const PasswordRequirementItem = ({ meets, text }: { meets: boolean, text: string }) => (
        <View className="flex-row items-center my-1">
            <MaterialCommunityIcons
                name={meets ? "check-circle" : "close-circle"}
                size={18}
                color={meets ? "#C6F806" : "red"}
            />
            <AppText className={`ml-2 text-sm ${meets ? "text-white" : "text-gray-400"}`}>
                {text}
            </AppText>
        </View>
    );


    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
                className="flex-1 justify-center px-2 bg-neutral-900"
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={80}
            >
                {/* AppAlert Component rendered at the top */}
                <AppAlert
                    message={alertState.message}
                    type={alertState.type}
                    isVisible={alertState.isVisible}
                    onHide={hideAlert}
                />

                <View className="flex-1 bg-neutral-900">
                    {/* Header */}
                    <View className="flex-row items-center p-4 pt-12 bg-neutral-900">
                        <TouchableOpacity onPress={handleGoBacktoSettings} className="p-2">
                            <MaterialCommunityIcons name="arrow-left" size={24} color="#C6F806" />
                        </TouchableOpacity>
                        <View className="flex-1 items-center">
                            <AppText className="text-xl text-white font-bold ml-[-32px]">Reset Password</AppText>
                        </View>
                    </View>

                    <View className="px-4 py-8">
                        {/* Current Password Field */}
                        <AppText className="text-white text-md mb-2">Current Password</AppText>
                        <View className="relative">
                            <Controller
                                control={control}
                                name="currentPassword"
                                rules={{ required: "Current password is required" }}
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput
                                        className="w-full h-12 bg-neutral-800 text-white rounded-lg px-4 mb-2"
                                        onBlur={onBlur}
                                        onChangeText={onChange}
                                        value={value}
                                        placeholder="Enter current password"
                                        placeholderTextColor="#999"
                                        secureTextEntry={!showCurrentPassword}
                                    />
                                )}
                            />
                            <TouchableOpacity
                                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3 top-3"
                            >
                                <MaterialCommunityIcons
                                    name={showCurrentPassword ? "eye-off" : "eye"}
                                    size={20}
                                    color="#999"
                                />
                            </TouchableOpacity>
                        </View>
                        {errors.currentPassword && (
                            <AppText className="text-red-500 text-sm mb-2">
                                {errors.currentPassword.message}
                            </AppText>
                        )}

                        {/* New Password Field */}
                        <AppText className="text-white text-md mt-4 mb-2">New Password</AppText>
                        <View className="relative">
                            <Controller
                                control={control}
                                name="newPassword"
                                rules={{ required: "New password is required" }}
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput
                                        className="w-full h-12 bg-neutral-800 text-white rounded-lg px-4 mb-2"
                                        onBlur={onBlur}
                                        onChangeText={onChange}
                                        value={value}
                                        placeholder="Enter new password"
                                        placeholderTextColor="#999"
                                        secureTextEntry={!showNewPassword}
                                    />
                                )}
                            />
                            <TouchableOpacity
                                onPress={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-3"
                            >
                                <MaterialCommunityIcons
                                    name={showNewPassword ? "eye-off" : "eye"}
                                    size={20}
                                    color="#999"
                                />
                            </TouchableOpacity>
                        </View>
                        {errors.newPassword && (
                            <AppText className="text-red-500 text-sm mb-2">
                                {errors.newPassword.message}
                            </AppText>
                        )}

                        {/* Confirm New Password Field */}
                        <AppText className="text-white text-md mt-4 mb-2">Confirm New Password</AppText>
                        <View className="relative">
                            <Controller
                                control={control}
                                name="confirmNewPassword"
                                rules={{ required: "Confirm new password is required" }}
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput
                                        className="w-full h-12 bg-neutral-800 text-white rounded-lg px-4 mb-2"
                                        onBlur={onBlur}
                                        onChangeText={onChange}
                                        value={value}
                                        placeholder="Confirm new password"
                                        placeholderTextColor="#999"
                                        secureTextEntry={!showConfirmNewPassword}
                                    />
                                )}
                            />
                            <TouchableOpacity
                                onPress={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                                className="absolute right-3 top-3"
                            >
                                <MaterialCommunityIcons
                                    name={showConfirmNewPassword ? "eye-off" : "eye"}
                                    size={20}
                                    color="#999"
                                />
                            </TouchableOpacity>
                        </View>
                        {errors.confirmNewPassword && (
                            <AppText className="text-red-500 text-sm mb-2">
                                {errors.confirmNewPassword.message}
                            </AppText>
                        )}

                        {/* Password Requirements Checklist */}
                        <View className="mt-4 p-4 rounded-lg bg-neutral-800">
                            <AppText className="text-white text-md font-bold mb-2">Password must contain:</AppText>
                            <PasswordRequirementItem meets={passwordRequirements.minLength} text="At least 8 characters" />
                            <PasswordRequirementItem meets={passwordRequirements.hasUpperCase} text="An uppercase letter" />
                            <PasswordRequirementItem meets={passwordRequirements.hasLowerCase} text="A lowercase letter" />
                            <PasswordRequirementItem meets={passwordRequirements.hasNumber} text="A number" />
                            <PasswordRequirementItem meets={passwordRequirements.hasSpecialChar} text="A special character (!@#$%^&*)" />
                        </View>
                    </View>

                    <View className="px-4 mt-auto mb-8">
                        <Button
                            title={loading ? "Changing Password..." : "Change Password"}
                            onPress={handleSubmit(onSubmit)}
                            disabled={loading}
                        />
                    </View>
                </View>
            </KeyboardAvoidingView >
        </TouchableWithoutFeedback >
    );
}
