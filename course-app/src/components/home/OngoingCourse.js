import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { PlayCircle } from 'lucide-react-native';
import ProgressBar from '../common/ProgressBar';
import { useNavigation } from '@react-navigation/native';

const OngoingCourse = ({ enrollment }) => {
  const navigation = useNavigation();

  if (!enrollment || !enrollment.course) return null;

  const { course, progress } = enrollment;
  // Tính phần trăm hoàn thành (nếu backend trả về completedLessons)
  const percentage = progress?.percentage || 0; 
  // Hoặc logic tính tay: (progress.completedLectures.length / course.totalLectures) * 100

  const handleContinue = () => {
    // Điều hướng sang trang Learning (Học) thay vì trang Chi tiết
    navigation.navigate('CourseDetail', { 
      slug: course.slug, 
      courseId: course._id,
      screen: 'Learning' // Tham số báo hiệu muốn vào học luôn
    });
  };

  return (
    <View className="mb-8">
      <View className="flex-row justify-between items-center mb-4 px-5">
        <Text className="text-lg font-bold text-gray-900">Ongoing Course</Text>
        <TouchableOpacity onPress={() => navigation.navigate('MyLearning')}>
             <Text className="text-rose-500 text-sm font-medium">See All</Text>
        </TouchableOpacity>
      </View>

      <View className="mx-5 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex-row items-center">
        {/* Thumbnail nhỏ */}
        <Image 
          source={{ uri: course.thumbnail || 'https://via.placeholder.com/100' }} 
          className="w-20 h-20 rounded-xl bg-gray-200"
          resizeMode="cover"
        />

        {/* Info */}
        <View className="flex-1 ml-4 justify-between h-20 py-1">
          <View>
            <Text numberOfLines={1} className="font-bold text-gray-900 text-base mb-1">
              {course.title}
            </Text>
            <Text className="text-xs text-gray-500 mb-2">
              {progress?.completedLectures?.length || 0} / {course.totalLectures || 0} Lessons
            </Text>
          </View>
          
          {/* Progress Bar */}
          <ProgressBar progress={percentage} showText={false} />
        </View>

        {/* Play Button */}
        <TouchableOpacity 
          onPress={handleContinue}
          className="absolute right-4 bottom-4 bg-rose-500 rounded-full p-2 shadow-sm shadow-rose-300"
        >
          <PlayCircle size={20} color="white" fill="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OngoingCourse;