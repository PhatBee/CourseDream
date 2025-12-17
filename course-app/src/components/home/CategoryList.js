import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';

const CategoryList = ({ categories }) => {
  const renderItem = ({ item }) => (
    <TouchableOpacity className="items-center mr-5">
      <View className="w-16 h-16 bg-white rounded-full items-center justify-center border border-gray-100 shadow-sm mb-2">
        {/* Nếu có icon URL thì dùng Image, tạm thời dùng Text emoji */}
        <Text className="text-2xl">{item.icon || '💻'}</Text>
      </View>
      <Text className="text-xs font-medium text-gray-600">{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View className="mb-8">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-bold text-gray-900">Top Categories</Text>
        <TouchableOpacity>
          <Text className="text-rose-500 text-sm font-medium">See All</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList 
        data={categories}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 20 }}
      />
    </View>
  );
};

export default CategoryList;