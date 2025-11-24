import Progress from './progress.model.js';
import Course from '../course/course.model.js';
import Lecture from '../course/lecture.model.js';

const getCourseBySlug = async (slug) => {
  const course = await Course.findOne({ slug }).select('_id totalLectures');
  
  if (!course) {
    const error = new Error('Khóa học không tồn tại.');
    error.statusCode = 404;
    throw error;
  }
  return course;
};

export const getCourseProgress = async (userId, courseSlug) => {
    const course = await getCourseBySlug(courseSlug);
    let progress = await Progress.findOne({ student: userId, course: course._id });

    if (!progress) {
    progress = await Progress.create({
      student: userId,
      course: course._id,
      completedLectures: [],
      percentage: 0
    });
  }

  return progress;
};

export const toggleLectureCompletion = async (userId, courseSlug, lectureId) => {
    const course = await getCourseBySlug(courseSlug);
    let progress = await Progress.findOne({ student: userId, course: course._id });
    if (!progress) {
        progress = new Progress({
            student: userId,
            course: course._id,
            completedLectures: [],
      percentage: 0
    });
  }

  const lectureIndex = progress.completedLectures.findIndex(
    (id) => id.toString() === lectureId
  );

  if (lectureIndex > -1) {
    progress.completedLectures.splice(lectureIndex, 1);
  } else {
    progress.completedLectures.push(lectureId);
  }

  const totalLectures = course.totalLectures || 1;
  const completedCount = progress.completedLectures.length;
  
  progress.percentage = Math.round((completedCount / totalLectures) * 100);
  
  if (progress.percentage > 100) progress.percentage = 100;

  await progress.save();

  return progress;
};