import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { List, BookOpen } from 'lucide-react-native';

const TABS = [
  { id: 'Lectures', label: 'Bài giảng', Icon: List },
  { id: 'Overview', label: 'Tổng quan', Icon: BookOpen },
];

const LearningTabs = ({ activeTab, setActiveTab }) => {
  return (
    <View style={styles.container}>
      {TABS.map(({ id, label, Icon }) => {
        const isActive = activeTab === id;
        return (
          <TouchableOpacity
            key={id}
            onPress={() => setActiveTab(id)}
            style={[styles.tab, isActive && styles.tabActive]}
            activeOpacity={0.75}
          >
            <Icon size={14} color={isActive ? '#e11d48' : '#6b7280'} />
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
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
    marginRight: 24,
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