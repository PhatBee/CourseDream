import React from 'react';
import { View, Text } from 'react-native';
import { Users, Clock, Layers, PlayCircle, BarChart2 } from 'lucide-react-native';

const FeaturesCardMobile = ({ course }) => {
  const { studentsCount = 0, totalHours = 0, sections = [], totalLectures = 0, level = 'beginner' } = course;

  // Hàm tthay level bằng tiênngs việt (beginner, advanced, immediate, alllevels)
  const translateLevel = (level) => {
    switch (level) {
      case 'beginner':
        return 'Người mới bắt đầu';
      case 'advanced':
        return 'Nâng cao';
      case 'intermediate':
        return 'Trung cấp';
      case 'alllevels':
        return 'Mọi trình độ';
      default:
        return level;
    }
  };


  const features = [
    { icon: <Users size={18} />, text: `Học viên: ${studentsCount} học viên` },
    { icon: <Clock size={18} />, text: `Thời lượng: ${totalHours.toFixed(1)} giờ` },
    { icon: <Layers size={18} />, text: `Chương: ${sections.length}` },
    { icon: <PlayCircle size={18} />, text: `Video: ${totalLectures} bài giảng` },
    { icon: <BarChart2 size={18} />, text: `Trình độ: ${translateLevel(level)}` },
  ];
  return (
    <View className="bg-white rounded-lg border border-gray-200 mb-4 p-4">
      <Text className="text-lg font-semibold text-gray-800 mb-4">Thông tin khóa học</Text>
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