import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import {
  Star,
  ThumbsUp,
  Trash2,
  MessageCircle,
  CheckCircle,
} from "lucide-react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  removeReview,
  toggleLike,
  replyToReview,
} from "../../features/review/reviewSlice";
import Toast from "react-native-toast-message";

const ReviewListMobile = ({ reviews = [], instructorId }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);

  const [replyScores, setReplyScores] = useState({});
  const [replyInput, setReplyInput] = useState({});

  const handleLike = (reviewId, reviewOwnerId) => {
    if (!currentUser)
      return Toast.show({ type: "error", text1: "Vui lòng đăng nhập!" });
    if (currentUser._id === reviewOwnerId)
      return Toast.show({
        type: "error",
        text1: "Bạn không thể like đánh giá này",
      });
    dispatch(toggleLike(reviewId));
  };

  const handleDelete = (reviewId) => {
    Alert.alert("Xoá đánh giá", "Bạn có chắc chắn muốn xóa?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () => {
          dispatch(removeReview(reviewId));
          Toast.show({ type: "success", text1: "Đã xóa đánh giá" });
        },
      },
    ]);
  };

  const handleToggleReply = (reviewId) => {
    setReplyScores((prev) => ({ ...prev, [reviewId]: !prev[reviewId] }));
  };

  const handleSubmitReply = async (reviewId) => {
    if (!replyInput[reviewId]?.trim()) return;
    try {
      await dispatch(
        replyToReview({ reviewId, comment: replyInput[reviewId] }),
      ).unwrap();
      Toast.show({ type: "success", text1: "Đã gửi phản hồi" });
      setReplyScores((prev) => ({ ...prev, [reviewId]: false }));
      setReplyInput((prev) => ({ ...prev, [reviewId]: "" }));
    } catch {
      Toast.show({ type: "error", text1: "Lỗi gửi phản hồi" });
    }
  };

  return (
    <View className="px-4 mb-4">
      <Text className="text-lg font-bold mb-4">Học viên phản hồi</Text>
      {reviews.length > 0 ? (
        reviews.map((review, idx) => {
          const isLiked = review.likedUsers?.includes(currentUser?._id);
          const isOwnerOrAdmin =
            currentUser?._id === review.student?._id ||
            currentUser?.role === "admin";
          const isInstructor =
            currentUser &&
            String(currentUser._id) ===
              String(
                typeof instructorId === "object"
                  ? instructorId?._id
                  : instructorId,
              );

          return (
            <View
              key={review._id || idx}
              className="mb-5 border-b border-gray-100 pb-4"
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <Image
                    source={
                      review.student?.avatar
                        ? { uri: review.student.avatar }
                        : require("../../../assets/images/default-avatar.jpg")
                    }
                    style={{ width: 40, height: 40, borderRadius: 20 }}
                  />
                  <View className="ml-3">
                    <Text className="font-semibold text-gray-900">
                      {review.student?.name || "Ẩn danh"}
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <CheckCircle size={12} color="#16a34a" />
                      <Text className="text-[10px] text-green-600 ml-1">
                        Đã mua khóa học
                      </Text>
                    </View>
                  </View>
                </View>

                {isOwnerOrAdmin && (
                  <TouchableOpacity
                    onPress={() => handleDelete(review._id)}
                    className="p-2"
                  >
                    <Trash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>

              <View className="flex-row items-center mb-2">
                <View className="flex-row mr-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <Star
                      key={num}
                      size={14}
                      color="#f59e0b"
                      fill={num <= review.rating ? "#f59e0b" : "transparent"}
                    />
                  ))}
                </View>
                <Text className="text-xs text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                </Text>
                {review.isEdited && (
                  <Text className="text-xs text-gray-400 italic ml-2">
                    (Đã sửa)
                  </Text>
                )}
              </View>

              <Text className="text-gray-800 leading-5 mb-3">
                {review.comment}
              </Text>

              {/* Actions */}
              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={() => handleLike(review._id, review.student?._id)}
                  className="flex-row items-center mr-6"
                >
                  <ThumbsUp size={16} color={isLiked ? "#f43f5e" : "#6b7280"} />
                  <Text
                    className={`text-xs ml-1 ${isLiked ? "text-rose-500 font-medium" : "text-gray-500"}`}
                  >
                    Hữu ích ({review.likesCount || 0})
                  </Text>
                </TouchableOpacity>

                {isInstructor && !review.instructorReply?.comment && (
                  <TouchableOpacity
                    onPress={() => handleToggleReply(review._id)}
                    className="flex-row items-center"
                  >
                    <MessageCircle size={16} color="#f43f5e" />
                    <Text className="text-xs ml-1 text-rose-500">Phản hồi</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Khung Instructor Reply Input */}
              {replyScores[review._id] && (
                <View className="mt-3 flex-row items-center border border-gray-200 rounded-lg bg-gray-50 p-1 pl-3">
                  <TextInput
                    className="flex-1 py-2 text-sm text-gray-800"
                    placeholder="Nhập phản hồi..."
                    value={replyInput[review._id]}
                    onChangeText={(text) =>
                      setReplyInput((prev) => ({ ...prev, [review._id]: text }))
                    }
                    multiline
                  />
                  <TouchableOpacity
                    onPress={() => handleSubmitReply(review._id)}
                    className="bg-rose-500 px-4 py-2 ml-2 rounded-md"
                  >
                    <Text className="text-white font-medium text-xs">Gửi</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Hiển thị phản hồi từ Giảng viên */}
              {review.instructorReply?.comment && (
                <View className="mt-4 bg-gray-50 p-3 rounded-lg border-l-4 border-rose-500 ml-4">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="font-semibold text-xs text-gray-800">
                      Phản hồi từ giảng viên
                    </Text>
                    <Text className="text-[10px] text-gray-500">
                      {new Date(
                        review.instructorReply.repliedAt,
                      ).toLocaleDateString("vi-VN")}
                    </Text>
                  </View>
                  <Text className="text-sm text-gray-600">
                    {review.instructorReply.comment}
                  </Text>
                </View>
              )}
            </View>
          );
        })
      ) : (
        <Text className="text-gray-500 italic">
          Chưa có đánh giá nào cho khóa học này.
        </Text>
      )}
    </View>
  );
};

export default ReviewListMobile;
