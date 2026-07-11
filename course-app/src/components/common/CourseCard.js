import React, { useState } from 'react';
import { Image } from 'expo-image';
import Toast from 'react-native-toast-message';

import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Star, Heart, ShoppingCart, RefreshCw } from 'lucide-react-native';
import { addToWishlist, removeFromWishlist } from '../../features/wishlist/wishlistSlice';
import { addToCart, removeFromCart } from '../../features/cart/cartSlice';
import { activateEnrollmentThunk } from '../../features/enrollment/enrollmentSlice';
import { useSelector, useDispatch } from 'react-redux';
import CourseExtensionModalMobile from '../course/CourseExtensionModalMobile';

// --- SUB-COMPONENT: Footer xử lý logic hiển thị Giá hoặc Nút Học ---
const CourseCardFooter = ({ isEnrolled, price, displayPrice, hasDiscount, formatPrice, onAddToCart, inCart, isActivated, isExpired, onActivate, onExtend }) => {

  // TRƯỜNG HỢP 1: Đã sở hữu khóa học
  if (isEnrolled) {
    if (isExpired) {
      return (
        <View className="flex-row items-center justify-between mt-2 gap-2">
          {/* Nhãn thông báo hết hạn màu Rose nhạt */}
          <View className="bg-rose-50 border border-rose-100 px-2 py-2 rounded-lg flex-1 items-center justify-center">
            <Text className="text-rose-600 font-extrabold text-[10px] uppercase tracking-wider">Hết hạn học</Text>
          </View>
          
          <TouchableOpacity
            onPress={onExtend}
            activeOpacity={0.8}
            className="bg-rose-500 border border-rose-600 px-2 py-2 rounded-lg flex-1 items-center justify-center flex-row active:bg-rose-600"
          >
            <RefreshCw size={10} color="white" style={{ marginRight: 4 }} />
            <Text className="text-white font-bold text-[10px] uppercase tracking-wider">Gia hạn</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (!isActivated) {
      return (
        <View className="mt-2">
          <TouchableOpacity
            onPress={onActivate}
            activeOpacity={0.8}
            className="bg-amber-500 px-3 py-2 rounded-lg items-center justify-center border border-amber-600 active:bg-amber-600"
          >
            <Text className="text-white font-bold text-xs uppercase tracking-wider">Kích hoạt khóa học</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View className="mt-2">
        <View className="bg-emerald-50 px-3 py-2 rounded-lg items-center justify-center border border-emerald-100">
          <Text className="text-emerald-600 font-bold text-xs uppercase tracking-wider">Đã đăng ký</Text>
        </View>
      </View>
    );
  }

  // TRƯỜNG HỢP 2: Chưa mua -> Hiện giá và nút giỏ hàng
  return (
    <View className="flex-row items-center justify-between mt-auto pt-2">
      <View>
        {price === 0 || displayPrice === 0 ? (
          <Text className="text-rose-600 font-extrabold text-xs">Miễn phí</Text>
        ) : (
          <Text className="text-rose-600 font-extrabold text-base">{formatPrice(displayPrice)}</Text>
        )}
        {hasDiscount && (
          <View className="flex-row items-center">
            <Text className="text-gray-400 text-xs line-through mr-1">{formatPrice(price)}</Text>
            <View className="bg-rose-100 px-1 rounded">
              <Text className="text-rose-600 text-[10px] font-bold">Giảm giá</Text>
            </View>
          </View>
        )}
      </View>
      {/* Nút giỏ hàng có thể xử lý logic AddToCart tại đây */}
      <TouchableOpacity
        onPress={onAddToCart}
        className="bg-gray-900 w-8 h-8 rounded-full items-center justify-center active:bg-gray-700"
      >
        <ShoppingCart size={14} color={inCart ? "#e11d48" : "white"} />
      </TouchableOpacity>
    </View>
  );
};

// --- MAIN COMPONENT ---
const CourseCard = ({ course }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  // Lấy danh sách ID đã mua và Wishlist từ Redux
  const { enrolledCourseIds } = useSelector(state => state.enrollment);
  const { items: wishlistItems } = useSelector(state => state.wishlist);
  const { items: cartItems } = useSelector(state => state.cart);

  const [isExtVisible, setIsExtVisible] = useState(false);

  if (!course) return null;

  const {
    _id,
    title,
    thumbnail,
    price,
    priceDiscount,
    rating,
    reviewCount,
    categories,
    instructor,
    slug
  } = course;

  const user = useSelector(state => state.auth.user);

  const categoryName = categories?.[0]?.name || 'General';



  const enrollmentInfo = useSelector((state) =>
    state.enrollment.items.find(item => item.course?._id === _id || item.course === _id)
  );

  // Logic kiểm tra trạng thái
  const isEnrolled = enrolledCourseIds.includes(_id) || !!course.isEnrolled;
  const isActivated = enrollmentInfo ? enrollmentInfo.isActivated : course.isActivated;
  const enrollmentId = enrollmentInfo ? enrollmentInfo._id : course.enrollmentId;
  const isExpired = enrollmentInfo?.endedAt
    ? new Date(enrollmentInfo.endedAt) < new Date()
    : course.endedAt
      ? new Date(course.endedAt) < new Date()
      : false;

  const handleActivate = () => {
    if (!enrollmentId) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không tìm thấy thông tin kích hoạt khóa học.',
        position: 'top',
      });
      return;
    }
    dispatch(activateEnrollmentThunk(enrollmentId))
      .unwrap()
      .then(() => {
        Toast.show({
          type: 'success',
          text1: 'Kích hoạt khóa học thành công!',
          position: 'top',
        });
      })
      .catch((err) => {
        Toast.show({
          type: 'error',
          text1: 'Kích hoạt khóa học thất bại',
          text2: err || 'Có lỗi xảy ra',
          position: 'top',
        });
      });
  };

  const isWishlisted = wishlistItems.some(item => item._id === _id);
  const inCart = cartItems.some(item => item.course._id === _id);

  // Formatting
  const imageUrl = thumbnail?.url || thumbnail;
  const finalPrice = priceDiscount !== undefined && priceDiscount !== null ? priceDiscount : price;
  const hasDiscount = priceDiscount !== undefined && priceDiscount !== null && priceDiscount < price;

  const formatCurrency = (amount) => {
    if (!amount || amount === 0 || isNaN(amount)) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Handlers
  const handlePress = () => {
    navigation.navigate('CourseDetail', { slug: slug, courseId: _id });
  };

  const handleToggleWishlist = () => {
    // Kiểm tra user đã login chưa

    if (!user) {
      // Chưa login, navigate to Login
      navigation.navigate('Login');
      return;
    }

    if (isWishlisted) {
      dispatch(removeFromWishlist(_id));
    } else {
      dispatch(addToWishlist(_id));
    }
  };

  const handleAddToCart = () => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }

    if (inCart) {
      dispatch(removeFromCart(_id)).then(() => {
        Toast.show({
          type: 'success',
          text1: 'Đã xóa khỏi giỏ hàng',
          position: 'top',
        });
      });
    } else {
      dispatch(addToCart(_id)).then(() => {
        Toast.show({
          type: 'success',
          text1: 'Đã thêm vào giỏ hàng',
          position: 'top',
        });
      });
    }
  };

  return (
    <>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
        className="w-60 bg-white rounded-2xl shadow-sm overflow-hidden mr-4 mb-2 border border-gray-100"
        style={{
          elevation: 3,
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Image Area */}
        <View className="relative w-full h-32 rounded-xl overflow-hidden bg-gray-100">
          <Image source={imageUrl}
            placeholder={require('../../../assets/images/default-course.jpg')}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover" />

          {/* Wishlist Heart Button */}
          <TouchableOpacity
            onPress={handleToggleWishlist}
            className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full shadow-sm"
          >
            {/* Đổi màu tim dựa trên trạng thái */}
            <Heart
              size={16}
              color={isWishlisted ? "#e11d48" : "#9ca3af"}
              fill={isWishlisted ? "#e11d48" : "transparent"}
            />
          </TouchableOpacity>

          {/* Category Badge */}
          <View className="absolute top-2 left-2 bg-rose-500/90 px-2 py-0.5 rounded-full">
            <Text className="text-white text-[10px] font-medium" numberOfLines={1}>{categoryName}</Text>
          </View>
        </View>

        {/* Content Area */}
        <View className="p-3 justify-between flex-1">
          <View>
            <Text className="text-gray-900 font-bold text-sm mb-1 leading-5 text-justify" numberOfLines={2}>{title}</Text>
            <Text className="text-gray-500 text-xs mb-2" numberOfLines={1}>{instructor?.name || 'Unknown'}</Text>

            {/* Rating */}
            <View className="flex-row items-center mb-1">
              <Star size={10} color="#f59e0b" fill="#f59e0b" />
              <Text className="text-xs font-bold text-gray-700 ml-1">{rating ? rating.toFixed(1) : '0.0'}</Text>
              <Text className="text-[10px] text-gray-400 ml-1">({reviewCount || 0})</Text>
            </View>
          </View>

          {/* Footer Component (Price or Enrolled Status) */}
          <CourseCardFooter
            isEnrolled={isEnrolled}
            price={price}
            displayPrice={finalPrice}
            hasDiscount={hasDiscount}
            formatPrice={formatCurrency}
            onAddToCart={handleAddToCart}
            inCart={inCart}
            isActivated={isActivated}
            isExpired={isExpired}
            onActivate={handleActivate}
            onExtend={() => setIsExtVisible(true)}
          />
        </View>
      </TouchableOpacity>
      <CourseExtensionModalMobile
        visible={isExtVisible}
        onClose={() => setIsExtVisible(false)}
        enrollment={enrollmentInfo}
      />
    </>
  );
};

export default CourseCard;