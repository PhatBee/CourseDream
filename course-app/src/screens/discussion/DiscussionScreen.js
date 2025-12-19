import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import DiscussionMobile from '../../components/course/DiscussionMobile';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { courseApi } from '../../api/courseApi';
import { fetchMyEnrollments } from '../../features/enrollment/enrollmentSlice';

const DiscussionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { courseSlug, highlightReplyId } = route.params || {};
  const dispatch = useDispatch();

  const [courseId, setCourseId] = useState(null);
  const [loadingCourse, setLoadingCourse] = useState(true);

  useEffect(() => {
    dispatch(fetchMyEnrollments());
  }, [dispatch]);

  useEffect(() => {
    const fetchCourseId = async () => {
      if (courseSlug) {
        try {
          const res = await courseApi.getDetailsBySlug(courseSlug);
          setCourseId(res.data?.data?.course?._id);
        } catch (err) {
          setCourseId(null);
        } finally {
          setLoadingCourse(false);
        }
      }
    };
    fetchCourseId();
  }, [courseSlug]);

  const user = useSelector(state => state.auth.user);
  const enrolledCourseIds = useSelector(state => state.enrollment.enrolledCourseIds);
  const enrollLoading = useSelector(state => state.enrollment.isLoading);

  const isEnrolled = courseId && enrolledCourseIds?.includes(String(courseId));

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-6 py-4 border-b border-gray-100">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-xl font-bold">Thảo luận khóa học</Text>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={80}
      >
        <DiscussionMobile
          courseId={courseId}
          isEnrolled={isEnrolled}
          user={user}
          highlightReplyId={highlightReplyId}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default DiscussionScreen;