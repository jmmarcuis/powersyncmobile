// components/SkeletonLoader.tsx
import React from "react";
import { View } from "react-native";
import { MotiView } from "moti";

export const SkeletonLoader = ({ width = 120, height = 24, borderRadius = 6 }) => {
  return (
    <MotiView
      from={{ opacity: 0.3 }}
      animate={{ opacity: 1 }}
      transition={{
        loop: true,
        type: "timing",
        duration: 800,
      }}
      style={{
        width,
        height,
        backgroundColor: "#444",
        borderRadius,
      }}
    />
  );
};
