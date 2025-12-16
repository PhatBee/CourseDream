import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Star, Heart, ShoppingCart, User } from 'lucide-react-native';
import { useDispatch } from 'react-redux';
// import { addToWishlist } from '../../features/wishlist/wishlistSlice'; // Bỏ comment khi có slice

const CourseCard = ({ course }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  // Destructuring an toàn với giá trị mặc định
  const {
    _id,
    title = 'Untitled Course',
    slug,
    thumbnail,
    instructor,
    rating = 0,
    reviewCount = 0,
    price = 0,
    priceDiscount,
    categories = []
  } = course || {}; // Thêm || {} để tránh crash nếu course null

  const categoryName = categories[0]?.name || 'General';
  const instructorName = instructor?.name || 'Instructor';
  
  // Logic hiển thị giá
  const displayPrice = priceDiscount || price;
  const hasDiscount = priceDiscount > 0 && priceDiscount < price;

  const formatPrice = (amount) => {
    if (amount === 0) return 'Free';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handlePress = () => {
    if (slug) {
      navigation.navigate('CourseDetail', { slug: slug, courseId: _id });
    }
  };

  const handleWishlist = () => {
    console.log('Toggle wishlist:', _id);
    // dispatch(addToWishlist(_id));
  };

  return (
    <TouchableOpacity 
      onPress={handlePress}
      activeOpacity={0.9}
      className="bg-white rounded-2xl mb-4 shadow-sm border border-gray-100 overflow-hidden w-full"
      style={{ elevation: 3 }} // Bóng đổ Android
    >
      {/* === 1. THUMBNAIL AREA === */}
      <View className="relative">
        <Image 
          source={{ uri: thumbnail || 'https://via.placeholder.com/300x200' }} 
          className="w-full h-40"
          resizeMode="cover"
        />
        
        {/* Category Badge */}
        <View className="absolute top-3 left-3 bg-rose-500/90 px-2.5 py-1 rounded-lg">
          <Text className="text-white text-[10px] font-bold uppercase tracking-wider">
            {categoryName}
          </Text>
        </View>

        {/* Wishlist Button */}
        <TouchableOpacity 
          onPress={handleWishlist}
          className="absolute top-3 right-3 bg-white/90 p-1.5 rounded-full shadow-sm active:bg-rose-50"
        >
          <Heart size={18} color="#e11d48" fill="transparent" /> 
        </TouchableOpacity>
      </View>

      {/* === 2. CONTENT AREA === */}
      <View className="p-3">
        
        {/* Title */}
        <Text 
          numberOfLines={2} 
          className="text-[15px] font-bold text-gray-800 mb-1 leading-5 h-10"
        >
          {title}
        </Text>

        {/* Instructor & Rating Row */}
        <View className="flex-row items-center justify-between mb-3">
          {/* Instructor */}
          <View className="flex-row items-center flex-1 mr-2">
            <User size={12} color="#6b7280" />
            <Text numberOfLines={1} className="text-xs text-gray-500 ml-1 font-medium">
              {instructorName}
            </Text>
          </View>
          
          {/* Rating Badge */}
          <View className="flex-row items-center bg-yellow-50 px-1.5 py-0.5 rounded-md border border-yellow-100">
            <Star size={10} color="#ca8a04" fill="#ca8a04" />
            <Text className="text-xs font-bold text-gray-700 ml-1">
              {rating.toFixed(1)}
            </Text>
            <Text className="text-[10px] text-gray-400 ml-0.5">
              ({reviewCount})
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View className="h-[1px] bg-gray-100 mb-3" />

        {/* Footer: Price & Cart Button */}
        <View className="flex-row items-center justify-between">
          {/* Price Section */}
          <View>
            <Text className="text-base font-extrabold text-rose-600">
              {formatPrice(displayPrice)}
            </Text>
            {hasDiscount && (
               <Text className="text-[10px] text-gray-400 line-through">
                 {formatPrice(price)}
               </Text>
            )}
          </View>

          {/* Add Cart Button */}
          <TouchableOpacity 
            className="bg-gray-900 w-9 h-9 rounded-full items-center justify-center active:bg-gray-700 shadow-sm"
          >
             <ShoppingCart size={16} color="white" />
          </TouchableOpacity>
        </View>

      </View>
    </TouchableOpacity>
  );
};

export default CourseCard;