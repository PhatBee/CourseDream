import {
  getInstructorProfile, updateInstructorProfile, getInstructorDashboardStats,
  getCourseStudents as getCourseStudentsService, getInstructorCourses, getCourseForEdit as getCourseForEditService,
  createOrUpdateRevision, deleteCourse as deleteCourseService, activateCourse as activateCourseService
} from "./instructor.service.js";
import { generatePresignedUploadUrl, buildS3Key, signThumbnailUrl } from '../../config/aws.js';

/**
 * GET /api/instructor/profile
 */
export const getProfile = async (req, res, next) => {
  try {
    const profile = await getInstructorProfile(req.user._id);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/instructor/profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const updatedProfile = await updateInstructorProfile(req.user._id, req.body);
    res.json({ success: true, message: "Cập nhật hồ sơ giảng viên thành công!", data: updatedProfile });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/instructor/dashboard
 */
export const getInstructorDashboard = async (req, res, next) => {
  try {
    const instructorId = req.user._id;
    const { timeRange } = req.query;
    const stats = await getInstructorDashboardStats(instructorId, timeRange || '30days');
    res.json(stats);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/instructor/courses/:courseId/students
 */
export const getCourseStudents = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { page, limit } = req.query;
    const instructorId = req.user._id;
    const result = await getCourseStudentsService(courseId, instructorId, { page, limit });
    res.json({ success: true, data: result });
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
        signedUrl: signThumbnailUrl(result.cdnUrl)
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
        signedUrl: signThumbnailUrl(result.cdnUrl)
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
        signedUrl: signThumbnailUrl(result.cdnUrl)
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

    const revision = await createOrUpdateRevision(courseData, thumbnailFile, instructorId);

    res.status(201).json({
      success: true,
      message: courseData.status === 'pending' ? "Course submitted for review" : "Draft saved successfully",
      data: revision
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy khóa học của Instructor hiện tại
 * @route   GET /api/courses/instructor/my-courses
 */
export const getMyCourses = async (req, res, next) => {
  try {
    const instructorId = req.user._id;
    const result = await getInstructorCourses(instructorId, req.query);

    res.status(200).json({
      success: true,
      data: result
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

    const data = await getCourseForEditService(slug, instructorId);

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

    const result = await deleteCourseService(id, instructorId);

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
    const result = await activateCourseService(id, req.user._id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};