import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchLearningCourse,
  setCurrentLecture,
  toggleLecture,
  resetLearning,
  fetchVideoProgress,
  saveVideoProgress,
} from "../features/learning/learningSlice";
import Spinner from "../components/common/Spinner";
import CoursePlayer from "../components/learning/CoursePlayer";

const LearningPage = () => {
  const { slug, lectureId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { course, sections, progress, currentLecture, lastWatchedTime, isLoading } =
    useSelector((state) => state.learning);
  const user = useSelector((state) => state.auth.user);

  // ─── Effect 1: slug thay đổi → reset + fetch mới ──────────────────────────
  useEffect(() => {
    if (!slug) return;
    dispatch(resetLearning());
    dispatch(fetchLearningCourse(slug));
  }, [dispatch, slug]);

  // ─── Effect 2: Course load xong → set currentLecture từ URL ───────────────
  useEffect(() => {
    if (!course) return;

    const allLectures = course.sections.flatMap((s) => s.lectures);

    if (lectureId) {
      const lectureToPlay = allLectures.find((l) => l._id === lectureId);
      if (lectureToPlay) {
        dispatch(setCurrentLecture(lectureToPlay));
      } else {
        const first = allLectures[0];
        if (first)
          navigate(`/courses/${slug}/learn/lecture/${first._id}`, { replace: true });
      }
    } else {
      const first = allLectures[0];
      if (first)
        navigate(`/courses/${slug}/learn/lecture/${first._id}`, { replace: true });
    }
  }, [course, lectureId, dispatch, navigate, slug]);

  // ─── Effect 3: Khi currentLecture thay đổi → lấy last_watched_time ────────
  useEffect(() => {
    if (!currentLecture?._id || !slug) return;
    dispatch(fetchVideoProgress({ courseSlug: slug, lectureId: currentLecture._id }));
  }, [currentLecture?._id, slug, dispatch]);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleBackToOverview = () => {
    navigate(`/courses/${slug}/overview`);
  };

  const handleSelectLecture = (lecture) => {
    navigate(`/courses/${slug}/learn/lecture/${lecture._id}`);
  };

  const handleNavigateLecture = (direction) => {
    if (!currentLecture || !sections.length) return;
    const allLectures = sections.flatMap((s) => s.lectures);
    const currentIndex = allLectures.findIndex((l) => l._id === currentLecture._id);
    const nextIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;

    if (nextIndex >= 0 && nextIndex < allLectures.length) {
      navigate(`/courses/${slug}/learn/lecture/${allLectures[nextIndex]._id}`);
    }
  };

  const handleToggleComplete = () => {
    if (course && currentLecture) {
      dispatch(
        toggleLecture({
          courseSlug: course.slug,
          lectureId: currentLecture._id,
        })
      );
    }
  };

  /**
   * Handler nhận onProgress từ VideoPlayer (mỗi 10s)
   * Dispatch saveVideoProgress để lưu lên server
   */
  const handleVideoProgress = (watchedSeconds) => {
    if (!currentLecture?._id || !slug) return;
    dispatch(
      saveVideoProgress({
        courseSlug: slug,
        lectureId: currentLecture._id,
        watchedSeconds,
      })
    );
  };

  // ─── Loading / guard ────────────────────────────────────────────────────────
  if (isLoading || !course || !currentLecture) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <Spinner color="border-rose-500" />
      </div>
    );
  }

  // ─── Tính toán instructor ───────────────────────────────────────────────────
  const instructorId = course?.instructor
    ? typeof course.instructor === "object"
      ? course.instructor._id
      : course.instructor
    : null;
  const isInstructor = user && instructorId && user._id === String(instructorId);
  const isEnrolled = true;

  return (
    <CoursePlayer
      course={course}
      sections={sections}
      progress={progress}
      currentLecture={currentLecture}
      lastWatchedTime={lastWatchedTime}
      courseSlug={slug}
      onBack={handleBackToOverview}
      onNext={() => handleNavigateLecture("next")}
      onPrev={() => handleNavigateLecture("prev")}
      onToggleComplete={handleToggleComplete}
      onSelectLecture={handleSelectLecture}
      onVideoProgress={handleVideoProgress}
      user={user}
      isEnrolled={isEnrolled}
      isInstructor={isInstructor}
    />

  );
};

export default LearningPage;
