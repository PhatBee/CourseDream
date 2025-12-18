import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Star } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { addReview, fetchReviews, resetReviewState } from '../../features/review/reviewSlice';
import Toast from 'react-native-toast-message';

const ReviewFormMobile = ({ courseId }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.review);

  const handleSubmit = async () => {
    if (!rating || !comment.trim()) {
      Toast.show({ type: 'error', text1: 'Vui lòng nhập đủ thông tin' });
      return;
    }
    await dispatch(addReview({ courseId, rating, comment }));
    await dispatch(fetchReviews(courseId)); // Cập nhật lại ReviewList ngay
    setComment('');
    dispatch(resetReviewState());
    Toast.show({ type: 'success', text1: 'Đánh giá thành công!' });
  };

  return (
    <View className="px-4 mb-4">
      <Text className="text-lg font-bold mb-2">Đánh giá khóa học</Text>
      <View className="flex-row items-center mb-2">
        {[1, 2, 3, 4, 5].map(num => (
          <TouchableOpacity key={num} onPress={() => setRating(num)}>
            <Star size={22} color={num <= rating ? "#f59e0b" : "#e5e7eb"} fill={num <= rating ? "#f59e0b" : "transparent"} />
          </TouchableOpacity>
        ))}
        <Text className="ml-2 text-gray-700">{rating} sao</Text>
      </View>
      <TextInput
        className="border border-gray-300 rounded-lg px-3 py-2 mb-2 bg-white"
        placeholder="Nhận xét của bạn"
        value={comment}
        onChangeText={setComment}
        multiline
        numberOfLines={3}
        style={{ minHeight: 60, textAlignVertical: 'top' }}
        returnKeyType="done"
      />
      {error && <Text className="text-red-500 mb-2">{error}</Text>}
      <TouchableOpacity
        className="bg-rose-500 py-3 rounded-lg"
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-center font-bold">Gửi đánh giá</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default ReviewFormMobile;