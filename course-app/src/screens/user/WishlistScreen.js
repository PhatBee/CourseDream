import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Trash2, Heart, ShoppingCart, CheckCircle } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getWishlist, removeFromWishlist, clearWishlist } from '../../features/wishlist/wishlistSlice';
import { addToCart, removeFromCart, getCart } from '../../features/cart/cartSlice';
import { Image } from 'expo-image';
import Toast from 'react-native-toast-message';

const WishlistScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const nav = useNavigation();

  const { items: wishlist, isLoading: wishlistLoading } = useSelector(state => state.wishlist);
  const { items: cartItems, isLoading: cartLoading } = useSelector(state => state.cart);
  const { user } = useSelector(state => state.auth);

  // Tập hợp courseId đang có trong giỏ hàng (để đồng bộ từ database)
  const cartCourseIds = new Set(
    (cartItems || []).map(item => item.course?._id || item.course)
  );

  useFocusEffect(
    useCallback(() => {
      dispatch(getWishlist());
      if (user) dispatch(getCart());
    }, [dispatch, user])
  );

  const handleRemoveFromWishlist = (courseId, courseTitle) => {
    Alert.alert(
      'Xóa khỏi yêu thích',
      `Bạn muốn xóa "${courseTitle}" khỏi danh sách yêu thích?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => dispatch(removeFromWishlist(courseId)),
        },
      ]
    );
  };

  const handleClearAll = () => {
    if (wishlist.length === 0) return;
    Alert.alert(
      'Xóa tất cả yêu thích',
      'Bạn có chắc muốn xóa toàn bộ danh sách yêu thích?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa tất cả',
          style: 'destructive',
          onPress: () => dispatch(clearWishlist()),
        },
      ]
    );
  };

  const handleToggleCart = (courseId, courseTitle, inCart) => {
    if (!user) {
      Alert.alert('Thông báo', 'Vui lòng đăng nhập để thêm vào giỏ hàng', [
        { text: 'Đăng nhập', onPress: () => nav.navigate('Login') },
        { text: 'Hủy', style: 'cancel' },
      ]);
      return;
    }

    if (inCart) {
      // Xóa khỏi giỏ hàng
      dispatch(removeFromCart(courseId)).then(() => {
        Toast.show({
          type: 'success',
          text1: 'Đã xóa',
          text2: `"${courseTitle}" đã xóa khỏi giỏ hàng`,
        });
      });
    } else {
      // Thêm vào giỏ hàng
      dispatch(addToCart(courseId)).then(() => {
        Toast.show({
          type: 'success',
          text1: 'Thêm thành công',
          text2: `"${courseTitle}" đã được thêm vào giỏ hàng`,
        });
      });
    }
  };

  const getImageSource = (thumbnail) => {
    if (!thumbnail || (typeof thumbnail === 'string' && thumbnail.trim() === '')) {
      return require('../../../assets/images/default-course.jpg');
    }
    if (typeof thumbnail === 'string') return { uri: thumbnail };
    if (typeof thumbnail === 'object' && thumbnail.url) return { uri: thumbnail.url };
    return require('../../../assets/images/default-course.jpg');
  };

  const renderItem = ({ item }) => {
    const inCart = cartCourseIds.has(item._id);

    return (
      <TouchableOpacity
        className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 mb-4 mx-4"
        onPress={() => nav.navigate('CourseDetail', { slug: item.slug })}
        activeOpacity={0.85}
      >
        {/* Thumbnail */}
        <View className="relative">
          <Image
            source={getImageSource(item.thumbnail)}
            style={{ width: '100%', height: 148 }}
            contentFit="cover"
            transition={400}
          />

          {/* Remove from Wishlist */}
          <TouchableOpacity
            className="absolute top-2 right-2 bg-white/90 rounded-full p-2 shadow"
            onPress={() => handleRemoveFromWishlist(item._id, item.title)}
          >
            <Heart size={18} color="#e11d48" fill="#e11d48" />
          </TouchableOpacity>

          {/* Price badge */}
          <View className="absolute bottom-2 left-2">
            <View className="bg-white/95 rounded-lg px-2 py-0.5 shadow-sm">
              <Text className="text-rose-600 font-bold text-xs">
                {item.price === 0
                  ? 'Miễn phí'
                  : `${(item.price || 0).toLocaleString('vi-VN')}đ`}
              </Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <View className="p-3">
          <Text className="font-bold text-gray-900 text-sm leading-5 mb-1" numberOfLines={2}>
            {item.title}
          </Text>
          <Text className="text-xs text-gray-500 mb-3" numberOfLines={1}>
            {item.instructor?.name || 'Instructor'}
          </Text>

          {/* Cart Button - đồng bộ từ database */}
          <TouchableOpacity
            className={`w-full rounded-xl py-2.5 flex-row items-center justify-center gap-2 ${inCart
              ? 'bg-emerald-50 border border-emerald-300'
              : 'bg-rose-500'
              }`}
            onPress={() => handleToggleCart(item._id, item.title, inCart)}
            disabled={cartLoading}
          >
            {inCart ? (
              <>
                <CheckCircle size={16} color="#059669" />
                <Text className="text-emerald-600 text-sm font-semibold">Đã có trong giỏ</Text>
              </>
            ) : (
              <>
                <ShoppingCart size={14} color="#fff" />
                <Text className="text-white text-sm font-semibold">Thêm vào giỏ hàng</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const isLoading = wishlistLoading;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-1">
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-bold text-gray-900">Yêu thích</Text>
            {wishlist.length > 0 && (
              <Text className="text-xs text-gray-400">{wishlist.length} khóa học</Text>
            )}
          </View>
        </View>

        {wishlist.length > 0 && (
          <TouchableOpacity
            onPress={handleClearAll}
            className="p-2 flex-row items-center gap-1"
          >
            <Trash2 size={16} color="#e11d48" />
            <Text className="text-rose-500 text-xs font-medium">Xóa tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#e11d48" />
        </View>
      ) : (
        <FlatList
          data={wishlist}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-24 px-6">
              <View className="w-20 h-20 rounded-full bg-rose-50 items-center justify-center mb-4">
                <Heart size={36} color="#e11d48" />
              </View>
              <Text className="text-gray-700 font-bold text-lg mb-2">Chưa có yêu thích nào</Text>
              <Text className="text-gray-400 text-sm text-center mb-6">
                Thêm khóa học vào danh sách yêu thích để xem lại sau
              </Text>
              <TouchableOpacity
                className="bg-rose-500 px-6 py-3 rounded-full"
                onPress={() => nav.navigate('MainTabs', { screen: 'CoursesTab' })}
              >
                <Text className="text-white font-semibold">Khám phá khóa học</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default WishlistScreen;
