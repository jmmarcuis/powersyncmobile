// app/(modal)/edit-profile.tsx
import {
    View, Platform, TouchableOpacity, TextInput, TouchableWithoutFeedback, 
    KeyboardAvoidingView, Keyboard, Image, Alert, ActionSheetIOS
} from "react-native";
import React, { useState, useEffect } from "react";
import { AppText } from "@/components/AppText";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button } from "@/components/Button";
import { useForm, Controller } from "react-hook-form";
import { useUserProfile } from "../../hooks/UserHooks";
import { useProfileUpdate, UpdateProfileData } from "../../hooks/ProfileHooks";
import { SkeletonLoader } from "@/components/SkeletonLoader";

export default function EditProfileScreen() {
    const router = useRouter();
    const { userProfile, loadingProfile } = useUserProfile();
    const { updateUserProfile, pickImage, takePhoto, loading, uploadProgress } = useProfileUpdate();
    const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

    const {
        control,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<UpdateProfileData>({
        defaultValues: {
            displayName: "",
            age: "",
            height: "",
            weight: "",
        },
    });

    // Populate form with current user data
    useEffect(() => {
        if (userProfile) {
            setValue("displayName", userProfile.displayName || "");
            setValue("age", userProfile.age?.toString() || "");
            setValue("height", userProfile.height?.toString() || "");
            setValue("weight", userProfile.weight?.toString() || "");
        }
    }, [userProfile, setValue]);

    const handleGoBacktoSettings = () => {
        router.replace("/(app)/settings");
    };

    const showImagePicker = () => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['Cancel', 'Take Photo', 'Choose from Library'],
                    cancelButtonIndex: 0,
                },
                async (buttonIndex) => {
                    if (buttonIndex === 1) {
                        const uri = await takePhoto();
                        if (uri) setSelectedImageUri(uri);
                    } else if (buttonIndex === 2) {
                        const uri = await pickImage();
                        if (uri) setSelectedImageUri(uri);
                    }
                }
            );
        } else {
            Alert.alert(
                "Select Image",
                "Choose an option",
                [
                    { text: "Cancel", style: "cancel" },
                    { 
                        text: "Take Photo", 
                        onPress: async () => {
                            const uri = await takePhoto();
                            if (uri) setSelectedImageUri(uri);
                        }
                    },
                    { 
                        text: "Choose from Library", 
                        onPress: async () => {
                            const uri = await pickImage();
                            if (uri) setSelectedImageUri(uri);
                        }
                    },
                ]
            );
        }
    };

    const onSubmit = async (data: UpdateProfileData) => {
        try {
            await updateUserProfile(data, selectedImageUri || undefined);
            router.replace("/(app)/settings");
        } catch (error) {
            // Error is already handled in the hook
        }
    };

    const getCurrentProfileImage = () => {
        if (selectedImageUri) return selectedImageUri;
        if (userProfile?.profileImageUrl) return userProfile.profileImageUrl;
        return null;
    };

    if (loadingProfile) {
        return (
            <View className="flex-1 bg-neutral-900 justify-center items-center">
                <SkeletonLoader width={200} height={200} />
                <AppText className="text-white mt-4">Loading profile...</AppText>
            </View>
        );
    }

    return (
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
            <KeyboardAvoidingView
                className="flex-1 justify-center px-2 bg-neutral-900"
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={80}
            >
                <View className="flex-1 bg-neutral-900">
                    {/* Header */}
                    <View className="flex-row items-center p-4 pt-12 bg-neutral-900">
                        <TouchableOpacity onPress={handleGoBacktoSettings} className="p-2">
                            <MaterialCommunityIcons name="arrow-left" size={24} color="#C6F806" />
                        </TouchableOpacity>
                        <View className="flex-1 items-center">
                            <AppText className="text-xl text-white font-bold ml-[-32px]">Edit Profile</AppText>
                        </View>
                    </View>

                    <View className="w-full max-w-md px-4 py-6 mx-auto">
                        {/* Profile Image Section */}
                        <View className="items-center mb-6">
                            <TouchableOpacity onPress={showImagePicker} className="relative">
                                <View className="w-28 h-28 bg-neutral-700 rounded-full items-center justify-center">
                                    {getCurrentProfileImage() ? (
                                        <Image
                                            source={{ uri: getCurrentProfileImage()! }}
                                            className="w-28 h-28 rounded-full"
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <MaterialCommunityIcons name="account-circle" size={56} color="#C6F806" />
                                    )}
                                </View>
                                <View className="absolute bottom-0 right-0 bg-lime-500 rounded-full p-2">
                                    <MaterialCommunityIcons name="camera" size={16} color="black" />
                                </View>
                            </TouchableOpacity>
                            <AppText className="text-neutral-400 mt-2 text-center">
                                Tap to change profile picture
                            </AppText>
                        </View>

                        {/* Form Fields */}
                        {[
                            { name: "displayName", icon: "account", placeholder: "Full Name", keyboardType: "default" },
                            { name: "age", icon: "calendar", placeholder: "Age", keyboardType: "numeric" },
                            { name: "height", icon: "human-male-height", placeholder: "Height (Cm)", keyboardType: "numeric" },
                            { name: "weight", icon: "weight-kilogram", placeholder: "Weight (Kg)", keyboardType: "numeric" },
                        ].map(({ name, icon, placeholder, keyboardType }) => (
                            <View key={name} className="mb-4">
                                <Controller
                                    control={control}
                                    name={name as keyof UpdateProfileData}
                                    rules={{
                                        required: `${placeholder} is required`,
                                        ...(keyboardType === "numeric" && {
                                            pattern: {
                                                value: /^\d+(\.\d+)?$/,
                                                message: `${placeholder} must be a valid number`
                                            }
                                        })
                                    }}
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <View className="flex-row items-center border border-secondary bg-secondary rounded-md p-4">
                                            <MaterialCommunityIcons name={icon as any} size={20} color="white" />
                                            <TextInput
                                                className="flex-1 ml-2 text-white"
                                                placeholder={placeholder}
                                                placeholderTextColor="white"
                                                keyboardType={keyboardType as any}
                                                onBlur={onBlur}
                                                onChangeText={onChange}
                                                value={value}
                                            />
                                        </View>
                                    )}
                                />
                                {errors[name as keyof UpdateProfileData] && (
                                    <AppText className="text-red-500 text-sm mt-1 ml-2">
                                        {errors[name as keyof UpdateProfileData]?.message}
                                    </AppText>
                                )}
                            </View>
                        ))}

                        {/* Upload Progress */}
                        {loading && uploadProgress > 0 && (
                            <View className="mb-4">
                                <AppText className="text-white text-center mb-2">
                                    Updating profile... {uploadProgress}%
                                </AppText>
                                <View className="bg-neutral-700 h-2 rounded-full">
                                    <View 
                                        className="bg-lime-500 h-2 rounded-full" 
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </View>
                            </View>
                        )}

                        <Button 
                            title={loading ? "Updating..." : "Update"} 
                            onPress={handleSubmit(onSubmit)}
                            disabled={loading}
                        />
                    </View>
                </View>
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
    );
}