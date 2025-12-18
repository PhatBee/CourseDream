import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Search, SlidersHorizontal } from 'lucide-react-native';

const SearchBar = ({ onSearch }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSearch = () => {
    if (onSearch && inputValue.trim()) {
      onSearch(inputValue.trim());
    }
  };

  return (
    <View className="flex-row items-center gap-3 mb-6">
      <View className="flex-1 flex-row items-center bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
        <Search size={20} color="#9ca3af" />
        <TextInput 
          placeholder="Search for courses..." 
          className="flex-1 ml-3 text-gray-700 text-base"
          placeholderTextColor="#9ca3af"
          value={inputValue}
          onChangeText={setInputValue}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
      </View>
      
      <TouchableOpacity className="bg-rose-500 p-3 rounded-xl shadow-sm shadow-rose-200" onPress={handleSearch}>
        <SlidersHorizontal size={20} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default SearchBar;