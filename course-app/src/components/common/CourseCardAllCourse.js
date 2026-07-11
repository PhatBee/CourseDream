import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { Star, Heart, ShoppingCart, RefreshCw } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { addToWishlist, removeFromWishlist } from '../../features/wishlist/wishlistSlice';
import { addToCart, removeFromCart } from '../../features/cart/cartSlice';
import { activateEnrollmentThunk } from '../../features/enrollment/enrollmentSlice';
import Toast from 'react-native-toast-message';
import CourseExtensionModalMobile from '../course/CourseExtensionModalMobile';

const CourseCardAllCourse = React.memo(({ course }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [isExtVisible, setIsExtVisible] = useState(false);
  const { enrolledCourseIds } = useSelector(state => state.enrollment);
  const { items: wishlistItems } = useSelector(state => state.wishlist);
  const { items: cartItems } = useSelector(state => state.cart);
  const user = useSelector(state => state.auth.user);

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

  const categoryName = categories?.[0]?.name || 'General';

  const enrollmentInfo = useSelector((state) => 
    state.enrollment.items.find(item => item.course?._id === _id || item.course === _id)
  );

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
  const imageUrl = thumbnail?.url || thumbnail;
  const finalPrice = priceDiscount !== undefined && priceDiscount !== null ? priceDiscount : price;
  const hasDiscount = priceDiscount !== undefined && priceDiscount !== null && priceDiscount < price;

  const formatCurrency = (amount) => {
    if (!amount || amount === 0 || isNaN(amount)) return "Miễn phí";
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handlePress = useCallback(() => {
    navigation.navigate('CourseDetail', { slug, courseId: _id });
  }, [navigation, slug, _id]);

  const handleToggleWishlist = useCallback(() => {
    if (!user) return navigation.navigate('Login');
    if (isWishlisted) dispatch(removeFromWishlist(_id));
    else dispatch(addToWishlist(_id));
  }, [user, isWishlisted, dispatch, navigation, _id]);

  const handleCart = useCallback(() => {
    if (!user) return navigation.navigate('Login');
    if (inCart) {
      dispatch(removeFromCart(_id)).then(() => {
        Toast.show({ type: 'success', text1: 'Đã xóa khỏi giỏ hàng', position: 'top' });
      });
    } else {
      dispatch(addToCart(_id)).then(() => {
        Toast.show({ type: 'success', text1: 'Đã thêm vào giỏ hàng', position: 'top' });
      });
    }
  }, [user, inCart, dispatch, navigation, _id]);

  return (
    <>
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.9}
      className="w-[48%] bg-white rounded-2xl shadow-sm mb-3 mr-2 overflow-hidden border border-gray-100"
    >
      {/* Image */}
      <View className="relative w-full aspect-[1.5] rounded-xl overflow-hidden bg-gray-100">
        <Image
          source={imageUrl}
          placeholder={require('../../../assets/images/default-course.jpg')}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />
        {/* Wishlist Heart Button */}
        <TouchableOpacity
          onPress={handleToggleWishlist}
          className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full shadow-sm"
        >
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
      {/* Content */}
      <View className="p-3 flex-1">
        <Text className="text-gray-900 font-bold text-xs mb-1 leading-5 text-justify" numberOfLines={2}>{title}</Text>
        <Text className="text-gray-500 text-[11px] mb-1" numberOfLines={1}>{instructor?.name || 'Unknown'}</Text>
        <View className="flex-row items-center mb-1">
          <Star size={10} color="#f59e0b" fill="#f59e0b" />
          <Text className="text-xs font-bold text-gray-700 ml-1">{rating ? rating.toFixed(1) : '0.0'}</Text>
          <Text className="text-[10px] text-gray-400 ml-1">({reviewCount || 0})</Text>
        </View>
        {/* Giá hoặc trạng thái đã ghi danh */}
        {isEnrolled ? (
          isExpired ? (
            <TouchableOpacity
                onPress={() => setIsExtVisible(true)}
                activeOpacity={0.8}
                className="bg-red-500 px-2 py-1.5 rounded-lg items-center justify-center border border-red-600 mt-1 active:bg-red-600 flex-row"
              >
                <RefreshCw size={10} color="white" style={{ marginRight: 3 }} />
                <Text className="text-white font-bold text-[10px] uppercase tracking-wider">Gia hạn học</Text>
            </TouchableOpacity>
          ) : !isActivated ? (
            <TouchableOpacity
              onPress={handleActivate}
              activeOpacity={0.8}
              className="bg-amber-500 px-2 py-1 rounded-lg items-center justify-center border border-amber-600 mt-1 active:bg-amber-600"
            >
              <Text className="text-white font-bold text-[10px] uppercase tracking-wider">Kích hoạt khóa học</Text>
            </TouchableOpacity>
          ) : (
            <View className="bg-emerald-50 px-2 py-1 rounded-lg items-center justify-center border border-emerald-100 mt-1">
              <Text className="text-emerald-600 font-bold text-[10px] uppercase tracking-wider">Đã ghi danh</Text>
            </View>
          )
        ) : (
          <View className="flex-row items-center justify-between mt-1">
            <View>
              {finalPrice === 0 || price === 0 ? (
                <Text className="text-rose-600 font-extrabold text-xs">Miễn phí</Text>
              ) : (
                <Text className="text-rose-600 font-extrabold text-xs">{formatCurrency(finalPrice)}</Text>
              )}
              {hasDiscount && (
                <View className="flex-row items-center">
                  <Text className="text-gray-400 text-[10px] line-through mr-1">{formatCurrency(price)}</Text>
                  <View className="bg-rose-100 px-1 rounded">
                    <Text className="text-rose-600 text-[9px] font-bold">Giảm giá</Text>
                  </View>
                </View>
              )}
            </View>
            <TouchableOpacity
              className="bg-gray-900 w-7 h-7 rounded-full items-center justify-center active:bg-gray-700"
              onPress={handleCart}
            >
              <ShoppingCart size={13} color={inCart ? "#e11d48" : "white"} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
    <CourseExtensionModalMobile
      visible={isExtVisible}
      onClose={() => setIsExtVisible(false)}
      enrollment={enrollmentInfo}
    />
    </>
  );
});

export default CourseCardAllCourse;