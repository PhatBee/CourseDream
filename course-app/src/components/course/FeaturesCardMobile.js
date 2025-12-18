import React from 'react';
import { View, Text } from 'react-native';
import { Users, Clock, Layers, PlayCircle, BarChart2 } from 'lucide-react-native';

const FeaturesCardMobile = ({ course }) => {
  const { studentsCount = 0, totalHours = 0, sections = [], totalLectures = 0, level = 'beginner' } = course;
  const features = [
    { icon: <Users size={18} />, text: `Enrolled: ${studentsCount} students` },
    { icon: <Clock size={18} />, text: `Duration: ${totalHours.toFixed(1)} hours` },
    { icon: <Layers size={18} />, text: `Chapters: ${sections.length}` },
    { icon: <PlayCircle size={18} />, text: `Video: ${totalLectures} lectures` },
    { icon: <BarChart2 size={18} />, text: `Level: ${level.charAt(0).toUpperCase() + level.slice(1)}` },
  ];
  return (
    <View className="bg-white rounded-lg border border-gray-200 mb-4 p-4">
      <Text className="text-lg font-semibold text-gray-800 mb-4">Course Features</Text>
      {features.map((item, index) => (
        <View key={index} className="flex-row items-center mb-2">
          <View className="text-blue-600 mr-3">{item.icon}</View>
          <Text className="text-gray-700">{item.text}</Text>
        </View>
      ))}
    </View>
  );
};
export default FeaturesCardMobile;