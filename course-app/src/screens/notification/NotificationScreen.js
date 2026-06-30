import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
} from "../../features/notification/notificationSlice";
import {
  Bell,
  ShoppingBag,
  BookOpen,
  CheckCircle,
  XCircle,
  MessageSquare,
  AlertTriangle,
  CheckCheck,
  ShieldAlert,
  X,
} from "lucide-react-native";

// 1. Đồng bộ Icon và Màu sắc giống Web (getNotificationUI)
const getNotifIcon = (type) => {
  switch (type) {
    case "purchase_success":
      return <ShoppingBag size={20} color="#10b981" />;
    case "enrollment_course":
    case "reminder_learning":
      return <BookOpen size={20} color="#3b82f6" />;
    case "course_approved":
      return <CheckCircle size={20} color="#10b981" />;
    case "course_rejected":
      return <XCircle size={20} color="#ef4444" />;
    case "reply":
    case "reply_discussion":
      return <MessageSquare size={20} color="#8b5cf6" />;
    case "warning":
      return <AlertTriangle size={20} color="#f59e0b" />;
    case "system":
      return <Bell size={20} color="#6366f1" />;
    case "new_lesson":
      return <BookOpen size={20} color="#06b6d4" />;
    case "promotion":
      return <AlertTriangle size={20} color="#ec4899" />;
    case "course_completed":
      return <CheckCircle size={20} color="#14b8a6" />;
    default:
      return <Bell size={20} color="#9ca3af" />;
  }
};

const getNotifBg = (type) => {
  switch (type) {
    case "purchase_success":
      return "bg-green-100";
    case "enrollment_course":
    case "reminder_learning":
      return "bg-blue-100";
    case "course_approved":
      return "bg-emerald-100";
    case "course_rejected":
      return "bg-red-100";
    case "reply":
    case "reply_discussion":
      return "bg-violet-100";
    case "warning":
      return "bg-amber-100";
    case "system":
      return "bg-indigo-100";
    case "new_lesson":
      return "bg-cyan-100";
    case "promotion":
      return "bg-pink-100";
    case "course_completed":
      return "bg-teal-100";
    default:
      return "bg-gray-100";
  }
};

// Hàm định dạng thời gian
const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
};

const NotificationScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const { notifications, loading, unreadCount } = useSelector(
    (state) => state.notification,
  );
  const [refreshing, setRefreshing] = useState(false);

  // State Modal cho trường hợp thông báo bị Xóa (Giống web DeletedPopup)
  const [deletedPopup, setDeletedPopup] = useState(null);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchNotifications());
    }, [dispatch]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchNotifications());
    setRefreshing(false);
  };

  const handleMarkAllRead = () => {
    if (unreadCount > 0) {
      dispatch(markAllAsRead());
    }
  };

  // 2. Logic điều hướng giống hệt trên Web
  const handleNotificationPress = (item) => {
    if (!item.read) {
      dispatch(markAsRead(item._id));
    }

    const { type, metadata } = item;

    // YÊU CẦU 3: Nếu bài viết bị Xóa (isDeleted) -> Hiện Popup ngay tại màn hình thông báo
    if (metadata?.isDeleted) {
      setDeletedPopup(item);
      return;
    }

    // YÊU CẦU 1 & 2: Click vào thông báo dạng Report (warning) hoặc Reply -> Đi đến Cụ thể
    if (type === "warning" || type === "reply" || type === "reply_discussion") {
      if (
        metadata?.courseSlug &&
        metadata?.lessonId &&
        metadata?.discussionId
      ) {
        navigation.navigate("Learning", {
          slug: metadata.courseSlug,
          lectureId: metadata.lessonId, // Web dùng lessonId, ta map về param lectureId
          discussionId: metadata.discussionId,
          replyId: metadata.replyId,
        });
      } else if (metadata?.courseSlug) {
        navigation.navigate("CourseDetail", { slug: metadata.courseSlug });
      }
      return;
    }

    // --- CÁC TRƯỜNG HỢP KHÁC ---
    // Debug: xem type và metadata thực tế
    console.log('[Notification] type:', type, '| metadata:', JSON.stringify(metadata));

    switch (type) {
      case "system":
        // Thông báo duyệt/từ chối giảng viên → chuyển sang BecomeInstructor
        // Dùng getParent() để tránh bị giới hạn bởi Tab navigator context
        try {
          navigation.navigate("BecomeInstructor");
        } catch (e) {
          navigation.getParent()?.navigate("BecomeInstructor");
        }
        break;
      case "purchase_success":
        navigation.navigate("MyCourses");
        break;
      case "enrollment_course":
      case "reminder_learning":
        if (metadata?.courseSlug)
          navigation.navigate("Learning", { slug: metadata.courseSlug });
        break;
      case "course_approved":
      case "new_lesson":
      case "promotion":
        if (metadata?.courseSlug)
          navigation.navigate("CourseDetail", { slug: metadata.courseSlug });
        break;
      default:
        console.log('[Notification] Unhandled type:', type);
        break;
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      className={`flex-row items-start px-4 py-4 border-b border-gray-100 ${
        item.read ? "bg-white" : "bg-rose-50/40"
      }`}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View
        className={`w-11 h-11 rounded-full items-center justify-center mr-3 shrink-0 ${getNotifBg(item.type)}`}
      >
        {getNotifIcon(item.type)}
      </View>

      <View className="flex-1">
        <View className="flex-row items-start justify-between">
          <Text
            className={`text-sm font-semibold flex-1 mr-2 ${item.read ? "text-gray-700" : "text-gray-900"}`}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text className="text-[11px] text-gray-400 shrink-0">
            {timeAgo(item.createdAt)}
          </Text>
        </View>
        <Text
          className={`text-xs mt-1 leading-5 ${item.read ? "text-gray-500" : "text-gray-700 font-medium"}`}
          numberOfLines={2}
        >
          {item.message}
        </Text>
      </View>

      {!item.read && (
        <View className="w-2 h-2 rounded-full bg-rose-500 mt-2 ml-3 shrink-0" />
      )}
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-rose-100 bg-rose-50">
        <Text className="font-bold text-gray-700 text-[16px]">
          Thông báo của bạn
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllRead}
            className="flex-row items-center gap-1 bg-white px-2 py-1.5 rounded-md border border-gray-200"
          >
            <CheckCheck size={14} color="#3b82f6" />
            <Text className="text-blue-500 text-xs font-bold">
              Đánh dấu tất cả
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {loading && !refreshing && notifications.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#e11d48" />
        </View>
      ) : notifications?.length > 0 ? (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#e11d48"]}
            />
          }
          contentContainerStyle={{
            paddingBottom: Math.max(insets.bottom, 20) + 20,
          }}
        />
      ) : (
        <View className="flex-1 items-center justify-center p-6">
          <View className="bg-gray-100 p-5 rounded-full mb-4">
            <Bell size={40} color="#9ca3af" />
          </View>
          <Text className="text-gray-800 font-bold text-lg">
            Chưa có thông báo nào
          </Text>
          <Text className="text-gray-500 text-center mt-2 px-4 leading-5">
            Khi bạn có thông báo về khóa học hay thảo luận, chúng sẽ xuất hiện
            tại đây.
          </Text>
        </View>
      )}

      {/* YÊU CẦU 3: POPUP CHI TIẾT KHI NỘI DUNG ĐÃ BỊ XÓA (Giống hệt Web Portal deletedPopup) */}
      <Modal
        visible={!!deletedPopup}
        transparent
        animationType="fade"
        onRequestClose={() => setDeletedPopup(null)}
      >
        <View className="flex-1 justify-center items-center bg-black/60 p-4">
          {deletedPopup && (
            <View className="bg-white rounded-2xl overflow-hidden w-full max-w-lg shadow-2xl relative">
              {/* Header */}
              <View className="bg-rose-50 px-5 py-4 flex-row items-center border-b border-rose-100">
                <View className="w-11 h-11 rounded-full items-center justify-center bg-white shadow-sm mr-3">
                  <ShieldAlert size={24} color="#e11d48" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-gray-900">
                    Chi tiết xử lý vi phạm
                  </Text>
                  <Text
                    className="text-sm font-semibold text-rose-600"
                    numberOfLines={1}
                  >
                    {deletedPopup.title}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setDeletedPopup(null)}
                  className="bg-white p-2 rounded-full shadow-sm ml-2"
                >
                  <X size={20} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              {/* Body */}
              <ScrollView className="px-5 py-5 max-h-96">
                <View className="mb-4">
                  <Text className="text-[11px] font-bold text-rose-500 uppercase tracking-widest mb-1.5">
                    Lý do hệ thống tiếp nhận
                  </Text>
                  <View className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                    <Text className="text-sm text-rose-700 font-semibold">
                      {deletedPopup.metadata?.reportReasonLabel ||
                        "Vi phạm tiêu chuẩn cộng đồng"}
                    </Text>
                  </View>
                </View>

                {deletedPopup.metadata?.adminNote && (
                  <View className="mb-4">
                    <Text className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                      Ghi chú từ quản trị viên
                    </Text>
                    <View className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
                      <Text className="text-gray-700 font-medium">
                        {deletedPopup.metadata.adminNote}
                      </Text>
                    </View>
                  </View>
                )}

                <View className="mb-2">
                  <Text className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                    Nội dung đã đăng tải
                  </Text>
                  <View className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                    <Text className="text-gray-700 text-sm leading-5">
                      {deletedPopup.metadata?.originalContent ||
                        deletedPopup.message}
                    </Text>
                  </View>
                  <Text className="text-[10px] text-gray-400 font-medium mt-2 text-right italic">
                    ** Việc vi phạm nhiều lần có thể dẫn tới khóa tài khoản vĩnh
                    viễn.
                  </Text>
                </View>
              </ScrollView>

              {/* Footer */}
              <View className="px-5 py-4 border-t border-gray-100 bg-gray-50/70 items-end">
                <TouchableOpacity
                  onPress={() => setDeletedPopup(null)}
                  className="px-6 py-2.5 bg-gray-900 rounded-lg shadow-md"
                >
                  <Text className="text-white text-sm font-bold">Đóng</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

export default NotificationScreen;
