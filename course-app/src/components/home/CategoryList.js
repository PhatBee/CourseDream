import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

const CategoryList = ({ categories, navigation }) => {
  const handleCategoryPress = (item) => {
    if (navigation) {
      navigation.navigate('MainTabs', {
        screen: 'CoursesTab',
        params: { categoryId: item._id, categoryName: item.name },
      });
    }
  };

  const handleSeeAll = () => {
    if (navigation) {
      navigation.navigate('MainTabs', {
        screen: 'CoursesTab',
        params: { clearSearch: true },
      });
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      activeOpacity={0.8}
      className="items-center mr-4" 
      onPress={() => handleCategoryPress(item)}
    >
      <View className="w-14 h-14 bg-rose-50/50 rounded-2xl items-center justify-center border border-rose-100/40 shadow-sm mb-2">
        <Text className="text-xl">{`${item.icon || '💻'}`}</Text>
      </View>
      
      <Text 
        numberOfLines={1} 
        className="text-[11px] font-semibold text-gray-700 text-center max-w-[64px]"
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View className="mb-8 bg-transparent w-full">
      <View className="mb-4 pl-5">
        <Text className="text-lg font-bold text-gray-900">
          Danh mục
        </Text>
      </View>

      <FlatList
        data={categories}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingLeft: 20,
          paddingRight: 4,
        }}
      />
    </View>
  );
};

export default CategoryList;