import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchLearningCourse,
  setCurrentLecture,
  toggleLecture,
  resetLearning,
} from "../features/learning/learningSlice";
import Spinner from "../components/common/Spinner";
import CoursePlayer from "../components/learning/CoursePlayer";

const LearningPage = () => {
  const { slug, lectureId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { course, sections, progress, currentLecture, isLoading } = useSelector(
    (state) => state.learning,
  );
  const user = useSelector((state) => state.auth.user); // <== THÊM DÒNG NÀY

  // ─── Effect 1: Mỗi lần slug thay đổi → reset + fetch mới ───────────────────
  // Dùng resetLearning trước để đảm bảo state sạch (tránh lecture cũ bị giữ).
  useEffect(() => {
    if (!slug) return;
    dispatch(resetLearning());
    dispatch(fetchLearningCourse(slug));
  }, [dispatch, slug]);

  // ─── Effect 2: Sau khi course load xong → set currentLecture từ URL ─────────
  // Chờ course có data mới tìm lecture theo lectureId.
  useEffect(() => {
    if (!course) return;

    const allLectures = course.sections.flatMap((s) => s.lectures);

    if (lectureId) {
      // Trường hợp có lectureId trên URL → tìm đúng bài đó
      const lectureToPlay = allLectures.find((l) => l._id === lectureId);
      if (lectureToPlay) {
        dispatch(setCurrentLecture(lectureToPlay));
      } else {
        // lectureId không tồn tại → redirect về bài đầu
        const first = allLectures[0];
        if (first)
          navigate(`/courses/${slug}/learn/lecture/${first._id}`, {
            replace: true,
          });
      }
    } else {
      // Không có lectureId → redirect về bài đầu tiên
      const first = allLectures[0];
      if (first)
        navigate(`/courses/${slug}/learn/lecture/${first._id}`, {
          replace: true,
        });
    }
  }, [course, lectureId, dispatch, navigate, slug]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleBackToOverview = () => {
    navigate(`/courses/${slug}/overview`);
  };

  const handleSelectLecture = (lecture) => {
    navigate(`/courses/${slug}/learn/lecture/${lecture._id}`);
  };

  const handleNavigateLecture = (direction) => {
    if (!currentLecture || !sections.length) return;
    const allLectures = sections.flatMap((s) => s.lectures);
    const currentIndex = allLectures.findIndex(
      (l) => l._id === currentLecture._id,
    );
    const nextIndex =
      direction === "next" ? currentIndex + 1 : currentIndex - 1;

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
        }),
      );
    }
  };

  // ─── Loading / guard ────────────────────────────────────────────────────────
  if (isLoading || !course || !currentLecture) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <Spinner color="border-rose-500" />
      </div>
    );
  }

  // ─── Tính toán Instructor (thêm vào trước khi `return`)
  const instructorId = course?.instructor
    ? typeof course.instructor === "object"
      ? course.instructor._id
      : course.instructor
    : null;
  const isInstructor =
    user && instructorId && user._id === String(instructorId);
  const isEnrolled = true; // Trong trang học bài chắc chắn là đã enrolled hoặc là instructor

  return (
    <CoursePlayer
      course={course}
      sections={sections}
      progress={progress}
      currentLecture={currentLecture}
      onBack={handleBackToOverview}
      onNext={() => handleNavigateLecture("next")}
      onPrev={() => handleNavigateLecture("prev")}
      onToggleComplete={handleToggleComplete}
      onSelectLecture={handleSelectLecture}
      // THÊM: Truyền props để dùng cho Discussion
      user={user}
      isEnrolled={isEnrolled}
      isInstructor={isInstructor}
    />
  );
};

export default LearningPage;
