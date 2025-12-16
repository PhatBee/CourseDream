import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CoursesScreen = () => {
  return (
    <SafeAreaView className="flex-1 justify-center items-center bg-white">
      <Text className="text-xl font-bold text-gray-800">All Courses</Text>
      <Text className="text-gray-500">Danh sách khóa học sẽ hiện ở đây</Text>
    </SafeAreaView>
  );
};
export default CoursesScreen;