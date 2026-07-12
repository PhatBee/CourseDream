import React, { useEffect, useCallback } from 'react';
import { ScrollView, View, Text, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

// Actions
import { getCategories } from '../../features/categories/categorySlice';
import { getPopularCourses } from '../../features/course/courseSlice';
import { fetchMyEnrollments } from '../../features/enrollment/enrollmentSlice';
import { getWishlist } from '../../features/wishlist/wishlistSlice';

// Components
import HomeHeader from '../../components/home/HomeHeader';
import SearchBar from '../../components/home/SearchBar';
import PromoBanner from '../../components/home/PromoBanner';
import CategoryList from '../../components/home/CategoryList';
import CourseCard from '../../components/common/CourseCard';
import OngoingCourse from '../../components/home/OngoingCourse';
import LoginPromptCard from '../../components/home/LoginPromptCard';

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const nav = useNavigation();

  const { user } = useSelector(state => state.auth);

  const { items: categories, isLoading: catLoading } = useSelector(state => state.categories);
  const { popularCourses, isLoading: courseLoading, isError: courseError, message: courseMessage } = useSelector(state => state.course);

  const { items: enrollments, isLoading: enrollLoading } = useSelector(state => state.enrollment);

  const isLoading = catLoading || courseLoading || enrollLoading;

  const ongoing = enrollments?.[0] || null;

  useFocusEffect(
    useCallback(() => {
      if (user) {
        dispatch(fetchMyEnrollments());
        dispatch(getWishlist());
      }
    }, [dispatch, user])
  );

  const loadData = useCallback(() => {
    dispatch(getCategories());
    dispatch(getPopularCourses());

    if (user) {
      dispatch(fetchMyEnrollments());
      dispatch(getWishlist());
    }
  }, [dispatch, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = (keyword) => {
    if (keyword) {
      nav.navigate('MainTabs', {
        screen: 'CoursesTab',
        params: { search: keyword },
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <ScrollView
        className="flex-1 pt-2"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadData} colors={['#e11d48']} />
        }
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        <View className="px-5">
          <HomeHeader user={user} />
          <SearchBar onSearch={handleSearch} />
        </View>

        {user && ongoing ? (
          <OngoingCourse enrollment={ongoing} />
        ) : (
          <View className="px-5">
            {/* <PromoBanner navigation={navigation} /> */}
            <LoginPromptCard navigation={navigation} />
          </View>
        )}

        {/* Categories */}
        <View>
          <CategoryList categories={categories} navigation={navigation} />
        </View>

        {/* Popular Courses */}
        <View className="mb-20">
          <View className="flex-row justify-between items-center mb-4 px-5">
            <Text className="text-lg font-bold text-gray-900">Khóa học phổ biến</Text>
            <TouchableOpacity onPress={() => nav.navigate('MainTabs', { screen: 'CoursesTab', params: { clearSearch: true } })}>
              <Text className="text-rose-500 text-sm font-medium">Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            {popularCourses.length > 0 ? (
              popularCourses.map((course) => (
                <CourseCard
                  key={course._id}
                  course={course}
                />
              ))
            ) : courseError ? (
              <View style={{ alignItems: 'center', paddingHorizontal: 20 }}>
                <Text style={{ color: '#ef4444', fontSize: 13, marginBottom: 8 }}>
                  {courseMessage || 'Không thể tải khóa học.'}
                </Text>
                <TouchableOpacity
                  onPress={() => dispatch(getPopularCourses())}
                  style={{ backgroundColor: '#e11d48', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}
                >
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Thử lại</Text>
                </TouchableOpacity>
              </View>
            ) : (
              !isLoading && <Text className="text-gray-400 ml-5">Không có khóa học.</Text>
            )}
          </ScrollView>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;