import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { Search } from 'lucide-react-native';

const CourseFilter = ({
  search,
  setSearch,
  categories = [],
  selectedCategory,
  setSelectedCategory,
  onSearch, // nhận prop mới
}) => {
  const [inputValue, setInputValue] = useState(search);
  const data = [{ _id: '', name: 'Tất cả' }, ...categories];

  const handleSearch = () => {
    if (onSearch) onSearch(inputValue);
  };

  return (
    <View className="p-3 bg-white border-b border-gray-100">
      <View className="flex-row items-center mb-2 bg-gray-100 rounded-lg border border-gray-200">
        <TextInput
          style={{
            flex: 1,
            paddingHorizontal: 12,
            paddingVertical: 8,
            fontSize: 16,
            backgroundColor: 'transparent',
          }}
          placeholder="Tìm kiếm khóa học..."
          value={inputValue}
          onChangeText={setInputValue}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity className="px-2 py-2" onPress={handleSearch}>
          <Search size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={data}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => item._id || String(index)}
        renderItem={({ item }) => {
          const isActive = selectedCategory === item._id;
          return (
            <TouchableOpacity
              onPress={() => setSelectedCategory(item._id)}
              className={
                "px-4 py-2 rounded-full mr-2 border " +
                (isActive
                  ? "bg-rose-500 border-rose-500"
                  : "bg-gray-100 border-gray-200")
              }
            >
              <Text
                className={
                  "text-sm " +
                  (isActive ? "text-white font-bold" : "text-gray-700")
                }
              >
                {String(item.name || '')}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

export default CourseFilter;
