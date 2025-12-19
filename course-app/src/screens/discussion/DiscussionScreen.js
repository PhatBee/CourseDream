import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
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
  const { courseId: paramCourseId, courseSlug, highlightReplyId } = route.params || {};
  const dispatch = useDispatch();

  const [courseId, setCourseId] = useState(paramCourseId || null);
  const [loadingCourse, setLoadingCourse] = useState(!paramCourseId);

  useEffect(() => {
    dispatch(fetchMyEnrollments());
  }, [dispatch]);

  useEffect(() => {
    // Nếu chưa có courseId nhưng có slug thì fetch từ slug
    if (!courseId && courseSlug) {
      const fetchCourseId = async () => {
        try {
          const res = await courseApi.getDetailsBySlug(courseSlug);
          setCourseId(res.data?.data?.course?._id);
        } catch (err) {
          setCourseId(null);
        } finally {
          setLoadingCourse(false);
        }
      };
      fetchCourseId();
    } else {
      setLoadingCourse(false);
    }
  }, [courseId, courseSlug]);

  const user = useSelector(state => state.auth.user);
  const enrolledCourseIds = useSelector(state => state.enrollment.enrolledCourseIds);
  const enrollLoading = useSelector(state => state.enrollment.isLoading);

  const isEnrolled = courseId && enrolledCourseIds?.includes(String(courseId));

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0} // Điều chỉnh nếu có header
    >
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center px-6 py-4 border-b border-gray-100">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
            <ArrowLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-xl font-bold">Thảo luận khóa học</Text>
        </View>
        {/* BỎ KeyboardAvoidingView, chỉ render DiscussionMobile */}
        <DiscussionMobile
          courseId={courseId}
          isEnrolled={isEnrolled}
          user={user}
          highlightReplyId={highlightReplyId}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default DiscussionScreen;