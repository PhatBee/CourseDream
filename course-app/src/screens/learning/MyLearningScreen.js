import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchMyEnrollments } from '../../features/enrollment/enrollmentSlice';
import ProgressBar from '../../components/common/ProgressBar';
import CourseFilter from '../../components/common/CourseFilter';
import { getAllCategoriesSimple } from '../../features/categories/categorySlice'; // Thêm dòng này
import { Image } from 'expo-image';
import { fetchCourseProgress } from '../../features/learning/learningSlice'; // Thêm dòng này

const MyLearningScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { items: enrollments = [], isLoading, isError, message } = useSelector(state => state.enrollment);
  const { items: categories = [] } = useSelector(state => state.categories);
  const progressMap = useSelector(state => state.learning.progressMap); 
  // State filter
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Lấy đủ danh mục khi mount
  useEffect(() => {
    dispatch(getAllCategoriesSimple());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchMyEnrollments());
  }, [dispatch]);

  // Fetch progress cho từng course
  useEffect(() => {
    if (enrollments.length > 0) {
      enrollments.forEach(enrollment => {
        const course = enrollment.course;
        if (course && course.slug) {
          dispatch(fetchCourseProgress(course.slug));
        }
      });
    }
  }, [enrollments, dispatch]);

  // Lọc enrollments theo search và category (lọc client)
  const filteredEnrollments = useMemo(() => {
    return enrollments.filter(enrollment => {
      const course = enrollment.course;
      if (!course) return false;
      // Lọc theo category
      if (
        selectedCategory &&
        !((course.categories || []).some(cat =>
          (typeof cat === 'string' ? cat : cat._id) === selectedCategory
        ))
      ) {
        return false;
      }
      // Lọc theo search
      if (search && !course.title.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [enrollments, search, selectedCategory]);

  const getImageSource = (thumbnail) => {
    if (!thumbnail || (typeof thumbnail === 'string' && thumbnail.trim() === '')) {
      return require('../../../assets/images/default-course.jpg');
    }
    if (typeof thumbnail === 'string') return { uri: thumbnail };
    if (typeof thumbnail === 'object' && thumbnail.url) return { uri: thumbnail.url };
    return require('../../../assets/images/default-course.jpg');
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#e11d48" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-red-500">{message || 'Đã xảy ra lỗi'}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <CourseFilter
        search={search}
        setSearch={setSearch}
        categories={categories} // Đã luôn đủ danh mục
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        onSearch={setSearch}
      />
      {filteredEnrollments.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text>Không có khóa học nào phù hợp.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredEnrollments}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const course = item.course;
            if (!course) return null;
            const progress = progressMap[course.slug] ?? 0;
            return (
              <TouchableOpacity
                className="mb-5 flex-row bg-gray-50 rounded-xl shadow-sm p-3"
                onPress={() => navigation.navigate('LearningDetail', { courseSlug: course.slug })}
                activeOpacity={0.9}
              >
                <Image
                  source={getImageSource(course.thumbnail)}
                  placeholder={require('../../../assets/images/default-course.jpg')}
                  style={{ width: 80, height: 80, borderRadius: 12, marginRight: 12, backgroundColor: '#e5e7eb' }}
                  contentFit="cover"
                />
                <View className="flex-1 justify-between">
                  <Text className="font-bold text-base text-gray-900 mb-1" numberOfLines={2}>{course.title}</Text>
                  <Text className="text-xs text-gray-500 mb-2" numberOfLines={1}>{course.instructor?.name}</Text>
                  <ProgressBar progress={progress} />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
};

export default MyLearningScreen;