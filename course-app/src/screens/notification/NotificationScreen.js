import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, CheckCheck, MessageCircle, BookOpen } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchNotifications,
  markAllAsRead,
  markAsRead,
} from '../../features/notification/notificationSlice';

const getNotifIcon = (type) => {
  switch (type) {
    case 'reply':
      return <MessageCircle size={18} color="#e11d48" />;
    case 'enrollment':
      return <BookOpen size={18} color="#7c3aed" />;
    default:
      return <Bell size={18} color="#f59e0b" />;
  }
};

const getNotifBg = (type) => {
  switch (type) {
    case 'reply': return 'bg-rose-50';
    case 'enrollment': return 'bg-purple-50';
    default: return 'bg-amber-50';
  }
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
};

const NotificationScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { notifications, loading } = useSelector(state => state.notification);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchNotifications());
    }, [dispatch])
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationPress = (notification) => {
    dispatch(markAsRead(notification._id));
    if (notification.type === 'reply' && notification.relatedId && notification.courseSlug) {
      navigation.navigate('DiscussionScreen', {
        courseSlug: notification.courseSlug,
        highlightReplyId: notification.replyId,
      });
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      className={`flex-row items-start px-4 py-4 border-b border-gray-50 ${
        item.read ? 'bg-white' : 'bg-rose-50/60'
      }`}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      {/* Icon */}
      <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 shrink-0 ${getNotifBg(item.type)}`}>
        {getNotifIcon(item.type)}
      </View>

      {/* Content */}
      <View className="flex-1">
        <View className="flex-row items-start justify-between">
          <Text
            className={`text-sm font-semibold flex-1 mr-2 ${item.read ? 'text-gray-700' : 'text-gray-900'}`}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text className="text-xs text-gray-400 shrink-0">{timeAgo(item.createdAt)}</Text>
        </View>
        <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={2}>
          {item.message}
        </Text>
      </View>

      {/* Unread dot */}
      {!item.read && (
        <View className="w-2 h-2 rounded-full bg-rose-500 mt-2 ml-2 shrink-0" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-1">
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-bold text-gray-900">Thông báo</Text>
            {unreadCount > 0 && (
              <Text className="text-xs text-rose-500">{unreadCount} chưa đọc</Text>
            )}
          </View>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            className="flex-row items-center gap-1.5 px-3 py-1.5 bg-rose-50 rounded-full"
            onPress={() => dispatch(markAllAsRead())}
          >
            <CheckCheck size={14} color="#e11d48" />
            <Text className="text-rose-500 text-xs font-medium">Đọc tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#e11d48" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-24">
              <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
                <Bell size={28} color="#d1d5db" />
              </View>
              <Text className="text-gray-500 font-medium">Chưa có thông báo nào</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default NotificationScreen;