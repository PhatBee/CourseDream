import React from 'react';
import { View, Text } from 'react-native';
import { Check } from 'lucide-react-native';

const CourseOverviewMobile = ({ course }) => {
  const { description = '', learnOutcomes = [], requirements = [] } = course;

  return (
    <View className="px-4 mb-4 flex-col space-y-4">
      {/* Khối: Bạn sẽ học được gì */}
      {learnOutcomes.length > 0 && (
        <View className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <Text className="font-bold text-base mb-4 text-gray-900 tracking-tight">Bạn sẽ học được gì</Text>
          <View className="space-y-3">
            {learnOutcomes.map((item, idx) => (
              <View key={idx} className="flex-row items-start">
                <View className="bg-rose-50 p-1 rounded-full mr-3 mt-0.5">
                  <Check size={13} color="#e11d48" strokeWidth={3} />
                </View>
                <Text style={{ textAlign: 'justify' }} className="text-gray-600 text-sm leading-5 flex-1">
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Khối: Yêu cầu khóa học */}
      {requirements.length > 0 && (
        <View className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <Text className="font-bold text-base mb-4 text-gray-900 tracking-tight">Yêu cầu khóa học</Text>
          <View className="space-y-3">
            {requirements.map((item, idx) => (
              <View key={idx} className="flex-row items-start">
                {/* Dấu chấm đầu dòng tinh tế màu Rose thay cho dấu bullet thô cũ */}
                <View className="w-2 h-2 rounded-full bg-rose-400 mr-3.5 mt-2" />
                <Text style={{ textAlign: 'justify' }} className="text-gray-600 text-sm leading-5 flex-1">
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Khối: Mô tả chi tiết */}
      {description ? (
        <View className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <Text className="font-bold text-base mb-3 text-gray-900 tracking-tight">Mô tả khóa học</Text>
          <Text 
            style={{ textAlign: 'justify' }} 
            className="text-gray-600 text-[14px] leading-6 font-normal"
          >
            {description}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

export default CourseOverviewMobile;