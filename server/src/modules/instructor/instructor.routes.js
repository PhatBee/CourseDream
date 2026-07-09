import express from "express";
import {
  getInstructorDashboard, getProfile, updateProfile, getCourseStudents,
  presignVideoUpload, presignThumbnailUpload, presignPreviewUpload, presignResourceUpload,
  getMyCourses, getCourseForEdit, createCourseRevision, deleteCourse, activateCourse
} from "./instructor.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import { checkRole } from "../../middlewares/role.middleware.js";
import { upload } from "../../middlewares/upload.middleware.js";

const router = express.Router();

router.get("/dashboard", verifyToken, getInstructorDashboard);

// Profile Instructor
router.get("/profile", verifyToken, getProfile);
router.put("/profile", verifyToken, updateProfile);

// Course enrolled students
router.get("/courses/:courseId/students", verifyToken, getCourseStudents);

// ==================== AWS S3 PRESIGN ROUTES ====================
// These are mounted on /api/courses
export const instructorCourseRouter = express.Router();

instructorCourseRouter.post('/videos/presign-upload', verifyToken, checkRole('instructor', 'admin'), presignVideoUpload);
instructorCourseRouter.post('/thumbnails/presign-upload', verifyToken, checkRole('instructor', 'admin'), presignThumbnailUpload);
instructorCourseRouter.post('/previews/presign-upload', verifyToken, checkRole('instructor', 'admin'), presignPreviewUpload);
instructorCourseRouter.post('/resources/presign-upload', verifyToken, checkRole('instructor', 'admin'), presignResourceUpload);

// ==================== INSTRUCTOR COURSE MANAGEMENT ====================
instructorCourseRouter.get('/instructor/my-courses', verifyToken, getMyCourses);
instructorCourseRouter.get('/instructor/edit/:slug', verifyToken, getCourseForEdit);
instructorCourseRouter.post('/', verifyToken, upload.single('thumbnail'), createCourseRevision);
instructorCourseRouter.delete('/:id', verifyToken, deleteCourse);
instructorCourseRouter.patch('/:id/activate', verifyToken, activateCourse);

export default router;
