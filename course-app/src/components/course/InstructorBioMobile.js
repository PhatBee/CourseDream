import React from 'react';
import { View, Text, Image } from 'react-native';
import { Star, MessageSquare, Users2 } from 'lucide-react-native';

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
      <Text className="text-base font-bold text-gray-900 mb-3 tracking-tight">Giảng viên</Text>
      
      <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex-row items-center">
        {/* Border mỏng bo tròn hoàn hảo cho hình đại diện */}
        <View className="rounded-full border border-gray-100 p-0.5 shadow-inner">
          <Image
            source={avatar ? { uri: avatar } : require('../../../assets/images/default-avatar.jpg')}
            style={{ width: 60, height: 60, borderRadius: 30 }}
          />
        </View>
        
        <View className="flex-1 ml-4 justify-center">
          <Text className="font-bold text-[15px] text-gray-900 mb-0.5">{name}</Text>
          {email ? (
            <Text className="text-xs text-gray-400 font-medium mb-2">{email}</Text>
          ) : null}
          
          {/* Cụm thông số chi tiết chia mảng scannable tốt */}
          <View className="flex-row items-center flex-wrap gap-x-3 gap-y-1">
            <View className="flex-row items-center space-x-1">
              <Star size={13} color="#f59e0b" fill="#f59e0b" />
              <Text className="text-xs font-bold text-gray-700">{rating?.toFixed(1) || '0.0'}</Text>
            </View>
            
            <View className="flex-row items-center space-x-1">
              <MessageSquare size={13} color="#6b7280" />
              <Text className="text-xs text-gray-500 font-medium">{totalReviews} đánh giá</Text>
            </View>
            
            <View className="flex-row items-center space-x-1">
              <Users2 size={13} color="#6b7280" />
              <Text className="text-xs text-gray-500 font-medium">{totalStudents} học viên</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default InstructorBioMobile;