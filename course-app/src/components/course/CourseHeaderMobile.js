import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Share } from 'react-native';
import { Star, Heart, ShoppingCart, Share2, Flag, RefreshCw, PlayCircle } from 'lucide-react-native';
import { useSelector, useDispatch } from 'react-redux';
import { addToCart, removeFromCart } from '../../features/cart/cartSlice';
import { addToWishlist, removeFromWishlist } from '../../features/wishlist/wishlistSlice';
import { activateEnrollmentThunk } from '../../features/enrollment/enrollmentSlice';
import Toast from 'react-native-toast-message';
import ReportModalMobile from '../common/ReportModalMobile';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import CourseExtensionModalMobile from './CourseExtensionModalMobile';

const formatCurrency = (amount) => {
  if (!amount || amount === 0) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const CourseHeaderMobile = ({ course, isEnrolled, reviewCount }) => {
  const [isExtVisible, setIsExtVisible] = useState(false);
  const instructor = course.instructor || {};
  const categoryName = course.categories?.[0]?.name || 'Khóa học';
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
      Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Không tìm thấy thông tin kích hoạt.' });
      return;
    }
    dispatch(activateEnrollmentThunk(enrollmentId))
      .unwrap()
      .then(() => {
        Toast.show({ type: 'success', text1: 'Kích hoạt khóa học thành công!' });
      })
      .catch((err) => {
        Toast.show({ type: 'error', text1: 'Kích hoạt thất bại', text2: err || 'Có lỗi xảy ra' });
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
      Toast.show({ type: 'info', text1: 'Vui lòng đăng nhập để thực hiện' });
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
      Toast.show({ type: 'info', text1: 'Vui lòng đăng nhập để lưu khóa học' });
      return;
    }
    if (isWishlisted) dispatch(removeFromWishlist(course._id));
    else dispatch(addToWishlist(course._id));
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Khóa học: ${course.title}\nHọc cùng mình nhé!`,
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

  const currentPrice = course.priceDiscount > 0 ? course.priceDiscount : course.price;
  const hasDiscount = course.priceDiscount > 0 && course.priceDiscount < course.price;

  return (
    <View className="bg-white pb-6 shadow-sm border-b border-gray-100">
      {/* ── 1. Khu vực Thumbnail Ảnh Khóa học (Tạo khoảng trống thở) ── */}
      <View className="px-4 mt-2">
        <View className="relative w-full h-52 rounded-2xl overflow-hidden bg-gray-900 shadow-sm">
          <Image
            source={getCourseImageSource(course.thumbnail)}
            placeholder={require('../../../assets/images/default-course.jpg')}
            className="w-full h-full opacity-95"
            contentFit="cover"
            transition={500}
          />
          <View className="absolute inset-0 bg-black/10 justify-center items-center">
            <View className="bg-white/90 p-3 rounded-full shadow backdrop-blur-md">
              <PlayCircle size={28} color="#e11d48" />
            </View>
          </View>
        </View>
      </View>

      {/* ── 2. Nội dung Text & Thông số (Ép padding chống tràn viền) ── */}
      <View className="px-5 mt-4">
        <View className="bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md align-self-start mb-2 self-start">
          <Text className="text-rose-600 font-bold text-[10px] uppercase tracking-wider">{categoryName}</Text>
        </View>
        
        <Text className="text-xl font-extrabold text-gray-900 leading-7 tracking-tight mb-2 text-justify">
          {course.title}
        </Text>
        
        <Text className="text-gray-500 text-xs leading-5 mb-4 text-justify font-medium">
          {course.shortDescription}
        </Text>

        {/* Thông tin Giảng viên & Đánh giá sao phối hợp gọn gàng */}
        <View className="flex-row items-center justify-between border-t border-b border-gray-50 py-3 mb-4">
          <View className="flex-row items-center flex-1">
            <Image
              source={instructor.avatar ? { uri: instructor.avatar } : require('../../../assets/images/default-avatar.jpg')}
              style={{ width: 34, height: 34, borderRadius: 17 }}
              className="border border-gray-100 mr-2.5"
            />
            <View>
              <Text className="font-bold text-gray-800 text-xs">{instructor.name || 'Giảng viên'}</Text>
            </View>
          </View>

          <View className="flex-row items-center bg-amber-50/60 px-2.5 py-1 rounded-xl border border-amber-100/50">
            <Star size={13} color="#f59e0b" fill="#f59e0b" />
            <Text className="ml-1 font-bold text-amber-700 text-xs">{course.rating?.toFixed(1) || '0.0'}</Text>
            <Text className="ml-1 text-gray-400 text-[10px] font-medium">({reviewCount || 0})</Text>
          </View>
        </View>

        {/* ── 3. Khu vực Giá tiền & Cụm Nút Phụ tương tác tiện lợi ── */}
        <View className="flex-row justify-between items-center mb-5">
          <View>
            {hasDiscount && (
              <Text className="text-gray-400 text-xs line-through font-medium mb-0.5">
                {formatCurrency(course.price)}
              </Text>
            )}
            <Text className="text-2xl font-black text-rose-600 tracking-tight">
              {formatCurrency(currentPrice)}
            </Text>
          </View>

          {/* Icon Actions nhỏ gọn xếp sát góc phải lề trong */}
          <View className="flex-row space-x-2 gap-1">
            <TouchableOpacity onPress={handleWishlist} className={`p-2.5 rounded-xl border ${isWishlisted ? "bg-rose-50 border-rose-100" : "bg-gray-50 border-gray-200"}`}>
              <Heart size={16} color={isWishlisted ? "#e11d48" : "#6b7280"} fill={isWishlisted ? "#e11d48" : "transparent"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} className="p-2.5 rounded-xl border bg-gray-50 border-gray-200">
              <Share2 size={16} color="#6b7280" />
            </TouchableOpacity>
            {userId && instructorId && userId !== String(instructorId) && (
              <TouchableOpacity onPress={() => setReportVisible(true)} className="p-2.5 rounded-xl border bg-gray-50 border-gray-200">
                <Flag size={16} color="#e11d48" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── 4. KHU VỰC HÀNH ĐỘNG CTA CHÍNH ── */}
        <View>
          {!isEnrolled ? (
            <View className="flex-col space-y-2">
              <TouchableOpacity 
                activeOpacity={0.85} 
                className={`w-full py-3.5 rounded-xl items-center justify-center flex-row space-x-2 ${inCart ? 'bg-rose-50 border border-rose-200' : 'bg-rose-600 shadow-sm shadow-rose-200'}`} 
                onPress={handleAddToCart}
              >
                <ShoppingCart size={16} color={inCart ? "#e11d48" : "#fff"} />
                <Text className={`font-bold text-sm ${inCart ? 'text-rose-600' : 'text-white'}`}>
                  {inCart ? 'Đã trong giỏ hàng (Xóa)' : 'Thêm vào giỏ hàng'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                className="w-full bg-white border-2 border-rose-600 py-3 rounded-xl items-center justify-center"
                onPress={() => {
                  if (!user) {
                    Toast.show({ type: 'info', text1: 'Vui lòng đăng nhập để ghi danh' });
                    navigation.navigate('Login');
                    return;
                  }
                  navigation.navigate('Checkout', { directCheckout: true, course: course });
                }}
              >
                <Text className="text-rose-600 font-bold text-sm">
                  {course.price === 0 ? 'Đăng ký miễn phí' : 'Ghi danh ngay'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {isExpired ? (
                /* Thiết kế cấu trúc nút cạnh nhau theo yêu cầu: Hết hạn (2/3) & Gia hạn Rose (1/3) */
                <View className="flex-row space-x-2 w-full gap-2">
                  <View className="flex-[2] bg-gray-100 py-3.5 rounded-xl items-center justify-center border border-gray-200">
                    <Text className="text-gray-400 font-bold text-sm">Khóa học đã hết hạn</Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setIsExtVisible(true)}
                    className="flex-[1] bg-rose-600 py-3.5 rounded-xl items-center justify-center flex-row space-x-1 shadow-sm shadow-rose-100"
                  >
                    <RefreshCw size={14} color="white" />
                    <Text className="text-white font-bold text-sm ml-1">Gia hạn</Text>
                  </TouchableOpacity>
                </View>
              ) : needsActivation ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  className="w-full bg-amber-500 py-3.5 rounded-xl items-center justify-center shadow-sm"
                  onPress={handleActivate}
                >
                  <Text className="text-white font-bold text-sm">Kích hoạt khóa học</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.85}
                  className="w-full bg-rose-600 py-3.5 rounded-xl items-center justify-center shadow-sm shadow-rose-200"
                  onPress={() => navigation.navigate('Learning', { slug: course.slug })}
                >
                  <Text className="text-white font-bold text-sm">Đi tới lớp học</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Modals điều hướng đi kèm */}
      <ReportModalMobile
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        type="course"
        targetId={course._id}
        isEnrolled={isEnrolled}
      />
      <CourseExtensionModalMobile
        visible={isExtVisible}
        onClose={() => setIsExtVisible(false)}
        enrollment={enrollmentInfo}
      />
    </View>
  );
};

export default CourseHeaderMobile;