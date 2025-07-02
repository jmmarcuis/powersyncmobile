// src/types/webrtc.d.ts

import { RTCPeerConnection } from 'react-native-webrtc';
import { MediaStream } from 'react-native-webrtc';
import { RTCIceCandidate } from 'react-native-webrtc';

declare module 'react-native-webrtc' {
  interface RTCPeerConnection {
    ontrack?: ((this: RTCPeerConnection, ev: {
      track: any; streams: MediaStream[];
    }) => any) | null;
    onicecandidate?: ((this: RTCPeerConnection, ev: { candidate: RTCIceCandidate | null; }) => any) | null;
    onconnectionstatechange?: ((this: RTCPeerConnection, ev: Event) => any) | null; // Event for generic events
    oniceconnectionstatechange?: ((this: RTCPeerConnection, ev: Event) => any) | null;
  }
}

