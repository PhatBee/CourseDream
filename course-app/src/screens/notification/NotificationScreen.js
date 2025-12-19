import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications, markAllAsRead, markAsRead } from '../../features/notification/notificationSlice';

const NotificationScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { notifications, loading } = useSelector(state => state.notification);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleNotificationPress = (notification) => {
    dispatch(markAsRead(notification._id));
    if (notification.type === 'reply' && notification.relatedId && notification.courseSlug) {
      navigation.navigate('DiscussionScreen', {
        courseSlug: notification.courseSlug, // truyền slug thay vì courseId
        highlightReplyId: notification.relatedId,
      });
    }
    // ...xử lý các loại khác nếu cần
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-6 py-4 border-b border-gray-100">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-xl font-bold">Thông báo</Text>
        <TouchableOpacity className="ml-auto" onPress={() => dispatch(markAllAsRead())}>
          <Text className="text-blue-600 font-medium">Đánh dấu đã đọc</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#e11d48" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity
              className={`p-4 border-b ${item.read ? 'bg-white' : 'bg-yellow-50'}`}
              onPress={() => handleNotificationPress(item)}
            >
              <Text className="font-semibold">{item.title}</Text>
              <Text className="text-gray-600">{item.message}</Text>
              <Text className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleString()}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
};

export default NotificationScreen;