import React, { useEffect } from 'react';
import { ScrollView, View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { getCourseDetails, resetCourse } from '../../features/course/courseSlice';
import { fetchMyEnrollments } from "../../features/enrollment/enrollmentSlice";
import { useRoute, useNavigation } from '@react-navigation/native';

import CourseHeaderMobile from '../../components/course/CourseHeaderMobile';
import CourseOverviewMobile from '../../components/course/CourseOverviewMobile';
import CourseAccordionMobile from '../../components/course/CourseAccordionMobile';
import InstructorBioMobile from '../../components/course/InstructorBioMobile';
import ReviewListMobile from '../../components/course/ReviewListMobile';

const CourseDetailScreen = () => {
  const route = useRoute();
  const dispatch = useDispatch();
  const { slug } = route.params || {};

  const { course, reviews, reviewCount, isLoading, isError, message } = useSelector(state => state.course);
  const enrolledCourseIds = useSelector(state => state.enrollment.enrolledCourseIds);

  useEffect(() => {
    if (slug) dispatch(getCourseDetails(slug));
    dispatch(fetchMyEnrollments());
    return () => dispatch(resetCourse());
  }, [slug, dispatch]);

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
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24, paddingTop: 0 }}
        showsVerticalScrollIndicator={false}
      >
        <CourseHeaderMobile course={course} isEnrolled={isEnrolled} reviewCount={reviewCount} />
        <CourseOverviewMobile course={course} />
        <CourseAccordionMobile sections={course.sections} />
        <InstructorBioMobile instructor={course.instructor} />
        <ReviewListMobile reviews={reviews} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default CourseDetailScreen;