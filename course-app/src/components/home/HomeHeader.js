import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Bell } from 'lucide-react-native';

const HomeHeader = ({ user }) => {
  return (
    <View className="flex-row justify-between items-center mb-6">
      <View>
        <Text className="text-gray-500 text-sm font-medium">Hello,</Text>
        <Text className="text-2xl font-bold text-gray-900">
          {user ? user.name : 'Guest User'} 👋
        </Text>
      </View>
      
      <View className="flex-row items-center gap-3">
        <TouchableOpacity className="p-2 bg-white rounded-full border border-gray-100 shadow-sm relative">
          <Bell size={24} color="#6b7280" />
          <View className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border border-white" />
        </TouchableOpacity>
        
        <TouchableOpacity>
          <Image 
            source={{ uri: user?.avatar || 'https://i.pravatar.cc/150?img=3' }} 
            className="w-10 h-10 rounded-full border-2 border-rose-100"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default HomeHeader;