import React from 'react';
import { View, Text, Image } from 'react-native';
import { Star } from 'lucide-react-native';

const ReviewListMobile = ({ reviews = [] }) => (
  <View className="px-4 mb-4">
    <Text className="text-lg font-bold mb-2">Đánh giá</Text>
    {reviews.length > 0 ? (
      reviews.map((review, idx) => (
        <View key={review._id || idx} className="mb-3 flex-row items-start">
          <Image
            source={review.student?.avatar ? { uri: review.student.avatar } : require('../../../assets/images/default-avatar.jpg')}
            style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10 }}
          />
          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              <Text className="font-semibold">{review.student?.name || 'Ẩn danh'}</Text>
              <Star size={14} color="#f59e0b" fill="#f59e0b" className="ml-2" />
              <Text className="ml-1 text-xs text-gray-700">{review.rating}</Text>
            </View>
            <Text className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</Text>
            <Text className="text-gray-800 mt-1">{review.comment}</Text>
          </View>
        </View>
      ))
    ) : (
      <Text className="text-gray-500">Chưa có đánh giá.</Text>
    )}
  </View>
);

export default ReviewListMobile;