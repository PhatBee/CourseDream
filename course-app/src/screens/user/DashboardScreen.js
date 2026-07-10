import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, BookOpen, Heart, Award, TrendingUp, ChevronRight } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { fetchStudentDashboard } from '../../features/enrollment/enrollmentSlice';
import { getWishlist } from '../../features/wishlist/wishlistSlice';
import { Image } from 'expo-image';

const DashboardScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { dashboardData: enrollments = [], isLoading: enrollLoading } = useSelector(state => state.enrollment);
  const { items: wishlist = [] } = useSelector(state => state.wishlist);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchStudentDashboard());
      dispatch(getWishlist());
    }, [dispatch])
  );

  const completedCourses = enrollments.filter(e => (e.learningProgress?.percentage ?? 0) >= 100);
  const inProgressCourses = enrollments.filter(e => {
    const p = e.learningProgress?.percentage ?? 0;
    return p > 0 && p < 100;
  });

  const getImageSource = (thumbnail) => {
    if (!thumbnail || (typeof thumbnail === 'string' && !thumbnail.trim())) {
      return require('../../../assets/images/default-course.jpg');
    }
    if (typeof thumbnail === 'string') return { uri: thumbnail };
    if (typeof thumbnail === 'object' && thumbnail.url) return { uri: thumbnail.url };
    return require('../../../assets/images/default-course.jpg');
  };

  const stats = [
    {
      label: 'Đang học',
      value: inProgressCourses.length,
      icon: <TrendingUp size={20} color="#e11d48" />,
      bg: 'bg-rose-50',
    },
    {
      label: 'Hoàn thành',
      value: completedCourses.length,
      icon: <Award size={20} color="#059669" />,
      bg: 'bg-emerald-50',
    },
    {
      label: 'Tổng khóa',
      value: enrollments.length,
      icon: <BookOpen size={20} color="#7c3aed" />,
      bg: 'bg-purple-50',
    },
    {
      label: 'Yêu thích',
      value: wishlist.length,
      icon: <Heart size={20} color="#f43f5e" />,
      bg: 'bg-pink-50',
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3 p-1">
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <View>
          <Text className="text-xl font-bold text-gray-900">Dashboard</Text>
          <Text className="text-xs text-gray-400">Xin chào, {user?.name?.split(' ').pop()}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Stats Grid */}
        <View className="px-4 pt-5 pb-2">
          <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Tổng quan học tập
          </Text>
          {enrollLoading ? (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color="#e11d48" />
            </View>
          ) : (
            <View className="flex-row flex-wrap gap-3">
              {stats.map((stat, idx) => (
                <View
                  key={idx}
                  className={`${stat.bg} rounded-2xl p-4 flex-1 min-w-[44%] border border-white shadow-sm`}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="bg-white rounded-full p-2 shadow-sm">{stat.icon}</View>
                  </View>
                  <Text className="text-3xl font-extrabold text-gray-900">{stat.value}</Text>
                  <Text className="text-xs text-gray-500 font-medium mt-0.5">{stat.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Recent Courses */}
        <View className="px-4 pt-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Khóa học gần đây
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'MyLearningTab' })}>
              <Text className="text-rose-500 text-sm font-medium">Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          {enrollments.length === 0 ? (
            <View className="bg-white rounded-2xl p-6 items-center border border-gray-100">
              <BookOpen size={36} color="#d1d5db" />
              <Text className="text-gray-400 text-sm mt-2 text-center">
                Bạn chưa đăng ký khóa học nào
              </Text>
              <TouchableOpacity
                className="mt-4 bg-rose-500 px-5 py-2.5 rounded-full"
                onPress={() => navigation.navigate('MainTabs', { screen: 'CoursesTab' })}
              >
                <Text className="text-white font-semibold text-sm">Khám phá ngay</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="gap-3">
              {enrollments.slice(0, 4).map((enrollment) => {
                const course = enrollment?.course;
                if (!course) return null;
                const progress = enrollment?.learningProgress?.percentage ?? 0;

                const isActivated = enrollment.isActivated;
                const isExpired = enrollment.endedAt && new Date(enrollment.endedAt) < new Date();

                return (
                  <TouchableOpacity
                    key={enrollment._id}
                    className="bg-white rounded-2xl p-3 flex-row items-center border border-gray-100 shadow-sm"
                    onPress={() => {
                      if (isExpired || !isActivated) {
                        navigation.navigate('CourseDetail', { slug: course.slug, courseId: course._id });
                      } else {
                        navigation.navigate('Learning', { slug: course.slug });
                      }
                    }}
                    activeOpacity={0.75}
                  >
                    <Image
                      source={getImageSource(course.thumbnail)}
                      style={{ width: 60, height: 60, borderRadius: 10 }}
                      contentFit="cover"
                    />
                    <View className="flex-1 ml-3">
                      <Text className="font-semibold text-gray-900 text-sm" numberOfLines={2}>
                        {course.title}
                      </Text>
                      {/* Progress bar or status */}
                      <View className="mt-2">
                        {isExpired ? (
                          <Text className="text-xs font-semibold text-red-500">Đã hết hạn học</Text>
                        ) : !isActivated ? (
                          <Text className="text-xs font-semibold text-amber-500">Chưa kích hoạt - Nhấp để kích hoạt</Text>
                        ) : (
                          <>
                            <View className="flex-row justify-between mb-1">
                              <Text className="text-xs text-gray-400">Tiến độ</Text>
                              <Text className="text-xs text-rose-500 font-semibold">{progress}%</Text>
                            </View>
                            <View className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <View
                                className="bg-rose-500 h-full rounded-full"
                                style={{ width: `${progress}%` }}
                              />
                            </View>
                          </>
                        )}
                      </View>
                    </View>
                    <ChevronRight size={18} color="#9ca3af" className="ml-2" />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>


      </ScrollView>
    </SafeAreaView>
  );
};

export default DashboardScreen;
