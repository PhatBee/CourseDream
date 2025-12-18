import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { Star, Heart, ShoppingCart } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { addToWishlist, removeFromWishlist } from '../../features/wishlist/wishlistSlice';
import { addToCart, removeFromCart } from '../../features/cart/cartSlice';
import Toast from 'react-native-toast-message';

const CourseCardAllCourse = React.memo(({ course }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
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

  const isEnrolled = enrolledCourseIds.includes(_id);
  const isWishlisted = wishlistItems.some(item => item._id === _id);
  const inCart = cartItems.some(item => item.course._id === _id);
  const imageUrl = thumbnail?.url || thumbnail;
  const finalPrice = priceDiscount || price;
  const hasDiscount = priceDiscount && priceDiscount < price;

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return 'Free';
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
        {categories && categories[0] && (
          <View className="absolute top-2 left-2 bg-rose-500/90 px-2 py-0.5 rounded-full">
            <Text className="text-white text-[10px] font-medium" numberOfLines={1}>
              {categories[0].name}
            </Text>
          </View>
        ) || (
            <View className="absolute top-2 left-2 bg-rose-500/90 px-2 py-0.5 rounded-full">
              <Text className="text-white text-[10px] font-medium" numberOfLines={1}>
                General
              </Text>
            </View>
          )}
      </View>
      {/* Content */}
      <View className="p-3 flex-1">
        <Text className="text-gray-900 font-bold text-xs mb-1 leading-5" numberOfLines={2}>
          {title}
        </Text>
        <Text className="text-gray-500 text-[11px] mb-1" numberOfLines={1}>
          {instructor?.name || 'Unknown'}
        </Text>
        <View className="flex-row items-center mb-1">
          <Star size={10} color="#f59e0b" fill="#f59e0b" />
          <Text className="text-xs font-bold text-gray-700 ml-1">{rating ? rating.toFixed(1) : '0.0'}</Text>
          <Text className="text-[10px] text-gray-400 ml-1">({reviewCount || 0})</Text>
        </View>
        {/* Giá hoặc trạng thái đã ghi danh */}
        {isEnrolled ? (
          <View className="bg-emerald-50 px-2 py-1 rounded-lg items-center justify-center border border-emerald-100 mt-1">
            <Text className="text-emerald-600 font-bold text-[10px] uppercase tracking-wider">
              Đã ghi danh
            </Text>
          </View>
        ) : (
          <View className="flex-row items-center justify-between mt-1">
            <View>
              <Text className="text-rose-600 font-extrabold text-xs">
                {formatCurrency(finalPrice)}
              </Text>
              {hasDiscount && (
                <View className="flex-row items-center">
                  <Text className="text-gray-400 text-[10px] line-through mr-1">
                    {formatCurrency(price)}
                  </Text>
                  <View className="bg-rose-100 px-1 rounded">
                    <Text className="text-rose-600 text-[9px] font-bold">SALE</Text>
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
  );
});

export default CourseCardAllCourse;