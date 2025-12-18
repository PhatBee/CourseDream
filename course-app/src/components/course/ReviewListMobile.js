import React from 'react';
import { View, Text } from 'react-native';

const ReviewListMobile = ({ reviews = [] }) => (
  <View className="px-4 mb-4">
    <Text className="text-lg font-bold mb-2">Đánh giá</Text>
    {reviews.length > 0 ? (
      reviews.map((review, idx) => (
        <View key={review._id || idx} className="mb-2">
          <Text className="font-semibold">{review.student?.name || 'Ẩn danh'}</Text>
          <Text className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</Text>
          <Text className="text-gray-800">{review.content}</Text>
        </View>
      ))
    ) : (
      <Text className="text-gray-500">Chưa có đánh giá.</Text>
    )}
  </View>
);

export default ReviewListMobile;