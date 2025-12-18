import React, { useEffect, useCallback } from 'react';
import { ScrollView, View, ActivityIndicator, Text, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

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
  const { popularCourses, isLoading: courseLoading } = useSelector(state => state.course);

  const { items: enrollments, isLoading: enrollLoading } = useSelector(state => state.enrollment);

  const isLoading = catLoading || courseLoading || enrollLoading;

  const ongoingEnrollment = enrollments.length > 0 ? enrollments[0] : null;

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
      nav.navigate('CoursesTab', { search: keyword });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1 pt-2"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadData} colors={['#e11d48']} />
        }
      >
        <View className="px-5">
          <HomeHeader user={user} />
          <SearchBar onSearch={handleSearch} />
        </View>

        {/* Nếu chưa có khóa học đang học -> Hiện Banner quảng cáo */}
        {/* Nếu ĐÃ có khóa học -> Hiện thẻ Ongoing Course để nhắc học */}
        {ongoingEnrollment && user ? (
          <OngoingCourse enrollment={ongoingEnrollment} />
        ) : (
          <View className="px-5">
            <PromoBanner navigation={navigation} />
            <LoginPromptCard navigation={navigation} />
          </View>
        )}

        {/* Categories */}
        <View className="pl-5">
          <CategoryList categories={categories} />
        </View>

        {/* Popular Courses */}
        <View className="mb-20">
          <View className="flex-row justify-between items-center mb-4 px-5">
            <Text className="text-lg font-bold text-gray-900">Popular Courses</Text>
            <Text className="text-rose-500 text-sm font-medium">See All</Text>
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
            ) : (
              !isLoading && <Text className="text-gray-400 ml-5">No courses available.</Text>
            )}
          </ScrollView>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;