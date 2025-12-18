import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Play } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchProgressData } from '../../features/learning/learningSlice';
import { useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { useCallback } from 'react';

const OngoingCourse = ({ enrollment }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const { progress } = useSelector(state => state.learning);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchProgressData(enrollment.course.slug));
    }, [dispatch, enrollment])
  );

  if (!enrollment || !enrollment.course) return null;

  const { course } = enrollment;

  const completedCount = progress?.completedLectures?.length || 0;
  const totalCount = course.totalLectures || 0;

  const calculatedPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const percentage = progress?.percentage ?? calculatedPercentage;

  const handleContinue = () => {
    navigation.navigate('Learning', {
      slug: course.slug
    });
  };

  const handleSeeAll = () => {
    navigation.navigate('MyLearningTab');
  };

  return (
    <View className="mb-8 w-full">
      <View className="flex-row justify-between items-center mb-4 px-5">
        <Text className="text-lg font-bold text-gray-900">Ongoing Course</Text>
        <TouchableOpacity onPress={handleSeeAll}>
          <Text className="text-rose-500 text-sm font-medium">See All</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={handleContinue}
        activeOpacity={0.9}
        className="mx-5 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex-row items-center"
        style={{
          shadowColor: "#e11d48",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 4
        }}
      >
        {/* Thumbnail Image */}
        <View className="relative">
          <Image
            source={{ uri: course.thumbnail?.url || course.thumbnail || 'https://via.placeholder.com/150' }}
            className="w-24 h-24 rounded-2xl bg-gray-100"
            contentFit="cover"
            transition={500}
          />
          <View className="absolute inset-0 justify-center items-center bg-black/10 rounded-2xl">
            <View className="bg-white/90 p-1.5 rounded-full">
              <Play size={12} color="#e11d48" fill="#e11d48" />
            </View>
          </View>
        </View>

        {/* Info & Progress */}
        <View className="flex-1 ml-4 justify-center py-1">
          <Text
            numberOfLines={2}
            className="font-bold text-gray-900 text-[15px] mb-2 leading-5"
          >
            {course.title}
          </Text>

          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs text-gray-500 font-medium">
              {completedCount} / {totalCount} Lessons
            </Text>
            <Text className="text-xs text-rose-500 font-bold">{Math.round(percentage)}%</Text>
          </View>

          {/* Progress Bar */}
          <View className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <View
              className="h-full bg-rose-500 rounded-full"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </View>
        </View>

        {/* Big Play Button */}
        <TouchableOpacity
          onPress={handleContinue}
          className="ml-2 w-10 h-10 bg-rose-500 rounded-full items-center justify-center shadow-md shadow-rose-300"
        >
          <Play size={18} color="white" fill="white" style={{ marginLeft: 2 }} />
        </TouchableOpacity>

      </TouchableOpacity>
    </View>
  );
};

export default OngoingCourse;