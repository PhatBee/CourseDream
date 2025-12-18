import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { PlayCircle, CheckCircle, Circle } from 'lucide-react-native';

const LectureItem = ({ lecture, index, isCurrent, isCompleted, onPress, onToggleComplete }) => {
  
  const formatDuration = (seconds) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center py-4 px-5 border-b border-gray-50 ${
        isCurrent ? 'bg-rose-50/60' : 'bg-white'
      }`}
    >
      {/* 1. Số thứ tự */}
      <Text className={`text-sm font-bold mr-4 w-6 text-center ${isCurrent ? 'text-rose-500' : 'text-gray-400'}`}>
        {index + 1}
      </Text>

      {/* 2. Thông tin bài học */}
      <View className="flex-1 pr-3">
        <Text 
            className={`text-[15px] font-medium mb-1.5 leading-5 ${isCurrent ? 'text-rose-600' : 'text-gray-800'}`}
        >
          {lecture.title}
        </Text>
        <View className="flex-row items-center">
            <PlayCircle size={12} color={isCurrent ? "#e11d48" : "#9ca3af"} />
            <Text className="text-xs text-gray-400 ml-1.5">
                {formatDuration(lecture.duration)}
            </Text>
        </View>
      </View>

      {/* 3. Nút Checkbox (Hoàn thành) */}
      <TouchableOpacity 
        onPress={(e) => {
            e.stopPropagation(); // Ngăn chặn việc bấm vào checkbox lại kích hoạt phát video
            onToggleComplete();
        }}
        className="p-2"
      >
        {isCompleted ? (
           <CheckCircle size={24} color="#10b981" fill="#ecfdf5" /> // Xanh lá đã xong
        ) : (
           <Circle size={24} color="#d1d5db" /> // Vòng tròn xám chưa xong
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default LectureItem;