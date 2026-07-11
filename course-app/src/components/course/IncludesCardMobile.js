import React from 'react';
import { View, Text } from 'react-native';
import { Video, Download, Key, Smartphone, Award, HelpCircle, Check, Clock } from 'lucide-react-native';

const staticIcons = [
  <Video size={16} color="#e11d48" />, 
  <Download size={16} color="#e11d48" />, 
  <Key size={16} color="#e11d48" />, 
  <Smartphone size={16} color="#e11d48" />, 
  <HelpCircle size={16} color="#e11d48" />, 
  <Award size={16} color="#e11d48" />,
  <Clock size={16} color="#e11d48" />

];
const defaultIcon = <Check size={16} color="#e11d48" />;

const IncludesCardMobile = ({ course }) => {
  if (!course) return null;
  const includesList = course.includes || [];
  const durationInWeeks = course.durationInWeeks || 12;

  return (
    <View className="px-4 mb-4">
      <View className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <Text className="text-base font-bold text-gray-900 mb-4 tracking-tight">
          Khóa học bao gồm
        </Text>
        <View className="space-y-3.5">
          {includesList.map((text, index) => (
            <View key={index} className="flex-row items-center">
              <View className="bg-rose-50 p-2 rounded-xl mr-3.5 items-center justify-center">
                {staticIcons[index] || defaultIcon}
              </View>
              <Text className="text-gray-700 text-sm font-medium flex-1">{text}</Text>
            </View>
          ))}
        </View>
        <View className="flex-row items-center">
            <View className="bg-rose-50 p-2 rounded-xl mr-3.5 items-center justify-center">
              <Clock size={16} color="#e11d48" />
            </View>
            <Text className="text-gray-700 text-sm font-medium flex-1">
              Thời hạn truy cập: {durationInWeeks} tuần
            </Text>
          </View>
      </View>
    </View>
  );
};

export default IncludesCardMobile;