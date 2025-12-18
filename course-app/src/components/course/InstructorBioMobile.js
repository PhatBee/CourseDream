import React from 'react';
import { View, Text, Image } from 'react-native';

const InstructorBioMobile = ({ instructor = {} }) => (
  <View className="px-4 mb-4">
    <Text className="text-lg font-bold mb-2">Giảng viên</Text>
    <View className="flex-row items-center mb-2">
      <Image
        source={instructor.avatar ? { uri: instructor.avatar } : require('../../../assets/images/default-avatar.jpg')}
        style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }}
      />
      <View>
        <Text className="font-semibold">{instructor.name || '...'}</Text>
        <Text className="text-xs text-gray-500">{instructor.bio || ''}</Text>
      </View>
    </View>
  </View>
);

export default InstructorBioMobile;