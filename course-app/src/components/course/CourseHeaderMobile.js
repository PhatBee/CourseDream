import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Share } from 'react-native';
import { Star, Heart, ShoppingCart, Share2, Flag } from 'lucide-react-native';
import { useSelector, useDispatch } from 'react-redux';
import { addToCart, removeFromCart } from '../../features/cart/cartSlice';
import { addToWishlist, removeFromWishlist } from '../../features/wishlist/wishlistSlice';
import { activateEnrollmentThunk } from '../../features/enrollment/enrollmentSlice';
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

  const enrollmentInfo = useSelector((state) => 
    state.enrollment.items.find(item => item.course?._id === course._id || item.course === course._id)
  );

  const isActivated = enrollmentInfo ? enrollmentInfo.isActivated : false;
  const enrollmentId = enrollmentInfo ? enrollmentInfo._id : null;
  const isExpired = enrollmentInfo?.endedAt && new Date(enrollmentInfo.endedAt) < new Date();

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

  const isWishlisted = wishlistItems.some(item => item._id === course._id);
  const inCart = cartItems.some(item => item.course._id === course._id);
  const userId = user?._id;
  const instructorId = typeof instructor === "object" ? instructor._id : instructor;

  const isInstructor = user && instructorId && user._id === String(instructorId);
  const isAdmin = user && user.role === 'admin';
  const needsActivation = isEnrolled && !isInstructor && !isAdmin && !isActivated;

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
        <Text className="text-xl font-bold text-gray-900 mb-2 text-justify">{course.title}</Text>
        <Text className="text-gray-600 mb-2 text-justify">{course.shortDescription}</Text>
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
          <Text className="text-rose-600 font-bold text-2xl">
            {formatCurrency(course.priceDiscount > 0 ? course.priceDiscount : course.price)}
          </Text>
          {course.priceDiscount > 0 && course.priceDiscount < course.price && (
            <Text className="text-gray-400 text-base line-through ml-2">{formatCurrency(course.price)}</Text>
          )}
        </View>
        {!isEnrolled ? (
          <>
            {course.price === 0 ? (
              <>
                <TouchableOpacity className="bg-rose-500 py-3 rounded-lg mb-2" onPress={handleAddToCart}>
                  <Text className="text-white text-center font-bold">{inCart ? 'Đã trong giỏ hàng' : 'Thêm vào giỏ hàng'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-green-500 py-3 rounded-lg mb-2"
                  onPress={() => {
                    if (!user) {
                      Toast.show({ type: 'info', text1: 'Vui lòng đăng nhập để ghi danh' });
                      navigation.navigate('Login');
                      return;
                    }
                    navigation.navigate('Checkout', {
                      directCheckout: true,
                      course: course,
                    });
                  }}
                >
                  <Text className="text-white text-center font-bold">Đăng ký miễn phí</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity className="bg-rose-500 py-3 rounded-lg mb-2" onPress={handleAddToCart}>
                  <Text className="text-white text-center font-bold">{inCart ? 'Đã trong giỏ hàng' : 'Thêm vào giỏ hàng'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-blue-500 py-3 rounded-lg mb-2"
                  onPress={() => {
                    if (!user) {
                      Toast.show({ type: 'info', text1: 'Vui lòng đăng nhập để ghi danh' });
                      navigation.navigate('Login');
                      return;
                    }
                    navigation.navigate('Checkout', {
                      directCheckout: true,
                      course: course,
                    });
                  }}
                >
                  <Text className="text-white text-center font-bold">Ghi danh ngay</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        ) : (
          isExpired ? (
            <TouchableOpacity
              disabled
              className="bg-gray-300 px-3 py-3 rounded-lg items-center justify-center mb-2"
            >
              <Text className="text-gray-500 font-bold text-base">Khóa học đã hết hạn học</Text>
            </TouchableOpacity>
          ) : needsActivation ? (
            <TouchableOpacity
              className="bg-amber-500 px-3 py-3 rounded-lg items-center justify-center mb-2 active:bg-amber-600 border border-amber-600"
              onPress={handleActivate}
            >
              <Text className="text-white font-bold text-base">Kích hoạt khóa học</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="bg-rose-500 px-3 py-3 rounded-lg items-center justify-center mb-2 active:bg-rose-600"
              onPress={() => navigation.navigate('Learning', { slug: course.slug })}
            >
              <Text className="text-white font-bold text-base">Đi tới khóa học</Text>
            </TouchableOpacity>
          )
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
          isEnrolled={isEnrolled}
        />
      </View>
    </View>
  );
};

export default CourseHeaderMobile;