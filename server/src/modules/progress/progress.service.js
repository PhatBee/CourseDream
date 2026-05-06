import Progress from './progress.model.js';
import Course from '../course/course.model.js';

const getCourseBySlug = async (slug) => {
  const course = await Course.findOne({ slug }).select('_id totalLectures');
  if (!course) {
    const error = new Error('Khóa học không tồn tại.');
    error.statusCode = 404;
    throw error;
  }
  return course;
};

// ─── Helper: tìm/tạo progress record ────────────────────────────────────────
const findOrCreateProgress = async (userId, courseId) => {
  let progress = await Progress.findOne({ student: userId, course: courseId });
  if (!progress) {
    progress = new Progress({
      student: userId,
      course: courseId,
      completedLectures: [],
      watchTimes: [],
      percentage: 0,
    });
  }
  return progress;
};

// ─── getCourseProgress ───────────────────────────────────────────────────────
export const getCourseProgress = async (userId, courseSlug) => {
  const course = await getCourseBySlug(courseSlug);
  const progress = await findOrCreateProgress(userId, course._id);
  if (progress.isNew) await progress.save();
  return progress;
};

// ─── toggleLectureCompletion ─────────────────────────────────────────────────
export const toggleLectureCompletion = async (userId, courseSlug, lectureId) => {
  const course = await getCourseBySlug(courseSlug);
  const progress = await findOrCreateProgress(userId, course._id);

  const lectureIndex = progress.completedLectures.findIndex(
    (id) => id.toString() === lectureId
  );

  if (lectureIndex > -1) {
    progress.completedLectures.splice(lectureIndex, 1);
  } else {
    progress.completedLectures.push(lectureId);
  }

  const totalLectures = course.totalLectures || 1;
  progress.percentage = Math.min(
    100,
    Math.round((progress.completedLectures.length / totalLectures) * 100)
  );

  await progress.save();
  return progress;
};

// ─── saveVideoProgress — Lưu thời gian xem video (gọi mỗi 10s) ─────────────
/**
 * @param {string} userId
 * @param {string} courseSlug
 * @param {string} lectureId
 * @param {number} watchedSeconds - thời điểm hiện tại (giây)
 */
export const saveVideoProgress = async (userId, courseSlug, lectureId, watchedSeconds) => {
  const course = await getCourseBySlug(courseSlug);

  // Đảm bảo progress document tồn tại
  await Progress.findOneAndUpdate(
    { student: userId, course: course._id },
    {
      $setOnInsert: {
        student: userId,
        course: course._id,
        completedLectures: [],
        watchTimes: [],
        percentage: 0,
      },
    },
    { upsert: true, new: true }
  );

  // Cập nhật watchTime nếu entry đã tồn tại
  const updateResult = await Progress.updateOne(
    { student: userId, course: course._id, 'watchTimes.lecture': lectureId },
    {
      $set: {
        'watchTimes.$.watchedSeconds': watchedSeconds,
        'watchTimes.$.updatedAt': new Date(),
      },
    }
  );

  // Nếu không có entry thì push mới
  const existsInDb = await Progress.findOne({
    student: userId,
    course: course._id,
    'watchTimes.lecture': lectureId,
  });

  if (!existsInDb) {
    await Progress.updateOne(
      { student: userId, course: course._id },
      {
        $push: { watchTimes: { lecture: lectureId, watchedSeconds } },
      },
      { upsert: true }
    );
  }

  return { lectureId, watchedSeconds };
};

// ─── getVideoProgress — Lấy last_watched_time của một bài giảng ─────────────
/**
 * @returns {{ lectureId, watchedSeconds }}
 */
export const getVideoProgress = async (userId, courseSlug, lectureId) => {
  const course = await getCourseBySlug(courseSlug);
  const progress = await Progress.findOne(
    { student: userId, course: course._id },
    { watchTimes: 1 }
  );

  if (!progress) return { lectureId, watchedSeconds: 0 };

  const entry = progress.watchTimes.find(
    (w) => w.lecture.toString() === lectureId
  );

  return { lectureId, watchedSeconds: entry ? entry.watchedSeconds : 0 };
};