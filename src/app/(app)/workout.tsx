import { View, TextInput, Text, Keyboard, TouchableOpacity, TouchableWithoutFeedback } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Link, useRouter } from "expo-router";
import { useRef } from "react";

export default function WorkoutScreen() {
    const socketRef = useRef(null);

    const router = useRouter();

    const lifts = [
        { name: "Squat", key: "squat" },
        { name: "Bench Press", key: "bench" },
        { name: "Deadlift", key: "deadlift" },
    ];

    const handleSelectLift = async (liftKey) => {
        // Force cleanup of any existing connection
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        // Add slight delay to ensure cleanup completes
        await new Promise(resolve => setTimeout(resolve, 100));

        router.push({ pathname: "/vision", params: { lift: liftKey, ts: Date.now() } });
    };
    return (
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
            <View className="flex-1 justify-center items-center p-4 bg-neutral-900">
                <View className="w-full max-w-md">
                    <Text className="color-white text-2xl mb-6 text-center">
                        Choose Your Lift
                    </Text>
                    {lifts.map((lift) => (
                        <TouchableOpacity
                            key={lift.key}
                            onPress={() => handleSelectLift(lift.key)}
                            className="bg-lime-500 p-4 rounded-lg mb-4"
                        >
                            <Text className="text-black font-bold text-l text-center">{lift.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
};