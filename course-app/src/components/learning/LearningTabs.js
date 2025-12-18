import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const LearningTabs = ({ activeTab, setActiveTab }) => {
  const tabs = ['Lectures', 'More'];

  return (
    <View className="flex-row border-b border-gray-200 px-5 bg-white">
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab}
          onPress={() => setActiveTab(tab)}
          className={`mr-8 py-4 ${
            activeTab === tab ? 'border-b-2 border-rose-500' : ''
          }`}
        >
          <Text
            className={`text-sm font-bold ${
              activeTab === tab ? 'text-rose-500' : 'text-gray-500'
            }`}
          >
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default LearningTabs;