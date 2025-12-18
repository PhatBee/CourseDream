import React from 'react';
import { Image } from 'expo-image';
import Toast from 'react-native-toast-message';

import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Star, Heart, ShoppingCart } from 'lucide-react-native';
import { addToWishlist, removeFromWishlist } from '../../features/wishlist/wishlistSlice';
import { addToCart, removeFromCart } from '../../features/cart/cartSlice';
import { useSelector, useDispatch } from 'react-redux';

// --- SUB-COMPONENT: Footer xử lý logic hiển thị Giá hoặc Nút Học ---
const CourseCardFooter = ({ isEnrolled, price, displayPrice, hasDiscount, formatPrice, onAddToCart, inCart }) => {
  if (!price) price = 0;
  if (!displayPrice) displayPrice = 0;
  // TRƯỜNG HỢP 1: Đã sở hữu khóa học
  if (isEnrolled) {
    return (
      <View className="mt-2">
        <View className="bg-emerald-50 px-3 py-2 rounded-lg items-center justify-center border border-emerald-100">
          <Text className="text-emerald-600 font-bold text-xs uppercase tracking-wider">
            Already Enrolled
          </Text>
        </View>
      </View>
    );
  }

  // TRƯỜNG HỢP 2: Chưa mua -> Hiện giá và nút giỏ hàng
  return (
    <View className="flex-row items-center justify-between mt-auto pt-2">
      <View>
        <Text className="text-rose-600 font-extrabold text-base">
          {formatPrice(displayPrice)}
        </Text>
        {hasDiscount && (
          <View className="flex-row items-center">
            <Text className="text-gray-400 text-xs line-through mr-1">
              {formatPrice(price)}
            </Text>
            <View className="bg-rose-100 px-1 rounded">
              <Text className="text-rose-600 text-[10px] font-bold">SALE</Text>
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



  // Logic kiểm tra trạng thái
  const isEnrolled = enrolledCourseIds.includes(_id);
  const isWishlisted = wishlistItems.some(item => item._id === _id);
  const inCart = cartItems.some(item => item.course._id === _id);

  // Formatting
  const imageUrl = thumbnail?.url || thumbnail;
  const finalPrice = priceDiscount || price;
  const hasDiscount = priceDiscount && priceDiscount < price;

  const formatCurrency = (amount) => {
    if (amount === 0) return 'Free';
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
          <Text className="text-white text-[10px] font-medium" numberOfLines={1}>
            {categoryName}
          </Text>
        </View>
      </View>

      {/* Content Area */}
      <View className="p-3 justify-between flex-1">
        <View>
          <Text className="text-gray-900 font-bold text-sm mb-1 leading-5" numberOfLines={2}>
            {title}
          </Text>
          <Text className="text-gray-500 text-xs mb-2" numberOfLines={1}>
            {instructor?.name || 'Unknown'}
          </Text>

          {/* Rating */}
          <View className="flex-row items-center mb-1">
            <Star size={10} color="#f59e0b" fill="#f59e0b" />
            <Text className="text-xs font-bold text-gray-700 ml-1">{rating ? rating.toFixed(1) : '0.0'}</Text>
            <Text className="text-[10px] text-gray-400 ml-1">({reviewCount ? reviewCount : 0})</Text>
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
          inCart={inCart} // <-- THÊM DÒNG NÀY
        />

      </View>
    </TouchableOpacity>
  );
};

export default CourseCard;