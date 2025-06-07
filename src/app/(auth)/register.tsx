import { useAuthentication } from "../../hooks/AuthenticationHooks";
import { View, TextInput, Keyboard, TouchableWithoutFeedback, ScrollView, Platform, KeyboardAvoidingView } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Link } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect } from "react";

export default function RegisterScreen() {
  const {
    register,
    setValue,
    handleSubmit,
    onRegister,
    loading,
    errors,
    watch,
    trigger // Import trigger to manually trigger validation
  } = useAuthentication();

  useEffect(() => {
    // Register fields with validation rules
    register("name", { required: "Full Name is required" });
    register("email", { 
      required: "Email is required",
      pattern: {
        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
        message: "Invalid email address"
      }
    });
    register("password", { 
      required: "Password is required",
      minLength: {
        value: 6,
        message: "Password must be at least 6 characters"
      }
    });
    register("confirmPassword", { 
      required: "Confirm Password is required",
      validate: (value: string) => value === watch("password") || "Passwords do not match"
    });
    register("age", { 
      required: "Age is required",
      pattern: {
        value: /^[0-9]+$/,
        message: "Age must be a number"
      },
      min: {
        value: 1,
        message: "Age must be at least 1"
      }
    });
    register("height", { 
      required: "Height is required",
      pattern: {
        value: /^[0-9]+(\.[0-9]+)?$/,
        message: "Height must be a number"
      },
      min: {
        value: 1,
        message: "Height must be at least 1 cm"
      }
    });
    register("weight", { 
      required: "Weight is required",
      pattern: {
        value: /^[0-9]+(\.[0-9]+)?$/,
        message: "Weight must be a number"
      },
      min: {
        value: 1,
        message: "Weight must be at least 1 kg"
      }
    });
  }, [register, watch]); // Add watch to dependency array for confirmPassword validation

  type FieldName = "name" | "email" | "password" | "confirmPassword" | "age" | "height" | "weight";

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === "ios" ? "padding" : "height"} // Adjust behavior based on platform
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0} // Adjust offset as needed
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }} className="bg-bgdark">
          <View className="items-center p-8">
            <View className="w-full max-w-md">
              <AppText bold className="color-white text-2xl mb-6 text-center">Register</AppText>
              {[
                { name: "name", icon: "account", placeholder: "Full Name", keyboardType: "default" },
                { name: "email", icon: "email", placeholder: "Email", keyboardType: "email-address" },
                { name: "password", icon: "lock", placeholder: "Password", secure: true },
                { name: "confirmPassword", icon: "lock-check", placeholder: "Confirm Password", secure: true },
                { name: "age", icon: "calendar", placeholder: "Age", keyboardType: "numeric" },
                { name: "height", icon: "human-male-height", placeholder: "Height (Cm)", keyboardType: "numeric" },
                { name: "weight", icon: "weight-kilogram", placeholder: "Weight (Kg)", keyboardType: "numeric" },
              ].map(({ name, icon, placeholder, secure, keyboardType }) => (
                <View key={name} className="mb-4">
                  <View className="flex-row items-center border border-secondary bg-secondary rounded-md p-4">
                    <MaterialCommunityIcons name={icon as any} size={20} color="white" />
                    <TextInput
                      className="flex-1 ml-2 text-white"
                      placeholder={placeholder}
                      placeholderTextColor="white"
                      keyboardType={keyboardType as any}
                      secureTextEntry={secure}
                      onChangeText={(text) => {
                        setValue(name as FieldName, text);
                        trigger(name as FieldName); // Trigger validation on text change
                      }}
                      onBlur={() => trigger(name as FieldName)} // Trigger validation on blur
                      value={watch(name as FieldName)} // Ensure input reflects react-hook-form's state
                    />
                  </View>
                  {errors[name as FieldName] && <AppText className="text-red-500 text-xs mt-1">{errors[name as FieldName]?.message}</AppText>}
                </View>
              ))}
              <Button title={loading ? "Registering..." : "Register"} onPress={handleSubmit(onRegister)} disabled={loading} />
              <AppText className="mt-4 text-secondary text-center">
                Already have an account?{" "}
                <Link href="/(auth)/login" className="text-primary">Login</Link>
              </AppText>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}