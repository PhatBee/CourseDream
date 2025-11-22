import Wishlist from './wishlist.model.js';
import Course from '../course/course.model.js'; 

/**
 * Lấy danh sách yêu thích của user
 */
export const getWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({ student: userId })
    .populate({
      path: 'courses',
      // Chỉ lấy các trường cần thiết để hiển thị card khóa học
      select: 'title slug thumbnail price priceDiscount level instructor rating studentsCount totalLectures totalHours',
      populate: {
        path: 'instructor',
        select: 'name avatar'
      }
    });

  if (!wishlist) {
    return [];
  }

  return wishlist.courses;
};

/**
 * Thêm khóa học vào wishlist
 */
export const addToWishlist = async (userId, courseId) => {
  const course = await Course.findById(courseId);
  if (!course) {
    const error = new Error('Khóa học không tồn tại.');
    error.statusCode = 404;
    throw error;
  }

  let wishlist = await Wishlist.findOne({ student: userId });

  if (!wishlist) {
    wishlist = await Wishlist.create({
      student: userId,
      courses: [courseId]
    });
  } else {

    if (wishlist.courses.includes(courseId)) {
      const error = new Error('Khóa học đã được thêm vào trước đó.');
      error.statusCode = 400;
      throw error;
    }
    
    wishlist.courses.push(courseId);
    await wishlist.save();
  }

  return { message: 'Đã thêm vào danh sách yêu thích.' };
};

/**
 * Xóa 1 khóa học khỏi wishlist
 */
export const removeFromWishlist = async (userId, courseId) => {
  const wishlist = await Wishlist.findOne({ student: userId });

  if (!wishlist) {
    const error = new Error('Danh sách yêu thích không tồn tại.');
    error.statusCode = 404;
    throw error;
  }

  wishlist.courses = wishlist.courses.filter(
    (id) => id.toString() !== courseId
  );

  await wishlist.save();

  return { message: 'Đã xóa khỏi danh sách yêu thích.' };
};

/**
 * Xóa tất cả khóa học trong wishlist
 */
export const clearWishlist = async (userId) => {
  const wishlist = await Wishlist.findOne({ student: userId });

  if (wishlist) {
    wishlist.courses = [];
    await wishlist.save();
  }

  return { message: 'Đã xóa tất cả danh sách yêu thích.' };
};