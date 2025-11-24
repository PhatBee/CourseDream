import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLearningCourse, setCurrentLecture, toggleLecture } from '../features/learning/learningSlice';
import Spinner from '../components/common/Spinner';
import CoursePlayer from '../components/learning/CoursePlayer';

const LearningPage = () => {
  const { slug, lectureId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { course, sections, progress, currentLecture, isLoading } = useSelector((state) => state.learning);

  useEffect(() => {
    if (slug && !course) {
        dispatch(fetchLearningCourse(slug));
    }
  }, [dispatch, slug, course]);

  useEffect(() => {
    if (course && lectureId) {
        const allLectures = course.sections.flatMap(s => s.lectures);
        const lectureToPlay = allLectures.find(l => l._id === lectureId);
        
        if (lectureToPlay) {
            dispatch(setCurrentLecture(lectureToPlay));
        }
    }
  }, [course, lectureId, dispatch]);

  const handleBackToOverview = () => {
    navigate(`/courses/${slug}/overview`);
  };

  const handleSelectLecture = (lecture) => {
    navigate(`/courses/${slug}/learn/lecture/${lecture._id}`);
  };

  const handleNavigateLecture = (direction) => {
    if (!currentLecture || !sections.length) return;
    const allLectures = sections.flatMap(s => s.lectures);
    const currentIndex = allLectures.findIndex(l => l._id === currentLecture._id);
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

    if (nextIndex >= 0 && nextIndex < allLectures.length) {
        const nextLecture = allLectures[nextIndex];
        navigate(`/courses/${slug}/learn/lecture/${nextLecture._id}`);
    }
  };

  const handleToggleComplete = () => {
      if (course && currentLecture) {
          dispatch(toggleLecture({ 
              courseSlug: course.slug, 
              lectureId: currentLecture._id
          }));
      }
  };

  if (isLoading || !course || !currentLecture) return <div className="h-screen flex items-center justify-center bg-gray-900"><Spinner color="border-rose-500" /></div>;

  return (
      <CoursePlayer 
          course={course}
          sections={sections}
          progress={progress}
          currentLecture={currentLecture}
          onBack={handleBackToOverview}
          onNext={() => handleNavigateLecture('next')}
          onPrev={() => handleNavigateLecture('prev')}
          onToggleComplete={handleToggleComplete}
          onSelectLecture={handleSelectLecture}
      />
  );
};

export default LearningPage;