import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, ScrollView } from "react-native";
import { AppText } from "@/components/AppText";
import MlSelectionModal from "../(modal)/MLSelectionModal";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as FileSystem from 'expo-file-system';

// Define the type for a single exercise's record counts
interface ExerciseCounts {
  correct: number;
  incorrect: number;
}

// Define the type for the recordCounts state
interface RecordCounts {
  squat: ExerciseCounts;
  bench_press: ExerciseCounts;
  deadlift: ExerciseCounts;
}

export default function MachineLearnRecordScreen()  {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [recordCounts, setRecordCounts] = useState<RecordCounts>({
    squat: { correct: 0, incorrect: 0 },
    bench_press: { correct: 0, incorrect: 0 },
    deadlift: { correct: 0, incorrect: 0 },
  });

  // Count existing videos on component mount
  useEffect(() => {
    countExistingVideos();
  }, []);

  const countExistingVideos = async (): Promise<void> => {
    try {
      const datasetDir: string = `${FileSystem.documentDirectory}dataset`;
      const datasetInfo = await FileSystem.getInfoAsync(datasetDir);

      if (!datasetInfo.exists) {
        return; // No dataset folder yet
      }

      const newCounts: RecordCounts = { ...recordCounts };
      const exercises: Array<keyof RecordCounts> = ['squat', 'bench_press', 'deadlift'];
      const forms: Array<keyof ExerciseCounts> = ['correct', 'incorrect'];

      for (const exercise of exercises) {
        for (const form of forms) {
          const folderPath: string = `${datasetDir}/${exercise}/${form}`;
          const folderInfo = await FileSystem.getInfoAsync(folderPath);

          if (folderInfo.exists) {
            const files: string[] = await FileSystem.readDirectoryAsync(folderPath);
            const videoFiles: string[] = files.filter(file => file.endsWith('.mp4'));
            newCounts[exercise][form] = videoFiles.length;
          }
        }
      }

      setRecordCounts(newCounts);
    } catch (error) {
      console.error('Error counting videos:', error);
    }
  };

  const handleModalClose = (): void => {
    setModalVisible(false);
    // Refresh counts after modal closes (in case new video was recorded)
    setTimeout(() => {
      countExistingVideos();
    }, 500);
  };

  const getTotalVideos = (): number => {
    let total: number = 0;
    Object.values(recordCounts).forEach(exercise => {
      total += exercise.correct + exercise.incorrect;
    });
    return total;
  };

  const renderExerciseStats = (exerciseKey: keyof RecordCounts, exerciseName: string, icon: string) => {
    const stats: ExerciseCounts = recordCounts[exerciseKey];
    const total: number = stats.correct + stats.incorrect;

    return (
      <View key={exerciseKey} className="bg-neutral-700 rounded-xl p-4 mb-3">
        <View className="flex-row items-center mb-2">
          <MaterialCommunityIcons name={icon as any} size={24} color="white" />
          <AppText bold className="color-white text-lg ml-3">
            {exerciseName}
          </AppText>
        </View>
        <View className="flex-row justify-between">
          <View className="flex-row items-center">
            <View className="w-3 h-3 bg-green-500 rounded-full mr-2" />
            <AppText className="color-white text-sm">
              Correct: {stats.correct}
            </AppText>
          </View>
          <View className="flex-row items-center">
            <View className="w-3 h-3 bg-red-500 rounded-full mr-2" />
            <AppText className="color-white text-sm">
              Incorrect: {stats.incorrect}
            </AppText>
          </View>
          <AppText bold className="color-white text-sm">
            Total: {total}
          </AppText>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-neutral-800">
      <ScrollView className="flex-1 p-4">
        {/* Header */}
        <View className="w-full max-w-md pt-12">
          <AppText bold className="color-white text-2xl text-center">
            Machine Learning Recorder
          </AppText>
          <AppText className="color-white text-sm mb-4 text-center">
            This is where we will record your machine learning data.
          </AppText>
        </View>

        {/* Upload Button */}
        <TouchableOpacity
          className="bg-lime-500 rounded-xl p-6 mb-6 items-center"
          onPress={() => setModalVisible(true)}
        >
          <MaterialCommunityIcons name="video-plus" size={32} color="black" />
          <AppText className="text-black font-bold text-lg mt-2">
            Record New Video
          </AppText>
        </TouchableOpacity>

        {/* Record Count Summary */}
        <View className="bg-neutral-700 rounded-xl p-4 mb-6">
          <AppText bold className="color-white text-lg mb-3 text-center">
            Dataset Overview
          </AppText>
          <View className="bg-lime-500 rounded-lg p-3 mb-4">
            <AppText bold className="text-black text-center text-xl">
              Total Videos: {getTotalVideos()}
            </AppText>
          </View>
        </View>

        {/* Exercise Statistics */}
        <View className="mb-6">
          <AppText bold className="color-white text-lg mb-3">
            Exercise Breakdown
          </AppText>
          {renderExerciseStats('squat', 'Squat', 'account-box')}
          {renderExerciseStats('bench_press', 'Bench Press', 'weight-lifter')}
          {renderExerciseStats('deadlift', 'Deadlift', 'dumbbell')}
        </View>

        {/* Dataset Path Info */}
        <View className="bg-neutral-700 rounded-xl p-4 mb-6">
          <AppText bold className="color-white text-sm mb-2">
            Dataset Location:
          </AppText>
          <AppText className="color-gray-300 text-xs font-mono">
            {FileSystem.documentDirectory}dataset/
          </AppText>
        </View>
      </ScrollView>

      {/* Modal */}
      <MlSelectionModal
        visible={modalVisible}
        onClose={handleModalClose}
      />
    </View>
  );
}