import React, { useEffect, useState } from 'react';
import { View, FlatList, ActivityIndicator, Text } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';

import CourseCardAllCourse from '../../components/common/CourseCardAllCourse';
import CourseFilter from '../../components/common/CourseFilter';
import Pagination from '../../components/common/Pagination';
import { getAllCourses } from '../../features/course/courseSlice';
import { getAllCategoriesSimple } from '../../features/categories/categorySlice';
import styles from './CoursesScreen.styles';

const CoursesScreen = () => {
  const dispatch = useDispatch();
  const { items: courses = [], pagination, isLoading, isError, message } = useSelector(state => state.course);
  const { items: categories = [] } = useSelector(state => state.categories);
  const route = useRoute();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Lấy đủ danh mục khi mount
  useEffect(() => {
    dispatch(getAllCategoriesSimple());
  }, [dispatch]);

  // Fetch courses khi đổi category hoặc page
  useEffect(() => {
    dispatch(getAllCourses({
      search,
      category: selectedCategory,
      page: currentPage,
      limit: 9,
    }));
  }, [dispatch, selectedCategory, currentPage]);

  // Hàm thực hiện tìm kiếm khi nhấn icon
  const handleSearch = (value) => {
    setSearch(value);
    setCurrentPage(1); // Reset về trang 1 khi search
    dispatch(getAllCourses({
      search: value,
      category: selectedCategory,
      page: 1,
      limit: 9,
    }));
  };

  // Handle category change
  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1); // Reset về trang 1 khi đổi category
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Khi nhận params từ navigation (từ HomeScreen)
  useEffect(() => {
    if (route.params?.search) {
      setSearch(route.params.search);
      setCurrentPage(1);
      dispatch(getAllCourses({
        search: route.params.search,
        category: selectedCategory,
        page: 1,
        limit: 9,
      }));
    }
    // Nếu có clearSearch thì reset search và filter
    if (route.params?.clearSearch) {
      setSearch('');
      setSelectedCategory('');
      setCurrentPage(1);
      dispatch(getAllCourses({
        search: '',
        category: '',
        page: 1,
        limit: 9,
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
        <Text style={{ color: 'red' }}>{message || 'Đã xảy ra lỗi'}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
      <CourseFilter
        search={search}
        setSearch={setSearch}
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={handleCategoryChange}
        onSearch={handleSearch}
      />
      {courses.length === 0 ? (
        <View style={styles.center}>
          <Text>Không có khóa học nào.</Text>
        </View>
      ) : (
        <>
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

          {/* Pagination Component */}
          <Pagination
            currentPage={pagination?.page || currentPage}
            totalPages={pagination?.totalPages || 1}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </SafeAreaView>
  );
};

export default CoursesScreen;
