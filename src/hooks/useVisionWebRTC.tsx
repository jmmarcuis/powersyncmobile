import { useEffect, useRef, useState } from 'react';
import { Alert, Platform, PermissionsAndroid } from 'react-native';
import {
    RTCPeerConnection,
    RTCIceCandidate,
    RTCSessionDescription,
    mediaDevices,
} from 'react-native-webrtc';
import io from 'socket.io-client';
import { useLocalSearchParams, useRouter } from "expo-router";

export function useVisionWebRTC() {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isCallStarted, setIsCallStarted] = useState(false);
    const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [countdown, setCountdown] = useState(0);
    const [isCountdownActive, setIsCountdownActive] = useState(false);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const peerConnectionRef = useRef(null);
    const socketRef = useRef(null);
    const router = useRouter();
    const isCleaningUpRef = useRef(false);
    const mountedRef = useRef(true);
    const { lift } = useLocalSearchParams();

    // WebRTC Configuration
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
            return true;
        } catch (err) {
            console.error('Error requesting permissions:', err);
            return false;
        }
    };

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
                    facingMode: 'user',
                },
            });
            if (mountedRef.current) {
                setLocalStream(stream);
            }
            return stream;
        } catch (err) {
            console.error('Error accessing media devices:', err);
            Alert.alert('Error', 'Failed to access camera and microphone');
            return null;
        }
    };

    const cleanupConnections = async () => {
        if (isCleaningUpRef.current) return;
        isCleaningUpRef.current = true;
        try {
            if (peerConnectionRef.current) {
                await peerConnectionRef.current.close();
                peerConnectionRef.current = null;
            }
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
                if (mountedRef.current) setLocalStream(null);
            }
            if (remoteStream) {
                remoteStream.getTracks().forEach(track => track.stop());
                if (mountedRef.current) setRemoteStream(null);
            }
            if (socketRef.current) {
                socketRef.current.removeAllListeners();
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            if (mountedRef.current) {
                setIsCallStarted(false);
                setConnectionStatus('disconnected');
                setIsWebSocketConnected(false);
            }
        } catch (error) {
            console.error('Error during cleanup:', error);
        } finally {
            isCleaningUpRef.current = false;
        }
    };

    const initializeSignaling = () => {
        if (socketRef.current) {
            socketRef.current.removeAllListeners();
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        socketRef.current = io('http://192.168.254.114:8000', {
            transports: ['websocket'],
            timeout: 10000,
            reconnection: false,
            forceNew: true,
            query: {
                ts: Date.now(),
                lift: lift || ''
            }
        });
        socketRef.current.on('connect', () => {
            if (mountedRef.current) {
                setIsWebSocketConnected(true);
                if (lift) {
                    socketRef.current.emit('select-lift', { lift });
                }
            }
        });
        socketRef.current.on('disconnect', () => {
            if (mountedRef.current) {
                setIsWebSocketConnected(false);
                setConnectionStatus('disconnected');
            }
        });
        socketRef.current.on('connect_error', () => {
            if (mountedRef.current) {
                setIsWebSocketConnected(false);
            }
        });
        socketRef.current.on('offer', async (data) => {
            if (!mountedRef.current) return;
            try {
                if (!peerConnectionRef.current) {
                    const stream = await initializeMedia();
                    if (stream && mountedRef.current) {
                        peerConnectionRef.current = createPeerConnection(stream);
                    } else {
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
                if (mountedRef.current) {
                    setIsCallStarted(true);
                }
            } catch (error) {
                console.error('Error handling offer:', error);
            }
        });
        socketRef.current.on('answer', async (data) => {
            if (!mountedRef.current) return;
            try {
                if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription === null) {
                    const answer = new RTCSessionDescription({
                        type: data.type,
                        sdp: data.sdp
                    });
                    await peerConnectionRef.current.setRemoteDescription(answer);
                }
            } catch (error) {
                console.error('Error handling answer:', error);
            }
        });
        socketRef.current.on('ice-candidate', async (data) => {
            if (!mountedRef.current) return;
            try {
                if (peerConnectionRef.current && data.candidate) {
                    const candidate = new RTCIceCandidate({
                        candidate: data.candidate,
                        sdpMid: data.sdpMid,
                        sdpMLineIndex: data.sdpMLineIndex
                    });
                    await peerConnectionRef.current.addIceCandidate(candidate);
                }
            } catch (error) {
                console.error('Error handling ICE candidate:', error);
            }
        });
    };

    useEffect(() => {
        mountedRef.current = true;
        const initTimer = setTimeout(() => {
            if (mountedRef.current) {
                initializeSignaling();
            }
        }, 100);
        return () => {
            mountedRef.current = false;
            clearTimeout(initTimer);
            cleanupConnections();
        };
    }, []);

    useEffect(() => {
        const connectionTimeout = setTimeout(() => {
            if (!isWebSocketConnected) {
                initializeSignaling();
            }
        }, 5000);
        return () => clearTimeout(connectionTimeout);
    }, [isWebSocketConnected]);

    const createPeerConnection = (stream) => {
        const peerConnection = new RTCPeerConnection(configuration);
        stream.getTracks().forEach(track => {
            peerConnection.addTrack(track, stream);
        });
        peerConnection.ontrack = (event) => {
            if (event.streams && event.streams[0] && mountedRef.current) {
                const stream = event.streams[0];
                if (!remoteStream || remoteStream.id !== stream.id) {
                    setRemoteStream(stream);
                }
            }
        };
        peerConnection.onicecandidate = (event) => {
            if (event.candidate && socketRef.current) {
                socketRef.current.emit('ice-candidate', {
                    candidate: event.candidate.candidate,
                    sdpMid: event.candidate.sdpMid,
                    sdpMLineIndex: event.candidate.sdpMLineIndex
                });
            }
        };
        peerConnection.onconnectionstatechange = () => {
            const state = peerConnection.connectionState;
            if (mountedRef.current) {
                setConnectionStatus(state);
            }
            switch (state) {
                case 'connected':
                    break;
                case 'disconnected':
                case 'failed':
                case 'closed':
                    if (state === 'failed' && mountedRef.current) {
                        setTimeout(() => {
                            if (isCallStarted && mountedRef.current) {
                                endCall();
                                setTimeout(() => startCall(), 1000);
                            }
                        }, 1000);
                    }
                    break;
            }
        };
        return peerConnection;
    };

    const startCall = async () => {
        if (socketRef.current && !socketRef.current.connected) {
            await cleanupConnections();
            initializeSignaling();
            return;
        }
        if (!socketRef.current || !isWebSocketConnected) {
            initializeSignaling();
            return;
        }
        if (!isWebSocketConnected) {
            Alert.alert('Error', 'WebSocket not connected. Please wait for connection.');
            return;
        }
        if (!mountedRef.current) {
            return;
        }
        try {
            if (peerConnectionRef.current) {
                await peerConnectionRef.current.close();
                peerConnectionRef.current = null;
            }
            const stream = await initializeMedia();
            if (stream && mountedRef.current) {
                peerConnectionRef.current = createPeerConnection(stream);
                const offer = await peerConnectionRef.current.createOffer({
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: true
                });
                await peerConnectionRef.current.setLocalDescription(offer);
                socketRef.current.emit('offer', {
                    type: offer.type,
                    sdp: offer.sdp
                });
                setIsCallStarted(true);
                setConnectionStatus('connecting');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to start call');
            if (mountedRef.current) {
                setIsCallStarted(false);
                setConnectionStatus('disconnected');
            }
        }
    };

    const endCall = () => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            if (mountedRef.current) setLocalStream(null);
        }
        if (remoteStream) {
            remoteStream.getTracks().forEach(track => track.stop());
            if (mountedRef.current) setRemoteStream(null);
        }
        if (mountedRef.current) {
            setIsCallStarted(false);
            setConnectionStatus('disconnected');
        }
    };

    const handleEndWorkout = async () => {
        await cleanupConnections();
        setTimeout(() => {
            if (mountedRef.current) {
                router.replace('/workout');
            }
        }, 500);
    };

    // New: Start preview and countdown before call
    const handleStartPreviewAndCountdown = async () => {
        if (!localStream) {
            const stream = await initializeMedia();
            if (stream && mountedRef.current) {
                setLocalStream(stream);
            }
        }
        setIsPreviewing(true);
        setCountdown(5);
        setIsCountdownActive(true);
    };

    // Countdown effect
    useEffect(() => {
        if (isCountdownActive && countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (isCountdownActive && countdown === 0) {
            setIsCountdownActive(false);
            setIsPreviewing(false);
            startCall();
        }
    }, [isCountdownActive, countdown]);

    return {
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
        localStreamRef: localStream,
    };
} 