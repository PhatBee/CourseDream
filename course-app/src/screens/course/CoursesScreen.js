import React, { useEffect, useState } from 'react';
import { View, FlatList, ActivityIndicator, Text } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';

import CourseCardAllCourse from '../../components/common/CourseCardAllCourse';
import CourseFilter from '../../components/common/CourseFilter';
import { getAllCourses } from '../../features/course/courseSlice';
import { getAllCategoriesSimple } from '../../features/categories/categorySlice'; // Thêm dòng này
import styles from './CoursesScreen.styles';

const CoursesScreen = () => {
  const dispatch = useDispatch();
  const { items: courses = [], isLoading, isError, message } = useSelector(state => state.course);
  const { items: categories = [] } = useSelector(state => state.categories);
  const route = useRoute();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Lấy đủ danh mục khi mount
  useEffect(() => {
    dispatch(getAllCategoriesSimple());
  }, [dispatch]);

  // Fetch courses khi đổi category
  useEffect(() => {
    dispatch(getAllCourses({
      search,
      category: selectedCategory,
    }));
  }, [dispatch, selectedCategory]);

  // Hàm thực hiện tìm kiếm khi nhấn icon
  const handleSearch = (value) => {
    dispatch(getAllCourses({
      search: value,
      category: selectedCategory,
    }));
    setSearch(value); // cập nhật lại search để giữ input đồng bộ
  };

  // Khi nhận params từ navigation (từ HomeScreen)
  useEffect(() => {
    if (route.params?.search) {
      setSearch(route.params.search);
      dispatch(getAllCourses({
        search: route.params.search,
        category: selectedCategory,
      }));
    }
    // Nếu có clearSearch thì reset search và filter
    if (route.params?.clearSearch) {
      setSearch('');
      setSelectedCategory('');
      dispatch(getAllCourses({
        search: '',
        category: '',
      }));
      // Xóa params sau khi dùng để tránh lặp lại khi back
      route.params.clearSearch = false;
    }
  }, [route.params?.search, route.params?.clearSearch]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e11d48" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={{ color: 'red' }}>
          {message || 'Đã xảy ra lỗi'}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <CourseFilter
        search={search}
        setSearch={setSearch}
        categories={categories} // Đã luôn đủ danh mục
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        onSearch={handleSearch}
      />
      {courses.length === 0 ? (
        <View style={styles.center}>
          <Text>Không có khóa học nào.</Text>
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={item => String(item._id)}
          renderItem={({ item }) => (
            <CourseCardAllCourse course={item} />
          )}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={10}
        />
      )}
    </SafeAreaView>
  );
};

export default CoursesScreen;
