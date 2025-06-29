// hooks/AuthenticationHooks.ts (or wherever your hook is located)
import { useForm } from "react-hook-form";
import { useState } from "react";
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Alert } from "react-native";

export const useAuthentication = () => {
  const [loading, setLoading] = useState(false);

  const {
    register,
    setValue,
    handleSubmit,
    watch,
    formState: { errors },
    trigger,
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      age: "",
      height: "",
      weight: "",
    },
  });

  const onLogin = async (data: any) => {
    setLoading(true);
    try {
      await auth().signInWithEmailAndPassword(data.email, data.password);
      // Success: The onAuthStateChanged listener in AuthProvider will detect this
      // and your root layout will handle navigation based on the updated state.
    } catch (err: any) {
      console.error("Login error:", err); // Use a more descriptive log
      if (err.code === "auth/user-not-found") {
        Alert.alert("Error", "User not found. Please check your email or register.");
      } else if (err.code === "auth/wrong-password") {
        Alert.alert("Error", "Incorrect password. Please try again.");
      } else if (err.code === "auth/invalid-credential") {
        Alert.alert("Error", "Invalid credentials. Please check your email and password.");
      } else {
        Alert.alert("Login Error", err.message || "An unexpected error occurred during login.");
      }
      throw err; // Re-throw to allow component to handle if needed
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (data: any) => {
    setLoading(true);
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(data.email, data.password);
      const user = userCredential.user;

      await user.updateProfile({ displayName: data.name });

      await firestore().collection('users').doc(user.uid).set({
        uid: user.uid,
        email: data.email,
        displayName: data.name,
        height: parseFloat(data.height),
        weight: parseFloat(data.weight),
        age: parseInt(data.age),
        createdAt: new Date(),
      });

      Alert.alert("Success", "Account created successfully!");
      // Success: The onAuthStateChanged listener in AuthProvider will detect this
      // and your root layout will handle navigation based on the updated state.
    } catch (err: any) {
      console.error("Registration error:", err); // Use a more descriptive log
      if (err.code === "auth/email-already-in-use") {
        Alert.alert("Error", "This email is already in use. Please try logging in or use a different email.");
      } else if (err.code === "auth/invalid-email") {
        Alert.alert("Error", "The email address is not valid.");
      } else if (err.code === "auth/weak-password") {
        Alert.alert("Error", "The password is too weak. Please choose a stronger password (at least 6 characters).");
      } else {
        Alert.alert("Registration Error", err.message || "An unexpected error occurred during registration.");
      }
      throw err; // Re-throw to allow component to handle if needed
    } finally {
      setLoading(false);
    }
  };

  const reauthenticateAndChangePassword = async (currentPassword: string, newPassword: string) => {
    setLoading(true);
    const user = auth().currentUser;

    if (!user || !user.email) {
      setLoading(false);
      throw new Error("No authenticated user found or user email is missing.");
    }

    try {
      // 1. Re-authenticate the user
      const credential = auth.EmailAuthProvider.credential(user.email, currentPassword);
      await user.reauthenticateWithCredential(credential);

      // 2. Update the password
      await user.updatePassword(newPassword);
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      console.error("Error reauthenticating or changing password:", error);
      if (error.code === "auth/wrong-password") {
        throw new Error("The current password you entered is incorrect.");
      } else if (error.code === "auth/too-many-requests") {
        throw new Error("Too many failed attempts. Please try again later.");
      } else if (error.code === "auth/requires-recent-login") {
        throw new Error("This operation is sensitive and requires recent authentication. Please log in again.");
      } else {
        throw new Error(error.message || "An unexpected error occurred during password change.");
      }
    }
  };

  return {
    register,
    setValue,
    handleSubmit,
    onRegister,
    onLogin,
    loading,
    errors,
    watch,
    trigger,
    reauthenticateAndChangePassword
  };
};