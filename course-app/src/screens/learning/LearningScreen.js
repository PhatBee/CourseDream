import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { ChevronLeft } from "lucide-react-native";

// Import Actions & Components
import {
  fetchLearningCourse,
  setCurrentLecture,
  toggleLecture,
  resetLearning,
} from "../../features/learning/learningSlice";
import VideoPlayer from "../../components/learning/VideoPlayer";
import LearningTabs from "../../components/learning/LearningTabs";
import CurriculumList from "../../components/learning/CurriculumList";
import DiscussionMobile from "../../components/course/DiscussionMobile";

const LearningScreen = ({ route, navigation }) => {
  // 1. Lấy toàn bộ tham số được Notification truyền tải sang
  const { slug, discussionId, replyId } = route.params || {};
  const dispatch = useDispatch();

  // 2. Nếu có discussionId -> Tự động select activeTab là "Discussions"
  const [activeTab, setActiveTab] = useState(
    discussionId ? "Discussions" : "Lectures",
  );

  const { course, sections, currentLecture, progress, isLoading } = useSelector(
    (state) => state.learning,
  );

  const { user } = useSelector((state) => state.auth);

  const handleToggleComplete = async (lectureId) => {
    await dispatch(
      toggleLecture({
        courseSlug: slug,
        lectureId: lectureId,
      }),
    );
  };

  useEffect(() => {
    if (slug) {
      dispatch(fetchLearningCourse(slug));
    }
    return () => {
      dispatch(resetLearning());
    };
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
            const isCompleted = progress?.completedLectures?.includes(
              currentLecture?._id,
            );
            if (!isCompleted) {
              handleToggleComplete(currentLecture?._id);
            }
          }}
        />
      </View>

      {/* 2. COURSE INFO & TABS */}
      <View className="flex-1">
        {/* NẾU KHÔNG PHẢI TAB THẢO LUẬN, BỌC TRONG SCROLL-VIEW BÌNH THƯỜNG QUẢN LÝ BÀI GIẢNG O */}
        {activeTab !== "Discussions" ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="p-5 pb-2">
              <Text className="text-xl font-bold text-gray-900 leading-7 mb-1">
                {course.title}
              </Text>
              <Text className="text-gray-500 text-xs">
                {course.instructor?.name || "Instructor"}
              </Text>
            </View>

            <LearningTabs activeTab={activeTab} setActiveTab={setActiveTab} />

            {activeTab === "Lectures" && (
              <CurriculumList
                sections={sections}
                currentLecture={currentLecture}
                completedLectures={progress?.completedLectures || []}
                onLecturePress={handleLecturePress}
                onToggleComplete={handleToggleComplete}
              />
            )}

            {activeTab === "More" && (
              <View className="p-5">
                <Text className="text-base font-bold mb-2">
                  Thông tin khóa học
                </Text>
                <Text className="text-gray-600 leading-5">
                  {course.description || "Chưa có thông tin."}
                </Text>
              </View>
            )}
          </ScrollView>
        ) : (
          // === TRƯỜNG HỢP NÀY CHẠY TAB "THẢO LUẬN" ===
          <View className="flex-1">
            <View className="p-5 pb-2">
              <Text className="text-xl font-bold text-gray-900 leading-7 mb-1">
                {course.title}
              </Text>
              <Text className="text-gray-500 text-xs">
                {course.instructor?.name || "Instructor"}
              </Text>
            </View>
            <LearningTabs activeTab={activeTab} setActiveTab={setActiveTab} />
            {currentLecture ? (
              <DiscussionMobile
                courseId={course._id}
                lectureId={currentLecture._id}
                user={user}
              />
            ) : (
              <View className="p-6 items-center justify-center">
                <Text className="text-gray-500 text-center font-medium">
                  Bật một video trong Lectures để xem mục Hỏi Đáp tương ứng!
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

export default LearningScreen;
