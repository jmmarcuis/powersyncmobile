// app/(app)/create.tsx
import { 
  View, 
  TextInput, 
  Keyboard, 
  TouchableWithoutFeedback, 
  TouchableOpacity, 
  ScrollView,
  Image,
  Alert,
  ActionSheetIOS,
  Platform
} from "react-native";
import React, { useState, useEffect } from "react";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMediaUpload } from "../../hooks/MediaHooks";
import { useForm, Controller } from "react-hook-form";

interface VideoUploadForm {
  title: string;
  description: string;
}

export default function CreateScreen() {
  const { 
    uploadVideo, 
    recordVideo, 
    pickVideo, 
    loading, 
    uploadProgress,
    userVideos,
    loadingVideos,
    loadUserVideos,
    deleteVideo,
    formatDuration
  } = useMediaUpload();

  const [selectedVideoUri, setSelectedVideoUri] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VideoUploadForm>({
    defaultValues: {
      title: "",
      description: "",
    },
  });

  // Load user videos when component mounts
  useEffect(() => {
    const unsubscribe = loadUserVideos();
    return () => unsubscribe && unsubscribe();
  }, []);

  const showVideoSourceSelector = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Record Video', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            const uri = await recordVideo();
            if (uri) {
              setSelectedVideoUri(uri);
              setShowUploadForm(true);
            }
          } else if (buttonIndex === 2) {
            const uri = await pickVideo();
            if (uri) {
              setSelectedVideoUri(uri);
              setShowUploadForm(true);
            }
          }
        }
      );
    } else {
      Alert.alert(
        "Select Video",
        "Choose an option",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Record Video", 
            onPress: async () => {
              const uri = await recordVideo();
              if (uri) {
                setSelectedVideoUri(uri);
                setShowUploadForm(true);
              }
            }
          },
          { 
            text: "Choose from Library", 
            onPress: async () => {
              const uri = await pickVideo();
              if (uri) {
                setSelectedVideoUri(uri);
                setShowUploadForm(true);
              }
            }
          },
        ]
      );
    }
  };

  const onSubmit = async (data: VideoUploadForm) => {
    if (!selectedVideoUri) {
      Alert.alert("Error", "No video selected");
      return;
    }

    try {
      await uploadVideo(selectedVideoUri, data.title, data.description);
      // Reset form and states
      reset();
      setSelectedVideoUri(null);
      setShowUploadForm(false);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const cancelUpload = () => {
    setSelectedVideoUri(null);
    setShowUploadForm(false);
    reset();
  };

  const handleDeleteVideo = (videoId: string, title: string) => {
    Alert.alert(
      "Delete Video",
      `Are you sure you want to delete "${title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => deleteVideo(videoId)
        },
      ]
    );
  };

  if (showUploadForm) {
    return (
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View className="flex-1 bg-neutral-900 p-4">
          {/* Header */}
          <View className="flex-row items-center justify-between pt-12 pb-6">
            <TouchableOpacity onPress={cancelUpload}>
              <MaterialCommunityIcons name="close" size={24} color="#C6F806" />
            </TouchableOpacity>
            <AppText className="text-xl text-white font-bold">Upload Video</AppText>
            <View style={{ width: 24 }} /> {/* Spacer */}
          </View>

          <ScrollView className="flex-1">
            {/* Video Preview */}
            {selectedVideoUri && (
              <View className="bg-neutral-800 rounded-xl p-4 mb-6">
                <View className="bg-neutral-700 rounded-lg h-48 items-center justify-center">
                  <MaterialCommunityIcons name="play-circle" size={64} color="#C6F806" />
                  <AppText className="text-white mt-2">Video Selected</AppText>
                </View>
              </View>
            )}

            {/* Form */}
            <View className="space-y-4">
              <View>
                <AppText className="text-white mb-2 font-semibold">Title *</AppText>
                <Controller
                  control={control}
                  name="title"
                  rules={{
                    required: "Title is required",
                    minLength: {
                      value: 3,
                      message: "Title must be at least 3 characters"
                    }
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className="bg-neutral-800 text-white p-4 rounded-lg"
                      placeholder="Enter video title"
                      placeholderTextColor="#9CA3AF"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      maxLength={100}
                    />
                  )}
                />
                {errors.title && (
                  <AppText className="text-red-500 text-sm mt-1">
                    {errors.title.message}
                  </AppText>
                )}
              </View>

              <View>
                <AppText className="text-white mb-2 font-semibold">Description</AppText>
                <Controller
                  control={control}
                  name="description"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className="bg-neutral-800 text-white p-4 rounded-lg"
                      placeholder="Enter video description (optional)"
                      placeholderTextColor="#9CA3AF"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      multiline
                      numberOfLines={3}
                      maxLength={500}
                      textAlignVertical="top"
                    />
                  )}
                />
              </View>

              {/* Upload Progress */}
              {loading && uploadProgress > 0 && (
                <View className="mt-4">
                  <AppText className="text-white text-center mb-2">
                    Uploading... {uploadProgress}%
                  </AppText>
                  <View className="bg-neutral-700 h-3 rounded-full">
                    <View 
                      className="bg-lime-500 h-3 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </View>
                </View>
              )}

              {/* Upload Button */}
              <Button 
                title={loading ? "Uploading..." : "Upload Video"} 
                onPress={handleSubmit(onSubmit)}
                disabled={loading}
              />
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View className="flex-1 bg-neutral-900">
        <ScrollView className="flex-1 p-4">
          {/* Header */}
          <View className="pt-12 pb-6">
            <AppText className="text-2xl text-white font-bold text-center mb-2">
              My Videos
            </AppText>
            <AppText className="text-neutral-400 text-center">
              Upload and manage your workout videos
            </AppText>
          </View>

          {/* Upload Button */}
          <TouchableOpacity
            onPress={showVideoSourceSelector}
            className="bg-lime-500 rounded-xl p-6 mb-6 items-center"
          >
            <MaterialCommunityIcons name="video-plus" size={32} color="black" />
            <AppText className="text-black font-bold text-lg mt-2">
              Upload New Video
            </AppText>
          </TouchableOpacity>

          {/* Videos List */}
          {loadingVideos ? (
            <View className="items-center py-8">
              <AppText className="text-neutral-400">Loading videos...</AppText>
            </View>
          ) : userVideos.length === 0 ? (
            <View className="items-center py-8">
              <MaterialCommunityIcons name="video-off" size={64} color="#6B7280" />
              <AppText className="text-neutral-400 mt-4 text-center">
                No videos uploaded yet{'\n'}Tap the button above to get started!
              </AppText>
            </View>
          ) : (
            <View className="space-y-4">
              {userVideos.map((video) => (
                <View key={video.id} className="bg-neutral-800 rounded-xl p-4">
                  <View className="flex-row">
                    {/* Thumbnail */}
                    <View className="w-24 h-24 bg-neutral-700 rounded-lg mr-4 items-center justify-center">
                      {video.thumbnailUrl ? (
                        <Image
                          source={{ uri: video.thumbnailUrl }}
                          className="w-24 h-24 rounded-lg"
                          resizeMode="cover"
                        />
                      ) : (
                        <MaterialCommunityIcons name="play-circle" size={32} color="#C6F806" />
                      )}
                    </View>

                    {/* Video Info */}
                    <View className="flex-1">
                      <AppText className="text-white font-semibold text-lg" >
                        {video.title}
                      </AppText>
                      {video.description && (
                        <AppText className="text-neutral-400 mt-1" >
                          {video.description}
                        </AppText>
                      )}
                      <View className="flex-row items-center mt-2">
                        <MaterialCommunityIcons name="clock-outline" size={16} color="#9CA3AF" />
                        <AppText className="text-neutral-400 ml-1">
                          {formatDuration(video.duration || 0)}
                        </AppText>
                      </View>
                    </View>

                    {/* Actions */}
                    <TouchableOpacity
                      onPress={() => handleDeleteVideo(video.id!, video.title)}
                      className="p-2"
                    >
                      <MaterialCommunityIcons name="delete" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}