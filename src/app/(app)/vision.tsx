import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, Alert, Text, Platform, PermissionsAndroid } from 'react-native';
import {
    RTCPeerConnection,
    RTCIceCandidate,
    RTCSessionDescription,
    RTCView,
    MediaStream,
    mediaDevices,
} from 'react-native-webrtc';
import io from 'socket.io-client';

export default function VisionScreen() {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isCallStarted, setIsCallStarted] = useState(false);
    const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'disconnected', 'connecting', 'connected', 'failed', 'closed'
    const peerConnectionRef = useRef(null);
    const socketRef = useRef(null);

    // WebRTC Configuration with more STUN servers for better connectivity
    const configuration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            {
                urls: 'turn:openrelay.metered.ca:80',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            }
        ]

    };

    // Request permissions using React Native APIs
    const requestPermissions = async () => {
        try {
            if (Platform.OS === 'android') {
                const cameraGranted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                    {
                        title: 'Camera Permission',
                        message: 'App needs access to your camera',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    }
                );
                const audioGranted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    {
                        title: 'Microphone Permission',
                        message: 'App needs access to your microphone',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    }
                );
                return (
                    cameraGranted === PermissionsAndroid.RESULTS.GRANTED &&
                    audioGranted === PermissionsAndroid.RESULTS.GRANTED
                );
            }
            // iOS permissions are handled automatically by getUserMedia prompt
            return true;
        } catch (err) {
            console.error('Error requesting permissions:', err);
            return false;
        }
    };

    // Initialize local media stream
    const initializeMedia = async () => {
        const hasPermissions = await requestPermissions();

        if (!hasPermissions) {
            Alert.alert('Permission Error', 'Camera and microphone permissions are required');
            return null;
        }

        try {
            const stream = await mediaDevices.getUserMedia({
                audio: false,
                video: {
                    width: 640,
                    height: 480,
                    frameRate: 30,
                    facingMode: 'user', // Use 'environment' for back camera
                },
            });
            console.log('📹 Local stream initialized');
            setLocalStream(stream);
            return stream;
        } catch (err) {
            console.error('Error accessing media devices:', err);
            Alert.alert('Error', 'Failed to access camera and microphone');
            return null;
        }
    };

    // Initialize signaling with WebSocket connection status
    const initializeSignaling = () => {
        console.log('🔌 Initializing WebSocket connection...');

        // Ensure only one socket connection is active
        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        socketRef.current = io('http://192.168.254.114:8000', {
            transports: ['websocket'],
            timeout: 10000,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        // WebSocket connection handlers
        socketRef.current.on('connect', () => {
            console.log('✅ Connected to FastAPI server!');
            setIsWebSocketConnected(true);
            // If already in a call state, try to re-establish WebRTC
            if (isCallStarted && !peerConnectionRef.current) {
                console.log('Reconnecting WebRTC after WebSocket reconnect...');
                startCall();
            }
        });

        socketRef.current.on('disconnect', (reason) => {
            console.log('❌ WebSocket disconnected:', reason);
            setIsWebSocketConnected(false);
            setConnectionStatus('disconnected');
            // Optionally, try to clean up WebRTC on WebSocket disconnect
            endCall(); // Uncomment if you want to force end call on WebSocket disconnect
        });

        socketRef.current.on('connect_error', (error) => {
            console.log('❌ WebSocket connection error:', error);
            setIsWebSocketConnected(false);
        });

        // Handle offer from server (if server initiates) - less common in client-initiated, but good to have
        socketRef.current.on('offer', async (data) => {
            console.log('📨 Received offer from server');
            try {
                if (!peerConnectionRef.current) {
                    const stream = await initializeMedia();
                    if (stream) {
                        peerConnectionRef.current = createPeerConnection(stream);
                    } else {
                        console.error('Could not get local media stream to handle offer.');
                        return;
                    }
                }

                const offer = new RTCSessionDescription({
                    type: data.type,
                    sdp: data.sdp
                });

                await peerConnectionRef.current.setRemoteDescription(offer);
                const answer = await peerConnectionRef.current.createAnswer();
                await peerConnectionRef.current.setLocalDescription(answer);

                socketRef.current.emit('answer', {
                    type: answer.type,
                    sdp: answer.sdp
                });

                console.log('✅ Answer sent to server');
                setIsCallStarted(true); // Indicate that a call has been started
            } catch (error) {
                console.error('❌ Error handling offer:', error);
            }
        });

        // Handle answer from server
        socketRef.current.on('answer', async (data) => {
            console.log('📨 Received answer from server');
            try {
                if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription === null) {
                    const answer = new RTCSessionDescription({
                        type: data.type,
                        sdp: data.sdp
                    });
                    await peerConnectionRef.current.setRemoteDescription(answer);
                    console.log('✅ Remote description set');
                } else if (peerConnectionRef.current) {
                    console.warn('Received answer but remote description already set or peer connection not ready.');
                } else {
                    console.warn('Received answer but no peer connection found.');
                }
            } catch (error) {
                console.error('❌ Error handling answer:', error);
            }
        });

        // Handle ICE candidate from server
        socketRef.current.on('ice-candidate', async (data) => {
            console.log('🧊 Received ICE candidate from server');
            try {
                if (peerConnectionRef.current && data.candidate) {
                    const candidate = new RTCIceCandidate({
                        candidate: data.candidate,
                        sdpMid: data.sdpMid,
                        sdpMLineIndex: data.sdpMLineIndex
                    });
                    await peerConnectionRef.current.addIceCandidate(candidate);
                    console.log('✅ ICE candidate added');
                } else if (!peerConnectionRef.current) {
                    console.warn('Received ICE candidate but no peer connection found.');
                }
            } catch (error) {
                console.error('❌ Error handling ICE candidate:', error);
            }
        });
    };

    useEffect(() => {
        initializeSignaling();
        return () => {
            endCall();
            socketRef.current?.disconnect();
        };
    }, []); // Empty dependency array means this runs once on component mount

    // Create and initialize RTCPeerConnection
    const createPeerConnection = (stream) => {
        console.log('🔗 Creating peer connection');
        const peerConnection = new RTCPeerConnection(configuration);

        // Add local tracks to the peer connection
        stream.getTracks().forEach(track => {
            console.log(`➕ Adding ${track.kind} track to peer connection`);
            peerConnection.addTrack(track, stream);
        });

        // Handle remote stream
        peerConnection.ontrack = (event) => {
            console.log('📹 Remote track received:', event.track.kind);
            if (event.streams && event.streams[0]) {
                const stream = event.streams[0];
                if (!remoteStream || remoteStream.id !== stream.id) {
                    setRemoteStream(stream);
                }
            }
        };

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('🧊 Sending ICE candidate to server');
                socketRef.current?.emit('ice-candidate', {
                    candidate: event.candidate.candidate,
                    sdpMid: event.candidate.sdpMid,
                    sdpMLineIndex: event.candidate.sdpMLineIndex
                });
            }
        };

        // Handle connection state changes
        peerConnection.onconnectionstatechange = () => {
            const state = peerConnection.connectionState;
            console.log('🔗 WebRTC Connection state changed:', state);
            setConnectionStatus(state);

            switch (state) {
                case 'connected':
                    console.log('✅ WebRTC connection established!');
                    break;
                case 'disconnected':
                case 'failed':
                case 'closed':
                    console.log('❌ WebRTC connection lost or closed');
                    if (state === 'failed') {
                        // Attempt to restart the connection if it failed
                        console.log('Attempting to restart WebRTC connection after failure...');
                        if (isCallStarted) { // Only attempt if a call was initiated
                            endCall(); // Clean up current connection
                            startCall(); // Try to start a new one
                        }
                    } else if (state === 'closed') {
                        // Clean up when connection is explicitly closed
                        endCall();
                    }
                    break;
            }
        };

        // Handle ICE connection state changes
        peerConnection.oniceconnectionstatechange = () => {
            console.log('🧊 ICE connection state:', peerConnection.iceConnectionState);
        };

        return peerConnection;
    };

    // Start call function
    const startCall = async () => {
        console.log('📞 Starting call...');
        if (!isWebSocketConnected) {
            Alert.alert('Error', 'WebSocket not connected. Please wait for connection.');
            return;
        }

        try {
            // Ensure no lingering peer connection
            if (peerConnectionRef.current) {
                await peerConnectionRef.current.close();
                peerConnectionRef.current = null;
            }

            const stream = await initializeMedia();
            if (stream) {
                peerConnectionRef.current = createPeerConnection(stream);
                const offer = await peerConnectionRef.current.createOffer({
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: true
                });
                await peerConnectionRef.current.setLocalDescription(offer);

                console.log('📨 Sending offer to server');
                socketRef.current.emit('offer', {
                    type: offer.type,
                    sdp: offer.sdp
                });

                setIsCallStarted(true);
                setConnectionStatus('connecting'); // Set status to connecting
            } else {
                console.error('Failed to get local stream, cannot start call.');
                setIsCallStarted(false);
                setConnectionStatus('disconnected');
            }
        } catch (error) {
            console.error('❌ Error starting call:', error);
            Alert.alert('Error', 'Failed to start call');
            setIsCallStarted(false);
            setConnectionStatus('disconnected');
        }
    };

    // End call function
    const endCall = () => {
        console.log('📞 Ending call...');

        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        if (localStream) {
            localStream.getTracks().forEach(track => {
                track.stop();
                console.log(`🛑 Stopped ${track.kind} track`);
            });
            setLocalStream(null);
        }

        if (remoteStream) {
            remoteStream.getTracks().forEach(track => {
                track.stop(); // Ensure remote tracks are also stopped
                console.log(`🛑 Stopped remote ${track.kind} track`);
            });
            setRemoteStream(null);
        }

        setIsCallStarted(false);
        setConnectionStatus('disconnected');
        console.log('Call ended. State reset.');
    };

    const getStatusColor = () => {
        if (!isWebSocketConnected) return 'bg-red-500';
        if (connectionStatus === 'connected') return 'bg-green-500';
        if (connectionStatus === 'connecting') return 'bg-yellow-500';
        return 'bg-orange-500'; // For states like 'disconnected' but WebSocket is connected
    };

    const getStatusText = () => {
        if (!isWebSocketConnected) return 'WebSocket Disconnected';
        if (connectionStatus === 'connected') return 'WebRTC Connected';
        if (connectionStatus === 'connecting') return 'WebRTC Connecting...';
        return `WebSocket Connected (${connectionStatus})`;
    };

    return (
        <View className="flex-1 bg-gray-900">
            {/* Connection Status Banner */}
            <View className={`absolute top-12 left-0 right-0 ${getStatusColor()} p-2 z-20 items-center`}>
                <Text className="text-white font-bold">{getStatusText()}</Text>
            </View>

            {/* Remote Video (Full Screen) - IMPROVED */}
            <View style={{ flex: 1 }}>
                {remoteStream && (
                    <RTCView
                        streamURL={remoteStream.toURL()}
                        style={{
                            flex: 1,
                            width: '100%',
                            height: '100%',
                            backgroundColor: 'black' // Prevent white flashes
                        }}
                        objectFit={'cover'}
                        mirror={false}
                        zOrder={0}
                    />
                )}
                {/* Show loading indicator when no remote stream */}
                {!remoteStream && isCallStarted && (
                    <View className="flex-1 justify-center items-center">
                        <Text className="text-white text-lg">Connecting to video...</Text>
                    </View>
                )}
            </View>

            {/* Controls */}
            <View className="absolute bottom-8 w-full flex-row justify-center space-x-4">
                {!isCallStarted ? (
                    <TouchableOpacity
                        onPress={startCall}
                        className={`p-4 rounded-full ${isWebSocketConnected ? 'bg-green-500' : 'bg-gray-500'}`}
                        disabled={!isWebSocketConnected}
                    >
                        <Text className="text-white font-semibold px-4">
                            {isWebSocketConnected ? 'Start Call' : 'Connecting...'}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        onPress={endCall}
                        className="bg-red-500 p-4 rounded-full"
                    >
                        <Text className="text-white font-semibold px-4">End Call</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};