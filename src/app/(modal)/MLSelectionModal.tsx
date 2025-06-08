import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { AppText } from '@/components/AppText';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Camera, CameraView } from 'expo-camera';
import * as FileSystem from 'expo-file-system';

const { width, height } = Dimensions.get('window');

// --- Configuration ---
// IMPORTANT: Replace this with your laptop's local IP address.
// The server will print this address for you when it starts.
// Example: '192.168.1.10'
const SERVER_IP = '192.168.254.121:3000'; 
const SERVER_URL = `http://${SERVER_IP}:3000/upload`;


// Define interfaces for better TypeScript support
interface Exercise {
  id: 'squat' | 'bench_press' | 'deadlift';
  name: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

interface FormType {
  id: 'correct' | 'incorrect';
  name: string;
  color: string;
}

const EXERCISES: Exercise[] = [
  { id: 'squat', name: 'Squat', icon: 'account-box' },
  { id: 'bench_press', name: 'Bench Press', icon: 'weight-lifter' },
  { id: 'deadlift', name: 'Deadlift', icon: 'dumbbell' },
];

const FORM_TYPES: FormType[] = [
  { id: 'correct', name: 'Correct Form', color: 'bg-green-500' },
  { id: 'incorrect', name: 'Incorrect Form', color: 'bg-red-500' },
];

// Props interface for the MlSelectionModal component
interface MlSelectionModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function MlSelectionModal({ visible, onClose }: MlSelectionModalProps) {
  const [step, setStep] = useState<'exercise' | 'form' | 'camera'>('exercise');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [selectedForm, setSelectedForm] = useState<FormType | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false); // New state for upload indicator
  const cameraRef = useRef<CameraView>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(status === 'granted');
    })();
  }, []);

  const resetModal = () => {
    setStep('exercise');
    setSelectedExercise(null);
    setSelectedForm(null);
    setIsRecording(false);
    setIsUploading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setStep('form');
  };

  const handleFormSelect = (form: FormType) => {
    setSelectedForm(form);
    setStep('camera');
  };

  const ensureDirectoryExists = async (dirPath: string) => {
    const dirInfo = await FileSystem.getInfoAsync(dirPath);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
    }
  };

  /**
   * Uploads the video file to the development server.
   * @param uri The local URI of the file to upload.
   * @param fileName The name to give the file on the server.
   * @param exerciseId The ID of the exercise.
   * @param formId The ID of the form type.
   */
  const uploadVideo = async (uri: string, fileName: string, exerciseId: string, formId: string) => {
    if (SERVER_IP === '192.168.254.121:3000') {
        Alert.alert(
            'Configuration Missing',
            'Please update the SERVER_IP in MLSelectionModal.js with your laptop\'s IP address.'
        );
        return;
    }

    setIsUploading(true);
    try {
      console.log(`Uploading ${fileName} to ${SERVER_URL}`);

      await FileSystem.uploadAsync(SERVER_URL, uri, {
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: 'video', // This must match upload.single('video') on the server
        parameters: {
          exercise: exerciseId,
          form: formId,
        },
      });

      console.log('Upload successful!');
      // The success alert is now handled in startRecording after upload is complete.

    } catch (error) {
      console.error('Error uploading video:', error);
      Alert.alert(
        'Upload Failed', 
        `Could not send video to the server. Please check that the server is running and the IP address is correct. Error: ${(error as Error).message}`
      );
    } finally {
      setIsUploading(false);
    }
  };


  const startRecording = async () => {
    if (cameraRef.current && !isRecording && selectedExercise && selectedForm) {
      setIsRecording(true);
      try {
        const video = await cameraRef.current.recordAsync();

        if (video) {
          // 1. Define Paths and Filename
          const datasetDir = `${FileSystem.documentDirectory}dataset`;
          const exerciseDir = `${datasetDir}/${selectedExercise.id}`;
          const formDir = `${exerciseDir}/${selectedForm.id}`;
          const timestamp = new Date().getTime();
          const fileName = `${selectedExercise.id}_${selectedForm.id}_${timestamp}.mp4`;
          const newPath = `${formDir}/${fileName}`;

          // 2. Ensure Directories Exist
          await ensureDirectoryExists(formDir);

          // 3. Move Recorded Video to Persistent Storage
          await FileSystem.moveAsync({ from: video.uri, to: newPath });
          console.log(`Video saved locally to: ${newPath}`);

          // 4. Upload the Video to the Server
          await uploadVideo(newPath, fileName, selectedExercise.id, selectedForm.id);

          // 5. Notify User and Close
          Alert.alert(
            'Success!',
            `Video saved and uploaded successfully!`,
            [{ text: 'OK', onPress: handleClose }]
          );
        }
      } catch (error) {
        console.error('Error during recording or saving:', error);
        Alert.alert('Error', 'Failed to record or save video. Please try again.');
        setIsRecording(false);
      }
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
      setIsRecording(false);
    }
  };

  // --- Render methods for each step ---
  
  const renderExerciseSelection = () => (
    <View className="flex-1 justify-center items-center p-6">
        <AppText bold className="color-white text-xl mb-6 text-center">Select Exercise Type</AppText>
        {EXERCISES.map((exercise) => (
            <TouchableOpacity key={exercise.id} className="bg-neutral-700 rounded-xl p-4 mb-4 w-full items-center" onPress={() => handleExerciseSelect(exercise)}>
                <MaterialCommunityIcons name={exercise.icon} size={32} color="white" />
                <AppText className="color-white text-lg mt-2">{exercise.name}</AppText>
            </TouchableOpacity>
        ))}
        <TouchableOpacity className="bg-red-500 rounded-xl p-3 mt-4 w-full items-center" onPress={handleClose}>
            <AppText className="color-white font-bold">Cancel</AppText>
        </TouchableOpacity>
    </View>
  );

  const renderFormSelection = () => (
    <View className="flex-1 justify-center items-center p-6">
        <AppText bold className="color-white text-xl mb-2 text-center">Selected: {selectedExercise?.name}</AppText>
        <AppText className="color-white text-sm mb-6 text-center">Choose form type to record</AppText>
        {FORM_TYPES.map((form) => (
            <TouchableOpacity key={form.id} className={`${form.color} rounded-xl p-4 mb-4 w-full items-center`} onPress={() => handleFormSelect(form)}>
                <MaterialCommunityIcons name={form.id === 'correct' ? 'check-circle' : 'close-circle'} size={32} color="white" />
                <AppText className="color-white text-lg mt-2 font-bold">{form.name}</AppText>
            </TouchableOpacity>
        ))}
        <TouchableOpacity className="bg-gray-500 rounded-xl p-3 mt-4 w-full items-center" onPress={() => setStep('exercise')}>
            <AppText className="color-white font-bold">Back</AppText>
        </TouchableOpacity>
    </View>
  );

  const renderCamera = () => {
    if (hasCameraPermission === null) return <View className="flex-1 justify-center items-center"><AppText className="color-white">Requesting camera permission...</AppText></View>;
    if (hasCameraPermission === false) return <View className="flex-1 justify-center items-center p-6"><AppText className="color-white text-center mb-4">Camera permission is required to record videos</AppText><TouchableOpacity className="bg-red-500 rounded-xl p-3 w-full items-center" onPress={handleClose}><AppText className="color-white font-bold">Close</AppText></TouchableOpacity></View>;

    return (
        <View className="flex-1">
            <CameraView ref={cameraRef} style={{ flex: 1 }} mode="video">
                <View className="flex-1 justify-between">
                    {/* Header Info */}
                    <View className="bg-black bg-opacity-50 p-4 pt-12">
                        <AppText className="color-white text-center font-bold">{selectedExercise?.name} - {selectedForm?.name}</AppText>
                        {isRecording && (
                            <View className="flex-row justify-center items-center mt-2">
                                <View className="w-3 h-3 bg-red-500 rounded-full mr-2" />
                                <AppText className="color-white">Recording...</AppText>
                            </View>
                        )}
                    </View>

                    {/* Uploading Overlay */}
                    {isUploading && (
                        <View style={{...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)'}}>
                            <ActivityIndicator size="large" color="#FFFFFF" />
                            <AppText className="color-white mt-4 font-bold">Uploading Video...</AppText>
                        </View>
                    )}

                    {/* Controls */}
                    <View className="bg-black bg-opacity-50 p-6">
                        <View className="flex-row justify-center items-center">
                            <TouchableOpacity className="bg-gray-500 rounded-full p-4 mr-6" onPress={() => setStep('form')} disabled={isRecording || isUploading}>
                                <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity className={`${isRecording ? 'bg-red-500' : 'bg-lime-500'} rounded-full p-6`} onPress={isRecording ? stopRecording : startRecording} disabled={isUploading}>
                                <MaterialCommunityIcons name={isRecording ? 'stop' : 'record'} size={32} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity className="bg-red-500 rounded-full p-4 ml-6" onPress={handleClose} disabled={isRecording || isUploading}>
                                <MaterialCommunityIcons name="close" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                        <AppText className="color-white text-center mt-4 text-sm">{isRecording ? 'Tap stop when finished' : 'Tap record to start'}</AppText>
                    </View>
                </View>
            </CameraView>
        </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={handleClose}>
        <View className="flex-1 bg-neutral-800">
            {step === 'exercise' && renderExerciseSelection()}
            {step === 'form' && renderFormSelection()}
            {step === 'camera' && renderCamera()}
        </View>
    </Modal>
  );
}

// You might need to import StyleSheet for the overlay
import { StyleSheet } from 'react-native';
