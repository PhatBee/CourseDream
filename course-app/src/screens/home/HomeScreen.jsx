import React, { useEffect, useState } from 'react';
import { ScrollView, View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import axiosClient from '../../api/axiosClient';

// Import Components
import HomeHeader from '../../components/home/HomeHeader';
import SearchBar from '../../components/home/SearchBar';
import PromoBanner from '../../components/home/PromoBanner';
import LoginPromptCard from '../../components/home/LoginPromptCard';
import CategoryList from '../../components/home/CategoryList';
import CourseCard from '../../components/common/CourseCard';

const HomeScreen = ({ navigation }) => {
  const { user } = useSelector(state => state.auth);

  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Gọi API song song
        const [catRes, courseRes] = await Promise.all([
          axiosClient.get('/categories'),
          axiosClient.get('/courses/search?limit=5')
        ]);

        setCategories(catRes.data.data.data || []);
        setCourses(courseRes.data.data.data || []);
      } catch (error) {
        console.log('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCoursePress = (slug) => {
    // Điều hướng sang màn hình chi tiết (sẽ làm sau)
    // navigation.navigate('CourseDetail', { slug });
    console.log('Open course:', slug);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1 px-5 pt-2"
        showsVerticalScrollIndicator={false}
      >

        {/* 1. Header & Search */}
        <HomeHeader user={user} navigation={navigation} />
        <SearchBar />

        {/* 2. Banner */}
        <PromoBanner />

        {/* 3. Login Prompt Card - Chỉ hiển thị khi chưa đăng nhập */}
        {!user && <LoginPromptCard navigation={navigation} />}

        {/* Loading State */}
        {loading ? (
          <View className="h-40 justify-center items-center">
            <ActivityIndicator size="large" color="#e11d48" />
          </View>
        ) : (
          <>
            {/* 4. Categories */}
            <CategoryList categories={categories} />

            {/* 5. Popular Courses */}
            <View className="mb-20">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-gray-900">Popular Courses</Text>
                <Text className="text-rose-500 text-sm font-medium">See All</Text>
              </View>

              {courses.map((course) => (
                <CourseCard
                  key={course._id}
                  course={course}
                  onPress={() => handleCoursePress(course.slug)}
                />
              ))}
            </View>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;