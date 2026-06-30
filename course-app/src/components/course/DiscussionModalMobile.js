import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Image,
} from "react-native";
import { useDispatch } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  X,
  Send,
  ThumbsUp,
  MoreVertical,
  CheckCircle2,
  MessageCircle,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import { replyDiscussion } from "../../features/discussion/discussionSlice";
import discussionApi from "../../api/discussionApi";
import { useRoute } from "@react-navigation/native";

const DiscussionModalMobile = ({
  visible,
  discussion,
  onClose,
  user,
  isInstructor,
  onRefreshParent,
  onReport,
}) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const route = useRoute();
  const listRef = useRef(null);
  const [highlightedReply, setHighlightedReply] = useState(null);

  const [localDiscussion, setLocalDiscussion] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replyInput, setReplyInput] = useState("");
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    // Lắng nghe chuẩn để bù trừ thanh điều hướng dưới đáy
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const keyboardShowListener = Keyboard.addListener(showEvent, () =>
      setKeyboardVisible(true),
    );
    const keyboardHideListener = Keyboard.addListener(hideEvent, () =>
      setKeyboardVisible(false),
    );

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (visible && discussion) {
      setLocalDiscussion(discussion);
      setReplies([]);
      setPage(1);
      setHasMore(true);
      fetchReplies(1);
      fetchDiscussionDetail(discussion._id);
    }
  }, [visible, discussion]);

  useEffect(() => {
    // Focus Reply trong Modal khi được mở (xử lý cả trường hợp reply ở trang khác)
    const { replyId } = route.params || {};

    if (replyId && replies.length > 0 && visible) {
      const idx = replies.findIndex((r) => r._id === replyId);

      if (idx !== -1) {
        // TÌM THẤY -> Highlight và Cuộn
        setHighlightedReply(replyId);

        // Hẹn giờ để đảm bảo Modal và giao diện FlatList đã bung ra hoàn toàn
        setTimeout(() => {
          if (listRef.current) {
            listRef.current.scrollToIndex({
              index: idx,
              animated: true,
              viewPosition: 0.5,
            });
          }
        }, 600); // cần timeout xíu do Flatlist cần render dữ liệu trước

        // Tắt viền đỏ sau 3 giây
        const timeoutId = setTimeout(() => setHighlightedReply(null), 3000);
        return () => clearTimeout(timeoutId);
      } else {
        // CHƯA TÌM THẤY -> Nếu còn trang tiếp theo thì tự động tải thêm
        if (hasMore && !loadingReplies) {
          fetchReplies(page + 1);
        }
      }
    }
  }, [route.params?.replyId, replies, visible, hasMore, loadingReplies, page]);

  const fetchDiscussionDetail = async (id) => {
    try {
      const res = await discussionApi.getDiscussionById(id);
      const detail = res.data?.data || res.data;
      if (detail) setLocalDiscussion(detail);
    } catch (e) {
      console.log(e);
    }
  };

  const fetchReplies = async (pageNumber) => {
    if (!discussion?._id) return;
    try {
      setLoadingReplies(true);
      const res = await discussionApi.getDiscussionReplies(
        discussion._id,
        pageNumber,
        5,
      );
      const newReplies =
        res.data?.data?.replies || res.data?.replies || res?.replies || [];

      if (pageNumber === 1) {
        setReplies(newReplies);
      } else {
        // Lọc để tránh tuyệt đối việc trùng _id nếu gọi API liên tục
        setReplies((prev) => {
          const existingIds = new Set(prev.map((item) => item._id));
          const uniqueNewReplies = newReplies.filter(
            (item) => !existingIds.has(item._id),
          );
          return [...prev, ...uniqueNewReplies];
        });
      }

      // QUAN TRỌNG: Cập nhật lại trang hiện tại sau khi có data thành công
      setPage(pageNumber);
      setHasMore(newReplies.length === 5);
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingReplies(false);
    }
  };

  const handlePostReply = async () => {
    if (!replyInput.trim()) return;
    setSending(true);
    try {
      await dispatch(
        replyDiscussion({ discussionId: discussion._id, content: replyInput }),
      ).unwrap();

      setReplyInput("");
      Keyboard.dismiss();
      fetchReplies(1);
      fetchDiscussionDetail(discussion._id);

      if (onRefreshParent) onRefreshParent();
    } catch (err) {
      Toast.show({ type: "error", text1: "Lỗi gửi câu trả lời" });
    } finally {
      setSending(false);
    }
  };

  const handleVoteLocalDiscussion = async () => {
    try {
      await discussionApi.voteDiscussion(localDiscussion._id, "DISCUSSION");
      await fetchDiscussionDetail(localDiscussion._id);
      if (onRefreshParent) onRefreshParent();
    } catch (error) {
      Toast.show({ type: "error", text1: "Lỗi thao tác Like" });
    }
  };

  const handleVoteReply = async (replyId) => {
    try {
      await discussionApi.voteDiscussion(
        localDiscussion._id,
        "ANSWER",
        replyId,
      );
      fetchReplies(1);
    } catch (error) {
      Toast.show({ type: "error", text1: "Lỗi tương tác" });
    }
  };

  const handleMarkBestAnswer = async (replyId) => {
    try {
      await discussionApi.markBestAnswer(localDiscussion._id, replyId);
      fetchReplies(1);
      fetchDiscussionDetail(localDiscussion._id);
      if (onRefreshParent) onRefreshParent();
      Toast.show({
        type: "success",
        text1: "Đã đánh dấu câu trả lời hay nhất!",
      });
    } catch (error) {
      Toast.show({ type: "error", text1: "Không có quyền thực hiện" });
    }
  };

  if (!localDiscussion) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "#f8fafc" }}
        behavior="padding"
      >
        <View
          style={{ paddingTop: Math.max(insets.top, 16) }}
          className="bg-white border-b border-gray-200"
        >
          <View className="flex-row items-center justify-between p-4">
            <Text className="font-bold text-lg text-gray-800" numberOfLines={1}>
              Chi tiết Thảo luận
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="p-2 bg-gray-100 rounded-full"
            >
              <X size={20} color="#4b5563" />
            </TouchableOpacity>
          </View>
        </View>



        <FlatList
          ref={listRef}
          data={replies}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item) => item._id}
          keyboardShouldPersistTaps="handled"
          onScrollToIndexFailed={(info) => {
            const wait = new Promise((resolve) => setTimeout(resolve, 500));
            wait.then(() => {
              listRef.current?.scrollToIndex({
                index: info.index,
                animated: true,
              });
            });
          }}
          ListHeaderComponent={
            <View className="p-4 bg-white mb-2 shadow-sm border-b border-gray-100">
              <View className="flex-row justify-between mb-3">
                <View className="flex-row gap-2 flex-1 items-center">
                  <Image
                    source={
                      localDiscussion.author?.avatar?.url
                        ? { uri: localDiscussion.author.avatar.url }
                        : localDiscussion.author?.avatar
                          ? { uri: localDiscussion.author.avatar }
                          : require("../../../assets/images/default-avatar.jpg")
                    }
                    style={{ width: 32, height: 32, borderRadius: 16 }}
                  />
                  <Text className="text-sm font-semibold text-gray-600">
                    {localDiscussion.author?.name}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => onReport(localDiscussion._id, "discussion")}
                  className="p-2 -mr-2"
                >
                  <MoreVertical size={20} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              <Text className="font-bold text-lg text-gray-900 mb-2">
                {localDiscussion.title}
              </Text>
              <Text className="text-gray-700 leading-6 mb-4">
                {localDiscussion.content}
              </Text>

              <View className="flex-row items-center justify-between border-t border-gray-100 pt-3">
                <TouchableOpacity
                  className="flex-row items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100"
                  onPress={handleVoteLocalDiscussion}
                >
                  <ThumbsUp
                    size={16}
                    color={
                      localDiscussion.upvotedBy?.includes(user?._id)
                        ? "#3b82f6"
                        : "#6b7280"
                    }
                  />
                  <Text className="text-sm font-semibold text-gray-600">
                    {localDiscussion.upvoteCount || 0}
                  </Text>
                </TouchableOpacity>
                <View className="flex-row items-center gap-1">
                  <MessageCircle size={16} color="#6b7280" />
                  <Text className="text-gray-500 text-sm">
                    {localDiscussion.answerCount} câu trả lời
                  </Text>
                </View>
              </View>
            </View>
          }

          renderItem={({ item }) => {
            const isHighlighted = item._id === highlightedReply;
            return (
              <View
                className={`p-4 border-b border-gray-50 ml-4 border-l-2 ${
                  isHighlighted
                    ? "bg-rose-50 border-l-rose-400"
                    : item.isBestAnswer
                      ? "bg-green-50/20 border-l-green-500"
                      : "bg-white border-l-gray-200"
                }`}
                // THÊM DÒNG MÀU DƯỚI ĐÂY ĐỂ ĐẢM BẢO CHẮC CHẮN MÀU ĐỎ ĐƯỢC ƯU TIÊN
                style={
                  isHighlighted
                    ? { backgroundColor: "#fff1f2", borderLeftColor: "#fb7185" }
                    : {}
                }
              >
                {item.isBestAnswer && (
                  <View className="flex-row items-center gap-1 mb-2 bg-green-50 self-start px-2 py-1 rounded">
                    <CheckCircle2 size={14} color="#10b981" />
                    <Text className="text-green-700 text-xs font-bold">
                      Câu trả lời hay nhất
                    </Text>
                  </View>
                )}
                <View className="flex-row justify-between mb-2">
                  <View className="flex-row items-center gap-2">
                    <Image
                      source={
                        item.author?.avatar?.url
                          ? { uri: item.author.avatar.url }
                          : item.author?.avatar
                            ? { uri: item.author.avatar }
                            : require("../../../assets/images/default-avatar.jpg")
                      }
                      style={{ width: 28, height: 28, borderRadius: 14 }}
                    />
                    <Text className="font-bold text-gray-800 text-sm">
                      {item.author?.name}
                    </Text>
                  </View>

                  {user?._id && item.author?._id !== user._id && (
                    <TouchableOpacity
                      onPress={() => onReport(item._id, "reply")}
                      className="p-1"
                    >
                      <MoreVertical size={16} color="#9ca3af" />
                    </TouchableOpacity>
                  )}
                </View>

                <Text className="text-gray-700 text-[15px] mb-3 leading-5 ml-9">
                  {item.content}
                </Text>

                <View className="flex-row items-center gap-4 ml-9">
                  <TouchableOpacity
                    onPress={() => handleVoteReply(item._id)}
                    className="flex-row items-center gap-1"
                  >
                    <ThumbsUp
                      size={14}
                      color={
                        item.upvotedBy?.includes(user?._id)
                          ? "#3b82f6"
                          : "#9ca3af"
                      }
                    />
                    <Text className="text-gray-500 text-xs font-bold">
                      {item.upvoteCount || 0}
                    </Text>
                  </TouchableOpacity>

                  {(isInstructor ||
                    user?._id === localDiscussion.author?._id) && (
                      <TouchableOpacity
                        onPress={() => handleMarkBestAnswer(item._id)}
                      >
                        <Text className={`${item.isBestAnswer ? "text-gray-500" : "text-green-600"} text-xs font-semibold`}>
                          {item.isBestAnswer ? "Bỏ đánh dấu hay nhất" : "Đánh dấu hay nhất"}
                        </Text>
                      </TouchableOpacity>
                    )}
                </View>
              </View>
            );
          }}
          onEndReached={() =>
            hasMore && !loadingReplies && fetchReplies(page + 1)
          }
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingReplies ? (
              <ActivityIndicator className="my-4" color="#e11d48" />
            ) : null
          }
        />

        <View
          style={{
            // Khi tắt gõ phím -> Cộng thanh nav bar Android vào để tránh lấp viền dưới màn hình.
            // Khi mở gõ phím -> Ép sát 12 pixel cho đẹp.
            paddingBottom: isKeyboardVisible ? 12 : Math.max(insets.bottom, 12),
          }}
          className="p-3 bg-white border-t border-gray-200 flex-row items-end shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
        >
          <TextInput
            className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-gray-800 mr-2 max-h-32"
            placeholder="Viết câu trả lời..."
            multiline
            value={replyInput}
            onChangeText={setReplyInput}
          />
          <TouchableOpacity
            className={`w-11 h-11 mb-0.5 rounded-full items-center justify-center ${
              replyInput.trim() ? "bg-rose-500" : "bg-gray-300"
            }`}
            disabled={!replyInput.trim() || sending}
            onPress={handlePostReply}
          >
            {sending ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Send size={18} color="#FFF" style={{ marginLeft: -2 }} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default DiscussionModalMobile;
