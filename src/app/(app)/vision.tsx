import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { useVisionWebRTC } from '../../hooks/useVisionWebRTC';
import { useLocalSearchParams } from "expo-router";

export default function VisionScreen() {
    const {
        localStream,
        remoteStream,
        isCallStarted,
        isWebSocketConnected,
        connectionStatus,
        isPreviewing,
        countdown,
        isCountdownActive,
        handleStartPreviewAndCountdown,
        handleEndWorkout,
        setIsCountdownActive,
        setIsPreviewing,
        setLocalStream,
    } = useVisionWebRTC();
    const { lift } = useLocalSearchParams();

    const getStatusColor = () => {
        if (!isWebSocketConnected) return 'bg-red-500';
        if (connectionStatus === 'connected') return 'bg-green-500';
        if (connectionStatus === 'connecting') return 'bg-yellow-500';
        return 'bg-orange-500';
    };

    const getStatusText = () => {
        if (!isWebSocketConnected) return 'WebSocket Disconnected';
        if (connectionStatus === 'connected') return 'WebRTC Connected';
        if (connectionStatus === 'connecting') return 'WebRTC Connecting...';
        return `WebSocket Connected (${connectionStatus})`;
    };

    return (
        <View className="flex-1 bg-neutral-900">
        {/* Connection Status Banner - Modernized Style */}
        <View className={`absolute top-14 mx-4 ${getStatusColor()} p-3 rounded-lg z-20 items-center shadow-lg`}>
            <Text className="text-white font-bold">{getStatusText()}</Text>
            {typeof lift === 'string' && lift && (
                <Text className="text-white/80 text-base font-medium mt-1">
                    Selected Lift: {lift.charAt(0).toUpperCase() + lift.slice(1)}
                </Text>
            )}
        </View>

        {/* Remote Video */}
        <View style={{ flex: 1 }}>
            {remoteStream ? (
                <RTCView
                    streamURL={remoteStream.toURL()}
                    style={{ flex: 1, width: '100%', height: '100%', backgroundColor: '#171717' }}
                    objectFit={'cover'}
                    mirror={true}
                    zOrder={0}
                />
            ) : isPreviewing && localStream && !isCallStarted ? (
                <View className="flex-1 justify-center items-center">
                    <RTCView
                        streamURL={localStream.toURL()}
                        style={{ flex: 1, width: '100%', height: '100%', backgroundColor: '#171717' }}
                        objectFit={'cover'}
                        mirror={true}
                        zOrder={0}
                    />
                    {isCountdownActive && (
                        <View className="absolute inset-0 justify-center items-center bg-black/40">
                            <Text className="text-white text-7xl font-bold" >
                                {countdown}
                            </Text>
                        </View>
                    )}
                </View>
            ) : (
                <View className="flex-1 justify-center items-center">
                    <Text className="text-neutral-400 text-lg">
                        {!isCallStarted ? 'Ready to begin your workout?' : 'Connecting to video...'}
                    </Text>
                </View>
            )}
        </View>

        {/* Modernized Controls */}
        <View className="absolute bottom-10 w-full flex-row justify-center space-x-4 px-4">
            {!isCallStarted && !isPreviewing && (
                <TouchableOpacity
                    onPress={handleStartPreviewAndCountdown}
                    className={`flex-1 py-4 rounded-full ${isWebSocketConnected ? 'bg-lime-500' : 'bg-neutral-800'}`}
                    disabled={!isWebSocketConnected}
                >
                    <Text className="text-white text-center font-bold text-lg">
                        {isWebSocketConnected ? 'Start Workout' : 'Connecting...'}
                    </Text>
                </TouchableOpacity>
            )}
            {isPreviewing && !isCallStarted && (
                 <TouchableOpacity
                    onPress={() => {
                        setIsCountdownActive(false);
                        setIsPreviewing(false);
                        if (localStream) {
                            localStream.getTracks().forEach(track => track.stop());
                            setLocalStream(null);
                        }
                    }}
                    className="bg-neutral-700 py-4 px-8 rounded-full"
                >
                    <Text className="text-white font-semibold text-base">Cancel</Text>
                </TouchableOpacity>
            )}
            {isCallStarted && (
                <TouchableOpacity
                    onPress={handleEndWorkout}
                    className="bg-red-600 flex-1 py-4 rounded-full"
                >
                    <Text className="text-white text-center font-bold text-lg">End Workout</Text>
                </TouchableOpacity>
            )}
        </View>
    </View>
    );
}