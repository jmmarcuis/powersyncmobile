// components/AppAlert.tsx
import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from './AppText'; // Assuming AppText is your custom text component

const { width } = Dimensions.get('window');

interface AppAlertProps {
    message: string;
    type: 'success' | 'error';
    isVisible: boolean;
    onHide: () => void; // Callback when the alert should hide
}

export const AppAlert: React.FC<AppAlertProps> = ({ message, type, isVisible, onHide }) => {
    const slideAnim = useRef(new Animated.Value(-100)).current; // Initial position above the screen

    useEffect(() => {
        if (isVisible) {
            // Animate in
            Animated.timing(slideAnim, {
                toValue: 0, // Slide down to visible position
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                // Auto-hide after 3 seconds
                setTimeout(() => {
                    Animated.timing(slideAnim, {
                        toValue: -100, // Slide back up
                        duration: 300,
                        useNativeDriver: true,
                    }).start(() => onHide()); // Call onHide after animation completes
                }, 3000);
            });
        } else {
            // Ensure it's hidden when isVisible is false, in case of immediate hide
            slideAnim.setValue(-100);
        }
    }, [isVisible, slideAnim, onHide]);

    if (!message) {
        return null; // Don't render if there's no message
    }

    const backgroundColor = type === 'success' ? 'bg-green-600' : 'bg-red-600';
    const iconName = type === 'success' ? 'check-circle' : 'close-circle';

    return (
        <Animated.View
            style={{
                transform: [{ translateY: slideAnim }],
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1000, // Ensure it's on top of other content
                width: width,
            }}
            className={`p-4 pt-12 flex-row items-center justify-center ${backgroundColor}`}
        >
            <MaterialCommunityIcons
                name={iconName}
                size={24}
                color="white"
                className="mr-2"
            />
            <AppText className="text-white text-base font-semibold text-center flex-1">
                {message}
            </AppText>
        </Animated.View>
    );
};
