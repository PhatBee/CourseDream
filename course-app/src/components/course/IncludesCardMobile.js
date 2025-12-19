import React from 'react';
import { View, Text } from 'react-native';
import { Video, Download, Key, Smartphone, Award, HelpCircle, Check } from 'lucide-react-native';

const staticIcons = [
  <Video size={18} />, <Download size={18} />, <Key size={18} />, <Smartphone size={18} />, <HelpCircle size={18} />, <Award size={18} />
];
const defaultIcon = <Check size={18} />;

const IncludesCardMobile = ({ course }) => {
  const includesList = course.includes || [];
  return (
    <View className="bg-white rounded-lg border border-gray-200 mb-4 p-4">
      <Text className="text-lg font-semibold text-gray-800 mb-4">Includes</Text>
      {includesList.map((text, index) => (
        <View key={index} className="flex-row items-center mb-2">
          <View className="text-blue-600 mr-3">{staticIcons[index] || defaultIcon}</View>
          <Text className="text-gray-700">{text}</Text>
        </View>
      ))}
    </View>
  );
};
export default IncludesCardMobile;