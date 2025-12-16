import React from 'react';
import { View, Text } from 'react-native';

const ProgressBar = ({ progress = 0, showText = true }) => {
  // Giới hạn progress từ 0 đến 100
  const safeProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <View className="w-full">
      {showText && (
        <View className="flex-row justify-between mb-1.5">
          <Text className="text-xs text-gray-500 font-medium">Progress</Text>
          <Text className="text-xs text-rose-600 font-bold">{Math.round(safeProgress)}%</Text>
        </View>
      )}
      <View className="h-2 bg-gray-100 rounded-full overflow-hidden w-full">
        <View 
          className="h-full bg-rose-500 rounded-full" 
          style={{ width: `${safeProgress}%` }} 
        />
      </View>
    </View>
  );
};

export default ProgressBar;