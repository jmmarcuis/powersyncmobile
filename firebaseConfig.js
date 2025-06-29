// This file is no longer needed. Use @react-native-firebase modules directly in your code.

import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
const firebaseConfig = {
    apiKey: "AIzaSyCL4g6IGGql0cj2tiYdY93c2ywt-ETst_U",
    authDomain: "reactnative-test-a8ec7.firebaseapp.com",
    projectId: "reactnative-test-a8ec7",
    storageBucket: "reactnative-test-a8ec7.firebasestorage.app",
    messagingSenderId: "750827144180",
    appId: "1:750827144180:web:605fcba07ba078059aefa1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// Initialize Auth with AsyncStorage persistence for React Native
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

export { auth, db }; // Export db