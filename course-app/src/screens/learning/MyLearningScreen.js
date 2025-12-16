import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MyLearningScreen = () => {
  return (
    <SafeAreaView className="flex-1 justify-center items-center bg-white">
      <Text className="text-xl font-bold text-gray-800">My Learning</Text>
      <Text className="text-gray-500">Khóa học của tôi</Text>
    </SafeAreaView>
  );
};
export default MyLearningScreen;