import React, { useCallback, useEffect, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { getCart, removeFromCart, clearCart } from '../../features/cart/cartSlice';
import { ArrowLeft } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

const CartScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { items, totalItems, total, isLoading } = useSelector(state => state.cart);

  useEffect(() => { dispatch(getCart()); }, [dispatch]);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price, 0),
    [items]
  );
  const discount = useMemo(
    () => items.reduce((sum, item) => sum + (item.price - item.priceDiscount), 0),
    [items]
  );

  const renderCartItem = useCallback(
    ({ item }) => {
      const course = item.course;
      const hasDiscount = item.price > item.priceDiscount;
      const saved = item.price - item.priceDiscount;

      return (
        <View className="flex-row items-center p-4 border-b border-gray-100 bg-white">
          {/* Ảnh khóa học */}
          <Image
            source={{ uri: course.thumbnail?.url || course.thumbnail }}
            className="w-16 h-16 rounded-lg mr-3"
          />
          {/* Thông tin và giá */}
          <View className="flex-1">
            <Text className="font-bold text-base mb-1" numberOfLines={2}>{course.title}</Text>
            <Text className="text-gray-500 text-xs mb-1">{course.instructor?.name}</Text>
            <View className="flex-row items-end gap-2">
              {/* Giá giảm */}
              <Text className="text-rose-600 font-bold text-base">
                {item.priceDiscount === 0 ? 'Free' : `${item.priceDiscount.toLocaleString()} đ`}
              </Text>
              {/* Giá gốc */}
              {hasDiscount && (
                <Text className="text-gray-400 text-xs line-through">
                  {item.price.toLocaleString()} đ
                </Text>
              )}
            </View>
          </View>
          {/* Nút xóa */}
          <TouchableOpacity onPress={() => {
            dispatch(removeFromCart(course._id)).then(() => {
              Toast.show({
                type: 'success',
                text1: 'Đã xóa khỏi giỏ hàng',
                position: 'top',
              });
            });
          }}>
            <Text className="text-rose-500 font-medium">Xóa</Text>
          </TouchableOpacity>
        </View>
      );
    },
    [dispatch]
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#e11d48" />
      </View>
    );
  }

  if (!items || items.length === 0) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="text-xl font-bold text-gray-800 mb-5">Giỏ hàng trống</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} className="bg-rose-500 px-5 py-2 rounded-lg">
          <Text className="text-white font-bold">Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header với nút back */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100 bg-white">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <ArrowLeft size={24} color="#e11d48" />
        </TouchableOpacity>
        <Text className="text-xl font-bold flex-1">Giỏ hàng ({totalItems})</Text>
        <TouchableOpacity onPress={() => {
          dispatch(clearCart()).then(() => {
            Toast.show({
              type: 'success',
              text1: 'Đã xóa toàn bộ giỏ hàng',
              position: 'top',
            });
          });
        }}>
          <Text className="text-rose-500 font-medium">Xóa tất cả</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={items}
        keyExtractor={item => item._id}
        renderItem={renderCartItem}
      />
      <View className="p-4 border-t border-gray-100 bg-white">
        <View className="mb-3">
          <Text className="text-lg font-bold mb-2">Tổng quan đơn hàng</Text>
          <View className="flex-row justify-between mb-1">
            <Text className="text-gray-600">Số khóa học:</Text>
            <Text className="font-semibold">{totalItems}</Text>
          </View>
          <View className="flex-row justify-between mb-1">
            <Text className="text-gray-600">Tạm tính:</Text>
            <Text className="font-semibold">
              {subtotal.toLocaleString()} đ
            </Text>
          </View>
          <View className="flex-row justify-between mb-1">
            <Text className="text-green-600">Giảm giá:</Text>
            <Text className="font-semibold text-green-600">
              -{discount.toLocaleString()} đ
            </Text>
          </View>
          <View className="border-t border-gray-100 my-2" />
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-lg font-bold">Tổng cộng:</Text>
            <Text className="text-xl font-bold text-blue-600">{total.toLocaleString()} đ</Text>
          </View>
        </View>
        <TouchableOpacity
          className="bg-rose-500 py-3 rounded-lg mb-2"
          onPress={() => navigation.navigate('Checkout')}
        >
          <Text className="text-white text-center font-bold">Thanh toán</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CartScreen;