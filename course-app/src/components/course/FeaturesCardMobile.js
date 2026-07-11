import React from 'react';
import { View, Text } from 'react-native';
import { Users, Clock, Layers, PlayCircle, BarChart2 } from 'lucide-react-native';

const FeaturesCardMobile = ({ course }) => {
  const { studentsCount = 0, totalHours = 0, sections = [], totalLectures = 0, level = 'beginner' } = course;

  const translateLevel = (level) => {
    switch (level) {
      case 'beginner': return 'Người mới bắt đầu';
      case 'advanced': return 'Nâng cao';
      case 'intermediate': return 'Trung cấp';
      case 'alllevels': return 'Mọi trình độ';
      default: return level;
    }
  };

  const features = [
    { icon: <Users size={16} color="#e11d48" />, text: `Học viên: ${studentsCount} học viên` },
    { icon: <Clock size={16} color="#e11d48" />, text: `Thời lượng: ${totalHours.toFixed(1)} giờ học` },
    { icon: <Layers size={16} color="#e11d48" />, text: `Chương học: ${sections.length} chương` },
    { icon: <PlayCircle size={16} color="#e11d48" />, text: `Video: ${totalLectures} bài giảng` },
    { icon: <BarChart2 size={16} color="#e11d48" />, text: `Trình độ: ${translateLevel(level)}` },
  ];

  return (
    // Layout spacing: Đảm bảo khoảng cách lề px-4 chuẩn chỉnh không chạm mép
    <View className="px-4 mb-4">
      <View className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <Text className="text-base font-bold text-gray-900 mb-4 tracking-tight">
          Thông tin khóa học
        </Text>
        <View className="space-y-3.5">
          {features.map((item, index) => (
            <View key={index} className="flex-row items-center">
              {/* Bọc icon trong cụm vòng tròn rose siêu loãng tinh tế */}
              <View className="bg-rose-50 p-2 rounded-xl mr-3.5 items-center justify-center">
                {item.icon}
              </View>
              <Text className="text-gray-700 text-sm font-medium flex-1">{item.text}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default FeaturesCardMobile;