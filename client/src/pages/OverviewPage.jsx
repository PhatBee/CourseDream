import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLearningCourse, resetLearning } from '../features/learning/learningSlice';
import Spinner from '../components/common/Spinner';
import { ArrowLeft } from 'lucide-react';
import CourseOverview from '../components/learning/CourseOverview';

const OverviewPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { course, progress, isLoading } = useSelector((state) => state.learning);

  useEffect(() => {
    if (slug) {
        dispatch(fetchLearningCourse(slug));
    }
  }, [dispatch, slug]);

  const handlePlayLecture = (lecture) => {
    navigate(`/courses/${slug}/learn/lecture/${lecture._id}`);
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-gray-50"><Spinner color="border-rose-500" /></div>;
  if (!course) return null;

  return (
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
          <header className="bg-white border-b border-gray-200 h-16 flex items-center px-6 shadow-sm sticky top-0 z-30 justify-between">
              <div className="flex items-center gap-4">
                  <button 
                    onClick={() => navigate('/profile/enrolled-courses')} 
                    className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500 hover:text-gray-900"
                  >
                      <ArrowLeft size={20} />
                  </button>
                  <h1 className="font-bold text-lg text-gray-800 truncate max-w-xl">{course.title}</h1>
              </div>
              <div className="hidden md:block">
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                    Learning Dashboard
                  </span>
              </div>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
              <CourseOverview 
                  course={course}
                  progress={progress}
                  onPlayLecture={handlePlayLecture}
              />
          </div>
      </div>
  );
};

export default OverviewPage;