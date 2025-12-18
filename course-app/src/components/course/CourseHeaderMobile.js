import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Star } from 'lucide-react-native';

const formatCurrency = (amount) => {
  if (!amount || amount === 0) return 'Free';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const getImageSource = (thumbnail) => {
  if (!thumbnail || (typeof thumbnail === 'string' && thumbnail.trim() === '')) {
    return require('../../../assets/images/default-course.jpg');
  }
  if (typeof thumbnail === 'string') return { uri: thumbnail };
  if (typeof thumbnail === 'object' && thumbnail.url) return { uri: thumbnail.url };
  return require('../../../assets/images/default-course.jpg');
};

const CourseHeaderMobile = ({ course, isEnrolled, reviewCount }) => {
  const instructor = course.instructor || {};
  const categoryName = course.categories?.[0]?.name || 'Course';

  return (
    <View>
      <Image
        source={getImageSource(course.thumbnail)}
        style={{ width: '100%', height: 200 }}
        resizeMode="cover"
      />
      <View className="p-4">
        <Text className="text-xl font-bold text-gray-900 mb-2">{course.title}</Text>
        <Text className="text-gray-600 mb-2">{course.shortDescription}</Text>
        <View className="flex-row items-center mb-2">
          <Star size={16} color="#f59e0b" fill="#f59e0b" />
          <Text className="ml-1 font-bold">{course.rating?.toFixed(1) || '0.0'}</Text>
          <Text className="ml-2 text-gray-500">({reviewCount || 0} đánh giá)</Text>
        </View>
        <View className="flex-row items-center mb-2">
          <Image
            source={instructor.avatar ? { uri: instructor.avatar } : require('../../../assets/images/default-avatar.jpg')}
            style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8 }}
          />
          <Text className="font-semibold">{instructor.name || 'Giảng viên'}</Text>
        </View>
        <Text className="text-xs text-gray-500 mb-2">{categoryName}</Text>
        <View className="flex-row items-end mb-2">
          <Text className="text-rose-600 font-bold text-2xl">{formatCurrency(course.priceDiscount || course.price)}</Text>
          {course.priceDiscount && course.priceDiscount < course.price && (
            <Text className="text-gray-400 text-base line-through ml-2">{formatCurrency(course.price)}</Text>
          )}
        </View>
        {!isEnrolled ? (
          <TouchableOpacity className="bg-rose-500 py-3 rounded-lg mb-2">
            <Text className="text-white text-center font-bold">Mua khóa học</Text>
          </TouchableOpacity>
        ) : (
          <View className="bg-emerald-50 px-3 py-2 rounded-lg items-center justify-center border border-emerald-100 mb-2">
            <Text className="text-emerald-600 font-bold text-xs uppercase tracking-wider">
              Đã ghi danh
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default CourseHeaderMobile;