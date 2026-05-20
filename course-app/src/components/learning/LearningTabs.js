import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { List, BookOpen, Paperclip, MessageSquare } from 'lucide-react-native';

const BASE_TABS = [
  { id: 'Lectures', label: 'Bài giảng', Icon: List },
  { id: 'Overview', label: 'Tổng quan', Icon: BookOpen },
  { id: 'Discussion', label: 'Thảo luận', Icon: MessageSquare },
];

/**
 * LearningTabs
 * @param {string} activeTab
 * @param {Function} setActiveTab
 * @param {number} resourceCount - Số tài liệu của bài giảng hiện tại (0 → ẩn tab)
 */
const LearningTabs = ({ activeTab, setActiveTab, resourceCount = 0 }) => {
  const tabs = [
    ...BASE_TABS,
    ...(resourceCount > 0
      ? [{ id: 'Resources', label: `Tài liệu (${resourceCount})`, Icon: Paperclip }]
      : []),
  ];

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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginRight: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#e11d48',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#e11d48',
  },
});

export default LearningTabs;
