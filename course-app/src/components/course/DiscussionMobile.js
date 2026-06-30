import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchDiscussions,
  addDiscussion,
  deleteDiscussion,
} from "../../features/discussion/discussionSlice";
import DeleteConfirmModal from "../common/DeleteConfirmModal";
import Toast from "react-native-toast-message";
import ReportModalMobile from "../common/ReportModalMobile";
import DiscussionModalMobile from "./DiscussionModalMobile";
import {
  MessageCircle,
  ThumbsUp,
  MoreVertical,
  CheckCircle2,
  X,
  Trash2,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DiscussionMobile = ({ courseId, lectureId, isEnrolled, user, targetDiscussionId, targetReplyId, onConsumed }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  const { discussions, loading } = useSelector((state) => state.discussion);

  // States dành cho Form Tạo Thảo Luận mới (Yêu Cầu #3)
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // States dành cho Modals Report / Chi tiết
  const [reportVisible, setReportVisible] = useState(false);
  const [reportTargetId, setReportTargetId] = useState("");
  const [reportType, setReportType] = useState("discussion");
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);

  // States dành cho Delete Confirm Modal
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [discussionToDelete, setDiscussionToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const flatListRef = useRef(null);
  const [highlightedDiscussionId, setHighlightedDiscussionId] = useState(null);

  // Thêm state để theo dõi lần load đầu tiên
  const [isFetchingInitial, setIsFetchingInitial] = useState(true);

  useEffect(() => {
    if (courseId && lectureId) {
      setIsFetchingInitial(true);
      setPage(1);
      dispatch(fetchDiscussions({ courseId, lectureId, page: 1, limit: 10 }))
        .finally(() => {
          setIsFetchingInitial(false);
        });
    }
  }, [courseId, lectureId, dispatch]);

  useEffect(() => {
    if (targetDiscussionId && !isFetchingInitial) {
      const target = discussions.find((d) => d._id === targetDiscussionId);

      if (target) {
        if (targetReplyId) {
          // CÓ REPLY ID -> Chỉ mở Popup chi tiết nếu là Reply
          if (!selectedDiscussion) {
            setSelectedDiscussion(target);
          }
        } else {
          // KHÔNG CÓ REPLY ID -> Highlight và Scroll
          setHighlightedDiscussionId(targetDiscussionId);

          const index = discussions.findIndex((d) => d._id === targetDiscussionId);
          if (index !== -1 && flatListRef.current) {
            setTimeout(() => {
              flatListRef.current?.scrollToIndex({
                index,
                animated: true,
                viewPosition: 0.5,
              });
            }, 600);
          }

          // Tự tắt highlight sau 3s (Tương tự web)
          setTimeout(() => setHighlightedDiscussionId(null), 3000);
        }
      } else {
        // KHÔNG TÌM THẤY TARGET (đã bị xóa hoặc không nằm trong trang 1)
        Toast.show({ type: "error", text1: "Không tìm thấy thảo luận", text2: "Thảo luận này có thể đã bị xóa." });
      }

      // Luôn consume param để dọn dẹp sau khi xử lý (kể cả tìm thấy hay không)
      if (onConsumed) onConsumed();
    }
  }, [targetDiscussionId, targetReplyId, discussions, isFetchingInitial, selectedDiscussion, onConsumed]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPage(1);
    await dispatch(
      fetchDiscussions({ courseId, lectureId, page: 1, limit: 10 }),
    );
    setIsRefreshing(false);
  }, [courseId, lectureId, dispatch]);

  const handleCreateDiscussion = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      Toast.show({ type: "error", text1: "Vui lòng nhập đủ thông tin" });
      return;
    }
    try {
      await dispatch(
        addDiscussion({
          courseId,
          lectureId,
          title: newTitle,
          content: newContent,
        }),
      ).unwrap();
      setNewTitle("");
      setNewContent("");
      setCreateModalVisible(false); // Tắt popup
      dispatch(fetchDiscussions({ courseId, lectureId, page: 1, limit: 10 }));
      Toast.show({ type: "success", text1: "Đã đăng câu hỏi học tập!" });
    } catch (err) {
      Toast.show({ type: "error", text1: "Không thể đăng câu hỏi" });
    }
  };

  const openReport = (id, type = "discussion") => {
    setReportTargetId(id);
    setReportType(type);
    setReportVisible(true);
  };

  const handleOpenDeleteModal = (discussionId) => {
    setDiscussionToDelete(discussionId);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!discussionToDelete) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteDiscussion(discussionToDelete)).unwrap();
      Toast.show({ type: "success", text1: "Đã xóa bài thảo luận." });
      dispatch(fetchDiscussions({ courseId, lectureId, page: 1, limit: 10 }));
    } catch {
      Toast.show({ type: "error", text1: "Không thể xóa thảo luận." });
    } finally {
      setIsDeleting(false);
      setDeleteModalVisible(false);
      setDiscussionToDelete(null);
    }
  };

  const canDiscuss = isEnrolled || (user && user.role === "instructor");

  if (loading && discussions?.length === 0)
    return (
      <View className="py-10 items-center justify-center flex-1">
        <ActivityIndicator size="large" color="#e11d48" />
      </View>
    );

  return (
    <View className="flex-1 bg-gray-50 pt-3">
      {/* 3. NÚT HIỂN THỊ POPUP TẠO CHỦ ĐỀ MỚI (Thu gọn giao diện) */}
      {canDiscuss && (
        <View className="px-4 mb-4">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setCreateModalVisible(true)}
            className="bg-white p-3 rounded-xl border border-gray-200 flex-row items-center gap-3 shadow-sm"
          >
            <Image
              source={
                user?.avatar?.url
                  ? { uri: user.avatar.url }
                  : user?.avatar
                    ? { uri: user.avatar }
                    : require("../../../assets/images/default-avatar.jpg")
              }
              style={{ width: 40, height: 40, borderRadius: 20 }}
            />
            <Text className="text-gray-500 font-medium">
              Tạo chủ đề thảo luận / Hỏi bài...
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* DANH SÁCH CÂU HỎI */}
      <FlatList
        ref={flatListRef}
        data={discussions}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={["#e11d48"]}
          />
        }
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 60,
        }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="py-12 items-center px-6">
            <View className="bg-gray-200 p-4 rounded-full mb-4">
              <MessageCircle size={32} color="#9CA3AF" />
            </View>
            <Text className="text-gray-500 font-bold text-base mt-2">
              Chưa có thảo luận nào
            </Text>
            <Text className="text-gray-400 mt-1 text-sm text-center font-medium">
              Bạn có thắc mắc gì không? Hãy là người đầu tiên đặt câu hỏi!
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isHighlighted = item._id === highlightedDiscussionId;
          return (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setSelectedDiscussion(item)}
              className={`rounded-2xl p-4 mb-4 border shadow-sm ${isHighlighted
                  ? "bg-rose-50 border-rose-300"
                  : "bg-white border-gray-100"
                }`}
              style={{
                elevation: 2,
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 3,
              }}
            >
              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center flex-1">
                  <Image
                    source={
                      item.author?.avatar?.url
                        ? { uri: item.author.avatar.url }
                        : item.author?.avatar
                          ? { uri: item.author.avatar }
                          : require("../../../assets/images/default-avatar.jpg")
                    }
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      marginRight: 8,
                    }}
                  />
                  <View>
                    <Text className="font-bold text-gray-800 text-[13px]">
                      {item.author?.name || "Ẩn danh"}
                    </Text>
                    <Text className="text-xs text-gray-400 font-medium">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {/* Nút hành động: Xóa (chủ sở hữu) hoặc Báo cáo (người khác) */}
                {user?._id === item.author?._id ? (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleOpenDeleteModal(item._id);
                    }}
                    className="p-2 -mr-2 -mt-2"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Trash2 size={17} color="#EF4444" />
                  </TouchableOpacity>
                ) : user?._id && item.author?._id !== user._id ? (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      openReport(item._id, "discussion");
                    }}
                    className="p-2 -mr-2 -mt-2"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MoreVertical size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                ) : null}
              </View>

              <Text
                className="font-bold text-gray-900 text-base mb-2"
                numberOfLines={2}
              >
                {item.title}
              </Text>

              <Text
                className="text-gray-600 text-sm mb-4 leading-5"
                numberOfLines={3}
              >
                {item.content}
              </Text>

              {/* 1. HIỂN THỊ ĐÁNH DẤU CÂU TRẢ LỜI HAY NHẤT NGAY NGOÀI LIST */}
              {item.bestAnswerId && (
                <View className="mb-2 bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                  <View className="flex-row items-center gap-1.5 mb-1.5">
                    <CheckCircle2 size={16} color="#10b981" />
                    <Text className="text-emerald-700 font-bold text-xs">
                      {/* Kiểm tra nếu là OBJ có nội dung content hay chỉ là ID */}
                      Câu trả lời hay nhất{" "}
                      {typeof item.bestAnswerId === "object" &&
                        item.bestAnswerId.author?.name
                        ? `- ${item.bestAnswerId.author.name}`
                        : ""}
                    </Text>
                  </View>
                  {typeof item.bestAnswerId === "object" &&
                    item.bestAnswerId.content && (
                      <Text
                        className="text-emerald-900 text-sm leading-5"
                        numberOfLines={2}
                      >
                        {item.bestAnswerId.content}
                      </Text>
                    )}
                </View>
              )}

              <View className="flex-row items-center justify-between border-t border-gray-50 pt-3">
                <View className="flex-row items-center gap-1.5">
                  <ThumbsUp size={14} color="#6B7280" />
                  <Text className="text-gray-500 text-xs font-bold">
                    {item.upvoteCount || 0} lượt thích
                  </Text>
                </View>
                <View className="bg-rose-50 px-2 py-1 rounded">
                  <Text className="text-rose-600 text-[11px] font-bold">
                    {item.answerCount || 0} Trả lời
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* MODAL TẠO CHỦ ĐỀ THẢO LUẬN MỚI */}
      <Modal
        visible={createModalVisible}
        animationType="fade"
        transparent={true}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
          }}
        >
          <View className="bg-white mx-4 rounded-2xl p-5 shadow-lg">
            <View className="flex-row justify-between items-center mb-4 border-b border-gray-100 pb-3">
              <Text className="font-bold text-lg text-gray-800">
                Tạo chủ đề thảo luận
              </Text>
              <TouchableOpacity
                onPress={() => setCreateModalVisible(false)}
                className="p-1"
              >
                <X size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text className="text-gray-700 font-bold mb-1 ml-1 text-sm">
              Tiêu đề
            </Text>
            <TextInput
              style={{
                fontSize: 15,
                backgroundColor: "#f9fafb",
                padding: 12,
                borderRadius: 10,
                marginBottom: 12,
                color: "#1f2937",
              }}
              placeholder="Mô tả gọn vấn đề bạn gặp phải..."
              value={newTitle}
              onChangeText={setNewTitle}
              placeholderTextColor="#9CA3AF"
            />

            <Text className="text-gray-700 font-bold mb-1 ml-1 text-sm">
              Chi tiết câu hỏi
            </Text>
            <TextInput
              style={{
                backgroundColor: "#f9fafb",
                height: 100,
                fontSize: 15,
                padding: 12,
                borderRadius: 10,
                color: "#4b5563",
              }}
              placeholder="Bạn hãy miêu tả rõ nhất về vấn đề để mọi người giúp đỡ..."
              value={newContent}
              onChangeText={setNewContent}
              multiline
              textAlignVertical="top"
              placeholderTextColor="#9CA3AF"
            />

            <TouchableOpacity
              activeOpacity={0.8}
              className={`mt-5 py-3.5 rounded-xl justify-center items-center ${!newTitle.trim() || !newContent.trim() ? "bg-rose-300" : "bg-rose-600"}`}
              onPress={handleCreateDiscussion}
              disabled={!newTitle.trim() || !newContent.trim()}
            >
              <Text
                style={{ color: "white", fontWeight: "bold", fontSize: 16 }}
              >
                Gửi câu hỏi
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Báo cáo */}
      <ReportModalMobile
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        type={reportType}
        targetId={reportTargetId}
        isEnrolled={canDiscuss}
      />

      {/* Modal Xác Nhận Xóa Thảo Luận */}
      <DeleteConfirmModal
        visible={deleteModalVisible}
        onClose={() => {
          if (!isDeleting) {
            setDeleteModalVisible(false);
            setDiscussionToDelete(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        title="Xóa bài thảo luận"
        message="Bạn có chắc chắn muốn xóa bài thảo luận này? Hành động này không thể hoàn tác."
        isDeleting={isDeleting}
      />

      {/* Modal Chi tiết */}
      <DiscussionModalMobile
        visible={!!selectedDiscussion}
        discussion={selectedDiscussion}
        onClose={() => setSelectedDiscussion(null)}
        user={user}
        isInstructor={user?.role === "instructor"}
        onRefreshParent={() =>
          dispatch(
            fetchDiscussions({ courseId, lectureId, page: 1, limit: 10 }),
          )
        }
        onReport={openReport}
      />
    </View>
  );
};
export default DiscussionMobile;
