import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronLeft } from 'lucide-react-native';

// Import Actions & Components
import { fetchLearningCourse, setCurrentLecture, toggleLecture } from '../../features/learning/learningSlice'; //
import VideoPlayer from '../../components/learning/VideoPlayer';
import LearningTabs from '../../components/learning/LearningTabs';
import CurriculumList from '../../components/learning/CurriculumList';

const LearningScreen = ({ route, navigation }) => {
  const { slug } = route.params;
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('Lectures');

  const { course, sections, currentLecture, progress, isLoading } = useSelector(
    (state) => state.learning
  );

  const handleToggleComplete = async (lectureId) => {
    await dispatch(toggleLecture({
      courseSlug: slug,
      lectureId: lectureId
    }));
  };

  useEffect(() => {
    if (slug) {
      dispatch(fetchLearningCourse(slug));
    }
  }, [dispatch, slug]);

  const handleLecturePress = (lecture) => {
    dispatch(setCurrentLecture(lecture));
  };

  if (isLoading || !course) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#e11d48" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="light-content" backgroundColor="black" />

      {/* 1. VIDEO PLAYER AREA */}
      <View>
        {/* Custom Back Button overlay */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="absolute top-12 left-4 z-10 bg-black/50 p-2 rounded-full"
        >
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>

        <VideoPlayer
          currentLecture={currentLecture}
          thumbnail={course.thumbnail}
          onComplete={() => {
            const isCompleted = progress?.completedLectures?.includes(currentLecture?._id);
            if (!isCompleted) {
              handleToggleComplete(currentLecture?._id);
            }
          }}
        />
      </View>

      {/* 2. COURSE INFO & TABS */}
      <View className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Title Section */}
          <View className="p-5 pb-2">
            <Text className="text-xl font-bold text-gray-900 leading-7 mb-1">
              {course.title}
            </Text>
            <Text className="text-gray-500 text-xs">
              {course.instructor?.name || 'Instructor'}
            </Text>
          </View>

          {/* Tab Selector */}
          <LearningTabs activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* 3. CONTENT AREA */}
          {activeTab === 'Lectures' ? (
            <CurriculumList
              sections={sections}
              currentLecture={currentLecture}
              completedLectures={progress?.completedLectures || []}
              onLecturePress={handleLecturePress}
              onToggleComplete={handleToggleComplete}
            />
          ) : (
            <View className="p-5">
              <Text className="text-base font-bold mb-2">About this course</Text>
              <Text className="text-gray-600 leading-5">
                {course.description || 'No description available.'}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

export default LearningScreen;