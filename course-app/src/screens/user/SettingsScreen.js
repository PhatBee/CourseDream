import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Bell,
  Globe,
  Shield,
  HelpCircle,
  Star,
  Info,
  ChevronRight,
  Moon,
} from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from '@react-navigation/native';

const APP_VERSION = '1.0.0';
const STORAGE_KEY_NOTIF = '@settings_notifications';
const STORAGE_KEY_DARK = '@settings_dark_mode';

const SettingsScreen = ({ navigation }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const loadSettings = async () => {
        try {
          const notif = await SecureStore.getItemAsync(STORAGE_KEY_NOTIF);
          const dark = await SecureStore.getItemAsync(STORAGE_KEY_DARK);
          if (notif !== null) setNotificationsEnabled(JSON.parse(notif));
          if (dark !== null) setDarkMode(JSON.parse(dark));
        } catch (_) {}
      };
      loadSettings();
    }, [])
  );

  const toggleNotifications = async (value) => {
    setNotificationsEnabled(value);
    await SecureStore.setItemAsync(STORAGE_KEY_NOTIF, JSON.stringify(value));
  };

  const toggleDarkMode = async (value) => {
    setDarkMode(value);
    await SecureStore.setItemAsync(STORAGE_KEY_DARK, JSON.stringify(value));
    Alert.alert('Thông báo', 'Tính năng dark mode sẽ có trong phiên bản tới!');
  };

  const handleSupport = () => {
    Linking.openURL('mailto:support@coursedream.vn?subject=Hỗ trợ ứng dụng Course Dream');
  };

  const handleRate = () => {
    Alert.alert('Đánh giá ứng dụng', 'Cảm ơn bạn đã đánh giá chúng tôi! Tính năng sẽ mở Store sau.');
  };

  const handlePolicy = () => {
    Alert.alert('Chính sách bảo mật', 'Vui lòng truy cập website để xem chi tiết.');
  };

  const SectionTitle = ({ title }) => (
    <Text className="px-4 pt-6 pb-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
      {title}
    </Text>
  );

  const ToggleRow = ({ icon: Icon, iconColor, label, desc, value, onToggle }) => (
    <View className="flex-row items-center justify-between px-4 py-3.5 bg-white border-b border-gray-50">
      <View className="flex-row items-center flex-1 mr-3">
        <View className="w-9 h-9 rounded-full items-center justify-center mr-3" style={{ backgroundColor: `${iconColor}18` }}>
          <Icon size={18} color={iconColor} />
        </View>
        <View className="flex-1">
          <Text className="text-gray-900 font-medium text-sm">{label}</Text>
          {desc && <Text className="text-gray-400 text-xs mt-0.5">{desc}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#e5e7eb', true: '#fda4af' }}
        thumbColor={value ? '#e11d48' : '#f3f4f6'}
      />
    </View>
  );

  const LinkRow = ({ icon: Icon, iconColor, label, desc, onPress }) => (
    <TouchableOpacity
      className="flex-row items-center px-4 py-3.5 bg-white border-b border-gray-50"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="w-9 h-9 rounded-full items-center justify-center mr-3" style={{ backgroundColor: `${iconColor}18` }}>
        <Icon size={18} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className="text-gray-900 font-medium text-sm">{label}</Text>
        {desc && <Text className="text-gray-400 text-xs mt-0.5">{desc}</Text>}
      </View>
      <ChevronRight size={18} color="#9ca3af" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3 p-1">
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Cài đặt</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Thông báo */}
        <SectionTitle title="Thông báo" />
        <View className="mx-4 rounded-2xl overflow-hidden shadow-sm">
          <ToggleRow
            icon={Bell}
            iconColor="#e11d48"
            label="Thông báo ứng dụng"
            desc="Nhận thông báo về khóa học và cập nhật"
            value={notificationsEnabled}
            onToggle={toggleNotifications}
          />
          <ToggleRow
            icon={Moon}
            iconColor="#7c3aed"
            label="Chế độ tối"
            desc="Sẽ có trong phiên bản tới"
            value={darkMode}
            onToggle={toggleDarkMode}
          />
        </View>

        {/* Ngôn ngữ và vùng */}
        <SectionTitle title="Ngôn ngữ" />
        <View className="mx-4 rounded-2xl overflow-hidden shadow-sm">
          <LinkRow
            icon={Globe}
            iconColor="#0ea5e9"
            label="Ngôn ngữ"
            desc="Tiếng Việt"
            onPress={() => Alert.alert('Thông báo', 'Tính năng đa ngôn ngữ sẽ có trong phiên bản tới!')}
          />
        </View>

        {/* Hỗ trợ */}
        <SectionTitle title="Hỗ trợ & Phản hồi" />
        <View className="mx-4 rounded-2xl overflow-hidden shadow-sm">
          <LinkRow
            icon={HelpCircle}
            iconColor="#f59e0b"
            label="Trung tâm hỗ trợ"
            desc="Gửi email cho chúng tôi"
            onPress={handleSupport}
          />
          <LinkRow
            icon={Star}
            iconColor="#f43f5e"
            label="Đánh giá ứng dụng"
            desc="Ủng hộ chúng tôi trên Store"
            onPress={handleRate}
          />
          <LinkRow
            icon={Shield}
            iconColor="#10b981"
            label="Chính sách bảo mật"
            onPress={handlePolicy}
          />
        </View>

        {/* Thông tin */}
        <SectionTitle title="Thông tin" />
        <View className="mx-4 rounded-2xl overflow-hidden shadow-sm">
          <View className="flex-row items-center px-4 py-3.5 bg-white">
            <View className="w-9 h-9 rounded-full bg-rose-50 items-center justify-center mr-3">
              <Info size={18} color="#e11d48" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-medium text-sm">Phiên bản ứng dụng</Text>
              <Text className="text-gray-400 text-xs mt-0.5">Course Dream v{APP_VERSION}</Text>
            </View>
            <View className="bg-rose-50 px-2 py-0.5 rounded-full">
              <Text className="text-rose-500 text-xs font-semibold">Mới nhất</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;
