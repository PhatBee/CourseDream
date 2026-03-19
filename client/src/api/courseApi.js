import axiosClient from "./axiosClient";
import axios from "axios";

const path = "/courses";

export const getAllCourses = (params) => {
  return axiosClient.get(path, { params });
};

const getDetailsBySlug = (slug) => {
  return axiosClient.get(`${path}/${slug}`);
};

// API Mới: Tạo/cập nhật khóa học (Revision)
const createCourse = (formData) => {
  return axiosClient.post(path, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};

export const searchCourses = (params) => {
  return axiosClient.get("/courses/search", { params });
};

const getLevels = () => axiosClient.get("/courses/levels");
const getCourseStats = () => axiosClient.get("/courses/stats");

const getInstructorCourses = (params) => {
  return axiosClient.get(`${path}/instructor/my-courses`, { params });
};

const getInstructorCourseForEdit = (slug) => {
  return axiosClient.get(`/courses/instructor/edit/${slug}`);
};

const deleteCourse = (id) => {
  return axiosClient.delete(`${path}/${id}`);
};

const activateCourse = (id) => {
  return axiosClient.patch(`${path}/${id}/activate`);
};

// ===================== AWS S3 PRESIGNED URL APIs =====================

/**
 * Lấy presigned URL để upload VIDEO lên S3
 * @param {{ fileName, fileType, courseSlug, lectureTitle }} payload
 */
const getVideoPresignedUrl = (payload) => {
  return axiosClient.post(`${path}/videos/presign-upload`, payload);
};

/**
 * Lấy presigned URL để upload THUMBNAIL lên S3
 * @param {{ fileName, fileType, courseSlug }} payload
 */
const getThumbnailPresignedUrl = (payload) => {
  return axiosClient.post(`${path}/thumbnails/presign-upload`, payload);
};

/**
 * Lấy presigned URL để upload PREVIEW VIDEO lên S3
 * @param {{ fileName, fileType, courseSlug }} payload
 */
const getPreviewPresignedUrl = (payload) => {
  return axiosClient.post(`${path}/previews/presign-upload`, payload);
};

/**
 * Lấy presigned URL để upload RESOURCE (PDF, Doc...) lên S3
 * @param {{ fileName, fileType, courseSlug, lectureTitle }} payload
 */
const getResourcePresignedUrl = (payload) => {
  return axiosClient.post(`${path}/resources/presign-upload`, payload);
};

/**
 * Upload file trực tiếp lên S3 bằng Presigned URL (PUT request)
 * Dùng axios thuần (không kèm Authorization header của app)
 * @param {string} presignedUrl - URL từ backend
 * @param {File} file - File object từ input
 * @param {Function} onProgress - Callback progress(percent)
 */
const uploadFileToS3 = (presignedUrl, file, onProgress) => {
  return axios.put(presignedUrl, file, {
    headers: {
      "Content-Type": file.type,
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });
};

// ==================== ADMIN APIs ====================

// ==================== VIDEO PLAYBACK APIs ====================

/**
 * Lấy CloudFront Signed URL để phát video bài giảng
 * @param {string} courseId - Mongo ID của Course
 * @param {string} lectureId - Mongo ID của Lecture
 * @returns {{ videoUrl, duration, title, expiresIn }}
 */
const getVideoPlayUrl = (courseId, lectureId) => {
  return axiosClient.get(`${path}/${courseId}/lectures/${lectureId}/play`);
};

/**
 * Lấy preview intro video URL của khóa học (cho trang CourseDetail)
 * @param {string} slug - slug của khóa học
 * @returns {{ previewUrl, thumbnail }}
 */
const getCoursePreviewUrl = (slug) => {
  return axiosClient.get(`${path}/${slug}/preview-url`);
};

export const courseApi = {
  getAllCourses,
  getDetailsBySlug,
  createCourse,
  searchCourses,
  getLevels,
  getCourseStats,
  getInstructorCourses,
  getInstructorCourseForEdit,
  deleteCourse,
  activateCourse,
  // AWS S3 Upload
  getVideoPresignedUrl,
  getThumbnailPresignedUrl,
  getPreviewPresignedUrl,
  getResourcePresignedUrl,
  uploadFileToS3,
  // Video Playback (CloudFront Signed URL)
  getVideoPlayUrl,
  getCoursePreviewUrl,
};