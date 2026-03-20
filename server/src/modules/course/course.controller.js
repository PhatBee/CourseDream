// src/modules/course/course.controller.js
import Course from './course.model.js';
import * as courseService from './course.service.js';
import { generatePresignedUploadUrl, buildS3Key, getCDNUrl, generateSignedVideoUrl, extractKeyFromCDNUrl } from '../../config/aws.js';
import Lecture from './lecture.model.js';

/**
 * @desc    Lấy chi tiết khóa học
 * @route   GET /api/v1/courses/:slug
 */
export const getCourseDetailsBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const data = await courseService.getCourseDetailsBySlug(slug);

    res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

export const getCourses = async (req, res, next) => {
  try {
    const result = await courseService.getAllCourses(req.query);

    res.status(200).json({
      success: true,
      data: result.courses,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy nội dung bài học (Private)
 * @route   GET /api/v1/courses/:slug/learn
 */
export const getLearningContent = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const userId = req.user.id;

    const data = await courseService.getLearningDetails(slug, userId);

    res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

export const searchCourses = async (req, res, next) => {
  try {
    const result = await courseService.searchCourses(req.query);
    return res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getLecture = async (req, res, next) => {
  try {
    const { courseId, lectureId } = req.params;
    const user = req.user;
    const result = await courseService.getLecture({ courseId, lectureId, user });

    if (result.error) {
      return res.status(result.error.status).json({ message: result.error.message });
    }
    return res.json({ lecture: result.lecture });
  } catch (err) {
    next(err);
  }
};

// ======================== AWS S3 VIDEO UPLOAD ========================

/**
 * @desc    Tạo Presigned URL để Frontend upload video trực tiếp lên S3
 * @route   POST /api/v1/courses/videos/presign-upload
 * @access  Private (Instructor | Admin)
 */
export const presignVideoUpload = async (req, res, next) => {
  try {
    const { fileName, fileType, courseSlug, lectureTitle } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({ success: false, message: 'Thiếu fileName hoặc fileType' });
    }

    // Chỉ cho phép file video
    if (!fileType.startsWith('video/')) {
      return res.status(400).json({ success: false, message: 'Chỉ hỗ trợ file video' });
    }

    const slug = courseSlug || 'temp';
    const title = lectureTitle || 'lecture';
    const key = buildS3Key.video(slug, title, fileName);

    const result = await generatePresignedUploadUrl(key, fileType, 1800); // 30 phút

    res.status(200).json({
      success: true,
      data: {
        uploadUrl: result.uploadUrl,
        key: result.key,
        cdnUrl: result.cdnUrl,
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Tạo Presigned URL để Frontend upload thumbnail trực tiếp lên S3
 * @route   POST /api/v1/courses/thumbnails/presign-upload
 * @access  Private (Instructor | Admin)
 */
export const presignThumbnailUpload = async (req, res, next) => {
  try {
    const { fileName, fileType, courseSlug } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({ success: false, message: 'Thiếu fileName hoặc fileType' });
    }

    if (!fileType.startsWith('image/')) {
      return res.status(400).json({ success: false, message: 'Chỉ hỗ trợ file ảnh' });
    }

    const slug = courseSlug || 'temp';
    const key = buildS3Key.thumbnail(slug, fileName);

    const result = await generatePresignedUploadUrl(key, fileType, 600); // 10 phút

    res.status(200).json({
      success: true,
      data: {
        uploadUrl: result.uploadUrl,
        key: result.key,
        cdnUrl: result.cdnUrl,
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Tạo Presigned URL để upload preview video của khóa học
 * @route   POST /api/v1/courses/previews/presign-upload
 * @access  Private (Instructor | Admin)
 */
export const presignPreviewUpload = async (req, res, next) => {
  try {
    const { fileName, fileType, courseSlug } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({ success: false, message: 'Thiếu fileName hoặc fileType' });
    }

    if (!fileType.startsWith('video/')) {
      return res.status(400).json({ success: false, message: 'Chỉ hỗ trợ file video' });
    }

    const slug = courseSlug || 'temp';
    const key = buildS3Key.preview(slug, fileName);

    const result = await generatePresignedUploadUrl(key, fileType, 1800);

    res.status(200).json({
      success: true,
      data: {
        uploadUrl: result.uploadUrl,
        key: result.key,
        cdnUrl: result.cdnUrl,
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Tạo Presigned URL để upload Resource (PDF, Doc, Zip...)
 * @route   POST /api/v1/courses/resources/presign-upload
 * @access  Private (Instructor | Admin)
 */
export const presignResourceUpload = async (req, res, next) => {
  try {
    const { fileName, fileType, courseSlug, lectureTitle } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({ success: false, message: 'Thiếu fileName hoặc fileType' });
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/zip',
      'application/x-zip-compressed',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      // file pcap
      'application/vnd.tcpdump.pcap',
      'application/x-pcap',
      'application/x-ns-3-pcap',
      'application/pcap',
      'application/octet-stream'
    ];

    if (!allowedTypes.includes(fileType)) {
      return res.status(400).json({ success: false, message: 'Loại file không được hỗ trợ' });
    }

    const slug = courseSlug || 'temp';
    const title = lectureTitle || 'lecture';
    const key = buildS3Key.resource(slug, title, fileName);

    const result = await generatePresignedUploadUrl(key, fileType, 900); // 15 phút

    res.status(200).json({
      success: true,
      data: {
        uploadUrl: result.uploadUrl,
        key: result.key,
        cdnUrl: result.cdnUrl,
      }
    });
  } catch (error) {
    next(error);
  }
};

// ======================== COURSE MANAGEMENT ========================

/**
 * @desc    Tạo HOẶC Cập nhật Course Revision (Draft/Pending) - AWS Version
 * @route   POST /api/courses
 */
export const createCourseRevision = async (req, res, next) => {
  try {
    const courseData = req.body;
    const thumbnailFile = req.file; // Vẫn hỗ trợ upload thumbnail qua server (nhỏ)
    const instructorId = req.user._id;

    const revision = await courseService.createOrUpdateRevision(courseData, thumbnailFile, instructorId);

    res.status(201).json({
      success: true,
      message: courseData.status === 'pending' ? "Course submitted for review" : "Draft saved successfully",
      data: revision
    });
  } catch (error) {
    next(error);
  }
};

export const getLevels = async (req, res, next) => {
  try {
    const levels = (await Course.distinct('level')).filter(lv => lv);
    res.json(levels);
  } catch (err) {
    next(err);
  }
};

export const getCourseStats = async (req, res, next) => {
  try {
    const stats = await courseService.getCourseStats();
    res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Lấy khóa học của Instructor hiện tại
 * @route   GET /api/courses/instructor/my-courses
 */
export const getMyCourses = async (req, res, next) => {
  try {
    const instructorId = req.user._id;
    const result = await courseService.getInstructorCourses(instructorId, req.query);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getPopularCourses = async (req, res, next) => {
  try {
    const courses = await courseService.getPopularCourses();

    res.status(200).json({
      success: true,
      data: courses
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy thông tin khóa học để Edit (Instructor Only)
 * @route   GET /api/courses/instructor/edit/:slug
 */
export const getCourseForEdit = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const instructorId = req.user._id;

    const data = await courseService.getCourseForEdit(slug, instructorId);

    res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Xóa khóa học (Instructor)
 * @route   DELETE /api/courses/:id
 */
export const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const instructorId = req.user._id;

    const result = await courseService.deleteCourse(id, instructorId);

    res.status(200).json({
      success: true,
      message: result.message,
      action: result.action
    });
  } catch (error) {
    next(error);
  }
};

export const activateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await courseService.activateCourse(id, req.user._id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

// ======================== VIDEO PLAYBACK (Signed URL) ========================

/**
 * @desc    Lấy link phát video ngắn hạn từ CloudFront (theo plan_2.md)
 *          DB lưu object_key/CDN URL -> Backend ký URL -> Frontend phát bằng Video.js
 * @route   GET /api/v1/courses/:courseId/lectures/:lectureId/play
 * @access  Private (Enrolled Student | Instructor | Admin) hoặc Preview Free
 */
export const getVideoPlayUrl = async (req, res, next) => {
  try {
    const { courseId, lectureId } = req.params;
    const user = req.user;

    // Lấy lecture từ DB
    const lecture = await Lecture.findById(lectureId).select('title videoUrl duration isPreviewFree resources section');

    if (!lecture) {
      return res.status(404).json({ success: false, message: 'Bài giảng không tồn tại' });
    }

    if (!lecture.isPreviewFree && !user) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để xem bài giảng' });
    }

    if (!lecture.videoUrl) {
      return res.status(404).json({ success: false, message: 'Bài giảng chưa có video' });
    }

    // Trích xuất object_key từ CDN URL được lưu trong DB
    // DB lưu dạng: https://d2xxx.cloudfront.net/courses/abc/video.mp4
    // Cần lấy: courses/abc/video.mp4
    const objectKey = extractKeyFromCDNUrl(lecture.videoUrl);

    // Tạo Signed URL ngắn hạn (1 giờ) - KHÔNG lưu URL này vào DB
    const signedVideoUrl = generateSignedVideoUrl(objectKey, 3600);

    res.status(200).json({
      success: true,
      data: {
        lectureId: lecture._id,
        title: lecture.title,
        videoUrl: signedVideoUrl,   // URL có thời hạn, dùng để phát ngay
        expiresIn: 3600,             // Giây
        duration: lecture.duration,
        isPreviewFree: lecture.isPreviewFree,
        resources: lecture.resources || [],
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy preview video URL cho trang CourseDetail (intro video)
 * @route   GET /api/v1/courses/:slug/preview-url
 * @access  Public
 */
export const getCoursePreviewUrl = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const course = await Course.findOne({ slug }).select('title previewUrl thumbnail').lean();

    if (!course) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khóa học' });
    }

    let previewVideoUrl = null;

    if (course.previewUrl) {
      const objectKey = extractKeyFromCDNUrl(course.previewUrl);
      // Preview video có thể là public (không cần signed URL) hoặc signed
      previewVideoUrl = generateSignedVideoUrl(objectKey, 1800); // 30 phút
    }

    res.status(200).json({
      success: true,
      data: {
        previewUrl: previewVideoUrl,
        thumbnail: course.thumbnail,
      }
    });
  } catch (error) {
    next(error);
  }
};