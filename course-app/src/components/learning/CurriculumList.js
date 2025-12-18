import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import LectureItem from './LectureItem';

const CurriculumList = ({ 
    sections, 
    currentLecture, 
    completedLectures = [], 
    onLecturePress,
    onToggleComplete // Nhận hàm toggle từ LearningScreen
}) => {
  // State lưu trạng thái mở/đóng của từng section (Lưu theo index hoặc ID)
  // Mặc định mở section đầu tiên (0: true)
  const [expandedSections, setExpandedSections] = useState({ 0: true });

  const toggleSection = (index) => {
    setExpandedSections(prev => ({
      ...prev,
      [index]: !prev[index] // Đảo ngược trạng thái
    }));
  };

  return (
    <View className="pb-10">
      {sections.map((section, secIndex) => {
        const isExpanded = !!expandedSections[secIndex];

        return (
          <View key={section._id || secIndex} className="mb-2 bg-white">
            {/* --- SECTION HEADER (Click để đóng/mở) --- */}
            <TouchableOpacity 
                onPress={() => toggleSection(secIndex)}
                activeOpacity={0.7}
                className="flex-row justify-between items-center bg-gray-50 px-5 py-4 border-b border-gray-100"
            >
              <View className="flex-1 mr-2">
                  <Text className="font-bold text-gray-800 text-sm mb-1">
                    Section {secIndex + 1}: {section.title}
                  </Text>
                  <Text className="text-gray-500 text-xs">
                    {section.lectures?.length || 0} lectures
                  </Text>
              </View>
              
              {isExpanded ? (
                <ChevronUp size={20} color="#6b7280" />
              ) : (
                <ChevronDown size={20} color="#6b7280" />
              )}
            </TouchableOpacity>

            {/* --- LECTURE LIST (Chỉ hiện khi Expanded) --- */}
            {isExpanded && (
                <View>
                    {section.lectures?.map((lecture, lecIndex) => {
                        const isCurrent = currentLecture?._id === lecture._id;
                        const isCompleted = completedLectures.includes(lecture._id);

                        return (
                        <LectureItem
                            key={lecture._id || lecIndex}
                            index={lecIndex}
                            lecture={lecture}
                            isCurrent={isCurrent}
                            isCompleted={isCompleted}
                            onPress={() => onLecturePress(lecture)}
                            // Truyền hàm toggle vào item
                            onToggleComplete={() => onToggleComplete(lecture._id)}
                        />
                        );
                    })}
                </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

export default CurriculumList;