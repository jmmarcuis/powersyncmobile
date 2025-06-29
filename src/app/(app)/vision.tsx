import React, { useEffect, useRef, useState } from "react";
import { View, Text, Platform, StyleSheet, Button } from "react-native";
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { useFocusEffect } from '@react-navigation/native';
import { mediaDevices, RTCPeerConnection } from 'react-native-webrtc';

const styles = StyleSheet.create({
    text: {
        color: '#fff',
        fontSize: 18,
        textAlign: 'center',
        marginTop: 20,
    },
    errorText: {
        color: '#ff6b6b',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 20,
        padding: 20,
    },
    switchButton: {
        position: 'absolute',
        bottom: 40,
        alignSelf: 'center',
        zIndex: 10,
    },
});

export default function VisionScreen() {
    const [hasPermission, setHasPermission] = useState(false);
    const [position, setPosition] = useState<'back' | 'front'>('front');
    const [error, setError] = useState<string | null>(null);
    const device = useCameraDevice(position);
    const [isActive, setIsActive] = useState(false);
    const [streaming, setStreaming] = useState(false);


    useEffect(() => {
        Camera.requestCameraPermission().then((p) =>
            setHasPermission(p === 'granted')
        );
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            setIsActive(true);
            return () => setIsActive(false);
        }, [])
    );


    const switchCamera = () => {
        setPosition((prev) => (prev === 'front' ? 'back' : 'front'));
    };

    return (
        <View style={StyleSheet.absoluteFill}>
            {!hasPermission && <Text style={styles.text}>No Camera Permission.</Text>}
            {error && <Text style={styles.errorText}>Error: {error}</Text>}
            {hasPermission && device != null && isActive && (
                <Camera
                    style={StyleSheet.absoluteFill}
                    device={device}
                    isActive={true}
                    pixelFormat="rgb"
                />
            )}
            {hasPermission && (
                <View style={styles.switchButton}>
                    <Button
                        title={`Switch to ${position === 'front' ? 'Back' : 'Front'} Camera`}
                        onPress={switchCamera}
                    />
                </View>
            )}
            {hasPermission && (
                <Text style={styles.text}>
                    {streaming ? 'Streaming to server...' : 'Connecting to server...'}
                </Text>
            )}
        </View>
    );
}
