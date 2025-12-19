import React, { useEffect } from 'react';
import { ScrollView, View, ActivityIndicator, Text, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { getCourseDetails, resetCourse } from '../../features/course/courseSlice';
import { fetchMyEnrollments } from "../../features/enrollment/enrollmentSlice";
import { useRoute, useNavigation } from '@react-navigation/native';

import CourseHeaderMobile from '../../components/course/CourseHeaderMobile';
import IncludesCardMobile from '../../components/course/IncludesCardMobile';
import FeaturesCardMobile from '../../components/course/FeaturesCardMobile';
import CourseOverviewMobile from '../../components/course/CourseOverviewMobile';
import CourseAccordionMobile from '../../components/course/CourseAccordionMobile';
import InstructorBioMobile from '../../components/course/InstructorBioMobile';
import ReviewListMobile from '../../components/course/ReviewListMobile';
import ReviewFormMobile from '../../components/course/ReviewFormMobile';
import DiscussionMobile from '../../components/course/DiscussionMobile';
import { fetchReviews } from '../../features/review/reviewSlice';

const CourseDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { slug } = route.params || {};

  const { course, reviewCount, isLoading, isError, message } = useSelector(state => state.course);
  const enrolledCourseIds = useSelector(state => state.enrollment.enrolledCourseIds);
  const reviewList = useSelector(state => state.review.reviews);
  const user = useSelector(state => state.auth.user);

  useEffect(() => {
    if (slug) dispatch(getCourseDetails(slug));
    dispatch(fetchMyEnrollments());
    return () => dispatch(resetCourse());
  }, [slug, dispatch]);

  useEffect(() => {
    if (course?._id) dispatch(fetchReviews(course._id));
  }, [course?._id, dispatch]);

  if (isLoading || !course) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#e11d48" />
        <Text>Đang tải khóa học...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-red-500">{message || 'Không thể tải khóa học.'}</Text>
      </View>
    );
  }

  const isEnrolled = enrolledCourseIds?.includes(String(course?._id));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingTop: 0 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <CourseHeaderMobile course={course} isEnrolled={isEnrolled} reviewCount={reviewCount} />
          <IncludesCardMobile course={course} />
          <FeaturesCardMobile course={course} />
          <CourseOverviewMobile course={course} />
          <CourseAccordionMobile sections={course.sections} />
          <InstructorBioMobile instructor={course.instructor} />
          <ReviewListMobile reviews={reviewList} />
          <ReviewFormMobile courseId={course._id} />

          {/* Nút chuyển sang trang thảo luận */}
          <View className="px-4 mb-8">
            <TouchableOpacity
              className="bg-blue-500 py-3 rounded-lg"
              onPress={() => navigation.navigate('DiscussionScreen', {
                courseId: course._id,
                isEnrolled,
              })}
            >
              <Text className="text-white text-center font-bold text-base">Thảo luận khóa học</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CourseDetailScreen;