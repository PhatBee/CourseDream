import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { getWishlist } from '../../features/wishlist/wishlistSlice';
import CourseCardAllCourse from '../../components/common/CourseCardAllCourse';

const WishlistScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { items: wishlist, isLoading } = useSelector(state => state.wishlist);

  useEffect(() => {
    dispatch(getWishlist());
  }, [dispatch]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100 bg-white">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3 p-1">
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-xl font-bold">Danh sách yêu thích</Text>
      </View>

      {/* Danh sách khóa học */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text>Đang tải...</Text>
        </View>
      ) : (
        <FlatList
          data={wishlist}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <CourseCardAllCourse course={item} />
          )}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 12 }}
          contentContainerStyle={{
            paddingTop: 16,
            paddingBottom: 24,
            minHeight: 200,
            paddingHorizontal: 4,
          }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-20">
              <Text className="text-gray-500 text-base text-center">
                Chưa có khóa học yêu thích nào.
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

export default WishlistScreen;
