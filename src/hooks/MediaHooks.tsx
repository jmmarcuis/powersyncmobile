// hooks/MediaHooks.ts
import { useState } from "react";
import { Alert } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from "../../firebaseConfig";
import { collection, addDoc, query, where, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";

export interface VideoUpload {
  id?: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  userId: string;
  createdAt: Date;
  updatedAt?: Date;
}

export const useMediaUpload = () => {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [userVideos, setUserVideos] = useState<VideoUpload[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);

  // Cloudinary configuration for videos
  const CLOUDINARY_CLOUD_NAME = 'drf4qnjow'; // Replace with your cloud name
  const CLOUDINARY_UPLOAD_PRESET = 'workout'; // Your video upload preset

  const uploadVideoToCloudinary = async (videoUri: string, title: string): Promise<{ videoUrl: string; thumbnailUrl: string; duration: number }> => {
    try {
      setUploadProgress(10);
      
      // Create FormData for video upload
      const formData = new FormData();
      formData.append('file', {
        uri: videoUri,
        type: 'video/mp4',
        name: `${title.replace(/\s+/g, '_')}_${Date.now()}.mp4`,
      } as any);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);
      formData.append('resource_type', 'video'); // Important for video uploads
      formData.append('folder', 'workout'); // Organize in workout folder
      
      setUploadProgress(30);

      // Upload video to Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setUploadProgress(70);

      const data = await response.json();
      
      if (response.ok) {
        // Cloudinary automatically generates thumbnails for videos
        const thumbnailUrl = data.secure_url.replace('/video/upload/', '/video/upload/so_0,w_400,h_300,c_fill/');
        
        return {
          videoUrl: data.secure_url,
          thumbnailUrl: thumbnailUrl,
          duration: data.duration || 0
        };
      } else {
        throw new Error(data.error?.message || 'Video upload failed');
      }
    } catch (error) {
      console.error("Error uploading video to Cloudinary:", error);
      throw new Error("Failed to upload video");
    }
  };

  const recordVideo = async (): Promise<string | null> => {
    try {
      // Request camera permissions
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const microphonePermission = await ImagePicker.requestCameraPermissionsAsync();
      
      if (cameraPermission.granted === false || microphonePermission.granted === false) {
        Alert.alert("Permission Required", "Camera and microphone permissions are required to record videos!");
        return null;
      }

      // Launch camera for video recording
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8, // Good quality for uploads
        videoMaxDuration: 300, // 5 minutes max
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0].uri;
      }

      return null;
    } catch (error) {
      console.error("Error recording video:", error);
      Alert.alert("Error", "Failed to record video");
      return null;
    }
  };

  const pickVideo = async (): Promise<string | null> => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission Required", "Permission to access media library is required!");
        return null;
      }

      // Launch video picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 300, // 5 minutes max
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0].uri;
      }

      return null;
    } catch (error) {
      console.error("Error picking video:", error);
      Alert.alert("Error", "Failed to pick video");
      return null;
    }
  };

  const uploadVideo = async (videoUri: string, title: string, description?: string) => {
    setLoading(true);
    setUploadProgress(0);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No authenticated user found");
      }

      // Upload video to Cloudinary
      const { videoUrl, thumbnailUrl, duration } = await uploadVideoToCloudinary(videoUri, title);
      
      setUploadProgress(85);

      // Save video metadata to Firestore
      const videoData: Omit<VideoUpload, 'id'> = {
        title: title.trim(),
        description: description?.trim() || '',
        videoUrl,
        thumbnailUrl,
        duration,
        userId: user.uid,
        createdAt: new Date(),
      };

      await addDoc(collection(db, 'videos'), videoData);
      
      setUploadProgress(100);
      Alert.alert("Success", "Video uploaded successfully!");
      
    } catch (error: any) {
      console.error("Video upload error:", error);
      Alert.alert("Error", error.message || "Failed to upload video");
      throw error;
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const loadUserVideos = () => {
    const user = auth.currentUser;
    if (!user) return;

    setLoadingVideos(true);

    const videosQuery = query(
      collection(db, 'videos'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(videosQuery, (snapshot) => {
      const videos: VideoUpload[] = [];
      snapshot.forEach((doc) => {
        videos.push({
          id: doc.id,
          ...doc.data()
        } as VideoUpload);
      });
      setUserVideos(videos);
      setLoadingVideos(false);
    }, (error) => {
      console.error("Error loading videos:", error);
      setLoadingVideos(false);
    });

    return unsubscribe;
  };

  const deleteVideo = async (videoId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No authenticated user found");
      }

      await deleteDoc(doc(db, 'videos', videoId));
      Alert.alert("Success", "Video deleted successfully!");
    } catch (error: any) {
      console.error("Error deleting video:", error);
      Alert.alert("Error", error.message || "Failed to delete video");
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    // Upload functions
    uploadVideo,
    recordVideo,
    pickVideo,
    
    // State
    loading,
    uploadProgress,
    
    // Video management
    userVideos,
    loadingVideos,
    loadUserVideos,
    deleteVideo,
    
    // Utilities
    formatDuration,
  };
};