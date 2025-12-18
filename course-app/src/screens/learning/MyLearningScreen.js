import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchMyEnrollments } from '../../features/enrollment/enrollmentSlice';
import ProgressBar from '../../components/common/ProgressBar';
import CourseFilter from '../../components/common/CourseFilter';
import { getAllCategoriesSimple } from '../../features/categories/categorySlice'; // Thêm dòng này
import axiosClient from '../../api/axiosClient';
import { useFocusEffect } from '@react-navigation/native';

const MyLearningScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { items: enrollments = [], isLoading, isError, message } = useSelector(state => state.enrollment);
  const { items: categories = [] } = useSelector(state => state.categories);

  // State filter
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [progressMap, setProgressMap] = useState({});

  // Lấy đủ danh mục khi mount
  useFocusEffect(
    useCallback(() => {
      dispatch(getAllCategoriesSimple());
    }, [dispatch])
  );

  const fetchProgressData = useCallback(async (currentEnrollments) => {
    if (!currentEnrollments || currentEnrollments.length === 0) return;
    
    const newMap = {};
    await Promise.all(
      currentEnrollments.map(async (enrollment) => {
        const course = enrollment?.course;
        if (!course || !course.slug) return;
        try {
          const res = await axiosClient.get(`/progress/${course.slug}`);
          newMap[course.slug] = res.data.data?.percentage ?? 0;
        } catch {
          newMap[course.slug] = 0;
        }
      })
    );
    setProgressMap(prev => ({ ...prev, ...newMap }));
  }, []);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchMyEnrollments());
    }, [dispatch])
  );

  useFocusEffect(
    useCallback(() => {
        if(enrollments.length > 0) {
            fetchProgressData(enrollments);
        }
    }, [enrollments, fetchProgressData])
  );

  // Lọc enrollments theo search và category (lọc client)
  const filteredEnrollments = useMemo(() => {
    return enrollments.filter(enrollment => {
      const course = enrollment?.course;
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
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <CourseFilter
        search={search}
        setSearch={setSearch}
        categories={categories} // Đã luôn đủ danh mục
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        onSearch={setSearch}
      />
      {filteredEnrollments.length === 0 ? (
        <View className="flex-1 justify-center items-center mt-10">
          <Text className="text-gray-500">Không có khóa học nào phù hợp.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredEnrollments}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const course = item?.course;
            if (!course) return null;
            const progress = progressMap[course.slug] ?? 0;
            const fallbackProgress = item.progress?.percentage ?? 0;
            const displayProgress = progress !== undefined ? progress : fallbackProgress;
            return (
              <TouchableOpacity
                className="mb-4 flex-row bg-white rounded-2xl shadow-sm p-3 border border-gray-100"
                onPress={() => navigation.navigate('Learning', { slug: course.slug })}
                activeOpacity={0.7}
              >
                <Image
                  source={course.thumbnail?.url ? { uri: course.thumbnail.url } : require('../../../assets/images/default-course.jpg')}
                  className="w-20 h-20 rounded-lg mr-3 bg-gray-200"
                  resizeMode="cover"
                  transition={500}
                />
                <View className="flex-1 ml-3 justify-between py-1">
                  <View>
                    <Text className="font-bold text-base text-gray-900 leading-5 mb-1" numberOfLines={2}>
                        {course.title}
                    </Text>
                    <Text className="text-xs text-gray-500" numberOfLines={1}>
                        {course.instructor?.name || 'Instructor'}
                    </Text>
                  </View>
                  
                  <View>
                    <ProgressBar progress={displayProgress} showText={true} />
                  </View>
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