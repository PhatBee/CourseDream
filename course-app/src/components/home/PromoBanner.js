import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const PromoBanner = () => {
  return (
    <View className="bg-rose-500 rounded-2xl p-5 mb-8 relative overflow-hidden shadow-lg shadow-rose-200">
      {/* Background decoration */}
      <View className="absolute -right-6 -bottom-6 w-32 h-32 bg-white opacity-10 rounded-full" />
      <View className="absolute right-10 -top-6 w-20 h-20 bg-white opacity-10 rounded-full" />

      <View className="w-3/4">
        <Text className="text-white font-bold text-lg mb-1">Get 20% Off</Text>
        <Text className="text-rose-100 text-xs mb-4 leading-5">
          Join our pro courses today and start your journey!
        </Text>
        <TouchableOpacity className="bg-white self-start px-5 py-2.5 rounded-lg shadow-sm">
          <Text className="text-rose-600 font-bold text-xs">Enroll Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PromoBanner;