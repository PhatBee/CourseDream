import React from 'react';
import { View, Text, Image } from 'react-native';
import { Star } from 'lucide-react-native';

const InstructorBioMobile = ({ instructor = {} }) => {
  const {
    name = '...',
    avatar,
    rating = 0,
    totalReviews = 0,
    totalStudents = 0,
    email = '',
  } = instructor;

  return (
    <View className="px-4 mb-4">
      <Text className="text-lg font-bold mb-2">About the instructor</Text>
      <View className="flex-row items-center bg-white rounded-xl p-4 shadow border border-gray-100">
        <Image
          source={avatar ? { uri: avatar } : require('../../../assets/images/default-avatar.jpg')}
          style={{ width: 56, height: 56, borderRadius: 28, marginRight: 16 }}
        />
        <View className="flex-1">
          <Text className="font-bold text-base text-gray-900 mb-1">{name}</Text>
          {email ? (
            <Text className="text-xs text-gray-500 mb-1">{email}</Text>
          ) : null}
          <View className="flex-row items-center mt-1">
            <Star size={14} color="#f59e0b" fill="#f59e0b" />
            <Text className="ml-1 font-bold text-gray-700">{rating?.toFixed(1) || '0.0'}</Text>
            <Text className="ml-2 text-xs text-gray-500">{totalReviews} Reviews</Text>
            <Text className="ml-2 text-xs text-gray-500">{totalStudents} Students</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default InstructorBioMobile;