import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Share } from 'react-native';
import { Star, Heart, ShoppingCart, Share2, Flag } from 'lucide-react-native';
import { useSelector, useDispatch } from 'react-redux';
import { addToCart, removeFromCart } from '../../features/cart/cartSlice';
import { addToWishlist, removeFromWishlist } from '../../features/wishlist/wishlistSlice';
import Toast from 'react-native-toast-message';
import ReportModalMobile from '../common/ReportModalMobile';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';

const formatCurrency = (amount) => {
  if (!amount || amount === 0) return 'Free';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const CourseHeaderMobile = ({ course, isEnrolled, reviewCount }) => {
  const instructor = course.instructor || {};
  const categoryName = course.categories?.[0]?.name || 'Course';
  const user = useSelector(state => state.auth.user);
  const { items: wishlistItems } = useSelector(state => state.wishlist);
  const { items: cartItems } = useSelector(state => state.cart);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [reportVisible, setReportVisible] = useState(false);

  const isWishlisted = wishlistItems.some(item => item._id === course._id);
  const inCart = cartItems.some(item => item.course._id === course._id);
  const userId = user?._id;
  const instructorId = typeof instructor === "object" ? instructor._id : instructor;

  const handleAddToCart = () => {
    if (!user) {
      Toast.show({ type: 'info', text1: 'Vui lòng đăng nhập để thêm vào giỏ hàng' });
      return;
    }
    if (inCart) {
      dispatch(removeFromCart(course._id));
      Toast.show({ type: 'success', text1: 'Đã xóa khỏi giỏ hàng' });
    } else {
      dispatch(addToCart(course._id));
      Toast.show({ type: 'success', text1: 'Đã thêm vào giỏ hàng' });
    }
  };

  const handleWishlist = () => {
    if (!user) {
      Toast.show({ type: 'info', text1: 'Vui lòng đăng nhập để thêm vào wishlist' });
      return;
    }
    if (isWishlisted) dispatch(removeFromWishlist(course._id));
    else dispatch(addToWishlist(course._id));
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Khóa học: ${course.title}\n${window?.location?.href || ''}`,
      });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Không thể chia sẻ' });
    }
  };

  const getCourseImageSource = (thumbnail) => {
    if (!thumbnail || (typeof thumbnail === 'string' && thumbnail.trim() === '')) {
      return require('../../../assets/images/default-course.jpg');
    }
    if (typeof thumbnail === 'string') return { uri: thumbnail };
    if (typeof thumbnail === 'object' && thumbnail.url) return { uri: thumbnail.url };
    return require('../../../assets/images/default-course.jpg');
  };

  return (
    <View>
      <Image
        source={getCourseImageSource(course.thumbnail)}
        placeholder={require('../../../assets/images/default-course.jpg')}
        style={{ width: '100%', height: 200 }}
        contentFit="cover"
        transition={500}
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
          <>
            <TouchableOpacity className="bg-rose-500 py-3 rounded-lg mb-2" onPress={handleAddToCart}>
              <Text className="text-white text-center font-bold">{inCart ? 'Đã trong giỏ hàng' : 'Thêm vào giỏ hàng'}</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-blue-500 py-3 rounded-lg mb-2" onPress={() => Toast.show({ type: 'info', text1: 'Chức năng ghi danh sẽ bổ sung!' })}>
              <Text className="text-white text-center font-bold">Ghi danh ngay</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            className="bg-rose-500 px-3 py-3 rounded-lg items-center justify-center mb-2"
            onPress={() => navigation.navigate('Learning', { slug: course.slug })}
          >
            <Text className="text-white font-bold text-base">Go to Course</Text>
          </TouchableOpacity>
        )}
        <View className="flex-row gap-3 mt-2">
          <TouchableOpacity onPress={handleWishlist} className="bg-gray-100 p-2 rounded-full">
            <Heart size={18} color={isWishlisted ? "#e11d48" : "#9ca3af"} fill={isWishlisted ? "#e11d48" : "transparent"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} className="bg-gray-100 p-2 rounded-full">
            <Share2 size={18} color="#2563eb" />
          </TouchableOpacity>
          {/* Nút báo cáo khóa học: chỉ hiện nếu không phải instructor */}
          {userId && instructorId && userId !== String(instructorId) && (
            <TouchableOpacity
              onPress={() => setReportVisible(true)}
              className="bg-gray-100 p-2 rounded-full"
              accessibilityLabel="Báo cáo khóa học"
            >
              <Flag size={18} color="#e11d48" />
            </TouchableOpacity>
          )}
        </View>
        <ReportModalMobile
          visible={reportVisible}
          onClose={() => setReportVisible(false)}
          type="course"
          targetId={course._id}
        />
      </View>
    </View>
  );
};

export default CourseHeaderMobile;