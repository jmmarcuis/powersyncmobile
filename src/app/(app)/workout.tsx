import { View, TextInput, Keyboard, TouchableWithoutFeedback } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Link, useRouter } from "expo-router";

export default function WorkoutScreen() {
    return (
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
            <View className="flex-1 justify-center items-center p-4 bg-bgdark">
                <View className="w-full max-w-md">
                    <AppText bold className="color-white text-2xl mb-6 text-center">
                        Workout History Placeholder
                    </AppText>
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
};