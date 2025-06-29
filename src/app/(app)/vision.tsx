// @ts-nocheck
import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View, Text, Button } from "react-native";
// @ts-ignore – vision-camera types may be missing in bare Expo projects
import { Camera, useCameraDevice } from "react-native-vision-camera";
import { useFocusEffect } from "@react-navigation/native";

// WebRTC imports
import {
  mediaDevices,
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
} from "react-native-webrtc";

// -----------------------------------------------------------------------------
// Replace with the LAN IP / hostname where the FastAPI backend is running
// -----------------------------------------------------------------------------
const SIGNALING_SERVER_URL = "ws://YOUR_SERVER_IP:8000/ws";

export default function VisionScreen() {
  const [hasPermission, setHasPermission] = useState(false);
  const [position, setPosition] = useState<"front" | "back">("front");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const device = useCameraDevice(position);
  const [isActive, setIsActive] = useState(false);

  // Keep refs so we can close them during cleanup
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // ---------------------------------------------------------------------------
  // Ask for camera permission at mount time
  // ---------------------------------------------------------------------------
  useEffect(() => {
    Camera.requestCameraPermission().then((status: any) => {
      setHasPermission(status === "granted");
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Track navigation focus so we only run WebRTC logic when the screen is on top
  // ---------------------------------------------------------------------------
  useFocusEffect(
    useCallback(() => {
      setIsActive(true);
      return () => setIsActive(false);
    }, [])
  );

  // ---------------------------------------------------------------------------
  // Main effect that establishes the signalling socket + WebRTC peer connection
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!hasPermission || !isActive) return;

    let cancelled = false;
    setStreaming(false);
    setError(null);

    // 1) Open signalling WebSocket
    const ws = new WebSocket(SIGNALING_SERVER_URL);
    wsRef.current = ws;

    // 2) Create RTCPeerConnection
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    pcRef.current = pc;

    // 3) Handle ICE candidates – send to server
    pc.onicecandidate = (ev: any) => {
      if (ev.candidate) {
        ws.send(
          JSON.stringify({
            type: "candidate",
            candidate: {
              sdpMid: ev.candidate.sdpMid,
              sdpMLineIndex: ev.candidate.sdpMLineIndex,
              candidate: ev.candidate.candidate,
            },
          })
        );
      }
    };

    // 4) Setup WebSocket event handlers
    ws.onmessage = async (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === "answer") {
          const remoteDesc = new RTCSessionDescription(msg);
          await pc.setRemoteDescription(remoteDesc);
          setStreaming(true);
        } else if (msg.type === "candidate") {
          const c = msg.candidate;
          await pc.addIceCandidate(
            new RTCIceCandidate({
              sdpMid: c.sdpMid,
              sdpMLineIndex: c.sdpMLineIndex,
              candidate: c.candidate,
            })
          );
        }
      } catch (e) {
        console.error("Signalling error", e);
        setError(`Signalling error: ${e}`);
      }
    };

    ws.onerror = () => setError("WebSocket error");
    ws.onclose = () => setStreaming(false);

    // 5) Grab camera stream and add tracks to peer connection once WS is open
    const startStreaming = async () => {
      try {
        const localStream = await mediaDevices.getUserMedia({
          video: {
            facingMode: position,
            frameRate: 30,
          },
          audio: false,
        });
        if (cancelled) return;

        localStreamRef.current = localStream;
        localStream.getTracks().forEach((t: any) => pc.addTrack(t, localStream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        ws.send(
          JSON.stringify({
            type: "offer",
            sdp: offer.sdp,
          })
        );
      } catch (e) {
        console.error("Camera/WebRTC error", e);
        setError(`Camera/WebRTC error: ${e}`);
      }
    };

    ws.onopen = startStreaming;

    // -----------------------------------------------------------------------
    // Cleanup when component unmounts / loses focus
    // -----------------------------------------------------------------------
    return () => {
      cancelled = true;
      ws.close();
      pc.close();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      wsRef.current = null;
      pcRef.current = null;
      localStreamRef.current = null;
    };
  }, [hasPermission, isActive, position]);

  const switchCamera = () => {
    setPosition((prev) => (prev === "front" ? "back" : "front"));
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <View style={styles.container}>
      {hasPermission && device && (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isActive}
          pixelFormat="rgb"
        />
      )}
      {!hasPermission && (
        <Text style={styles.text}>Camera permission is required.</Text>
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
      {hasPermission && (
        <View style={styles.switchButton}>
          <Button
            title={`Switch to ${position === "front" ? "Back" : "Front"} Camera`}
            onPress={switchCamera}
          />
        </View>
      )}
      {hasPermission && (
        <Text style={styles.text}>
          {streaming ? "Streaming to server…" : "Connecting…"}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  text: {
    color: "#fff",
    textAlign: "center",
    marginTop: 10,
  },
  errorText: {
    color: "#ff6b6b",
    textAlign: "center",
    marginTop: 10,
    padding: 10,
  },
  switchButton: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    zIndex: 10,
  },
});