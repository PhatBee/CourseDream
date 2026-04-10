// src/hooks/useS3Upload.js
import { useState, useCallback } from 'react';
import { courseApi } from '../api/courseApi';
import { toast } from 'react-hot-toast';

/**
 * Custom Hook: Upload file lên S3 via Presigned URL
 * Dùng được cho: video, thumbnail, preview, resource
 */
export const useS3Upload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  /**
   * Upload VIDEO lên S3
   * @param {File} file - File to upload
   * @param {Object} meta - { courseSlug, lectureTitle }
   * @returns {Promise<{ cdnUrl, key }>}
   */
  const uploadVideo = useCallback(async (file, meta = {}) => {
    setUploading(true);
    setUploadProgress(0);
    try {
      // 1. Lấy presigned URL từ backend
      const presignRes = await courseApi.getVideoPresignedUrl({
        fileName: file.name,
        fileType: file.type,
        courseSlug: meta.courseSlug || 'temp',
        lectureTitle: meta.lectureTitle || 'lecture',
      });

      const { uploadUrl, cdnUrl, key } = presignRes.data.data;

      // 2. Upload trực tiếp lên S3
      await courseApi.uploadFileToS3(uploadUrl, file, (percent) => {
        setUploadProgress(percent);
      });

      return { cdnUrl, key };
    } catch (err) {
      console.error('[S3] Video upload error:', err);
      throw err;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, []);

  /**
   * Upload THUMBNAIL lên S3
   * @param {File} file - Image file
   * @param {Object} meta - { courseSlug }
   * @returns {Promise<{ cdnUrl, key }>}
   */
  const uploadThumbnail = useCallback(async (file, meta = {}) => {
    setUploading(true);
    setUploadProgress(0);
    try {
      const presignRes = await courseApi.getThumbnailPresignedUrl({
        fileName: file.name,
        fileType: file.type,
        courseSlug: meta.courseSlug || 'temp',
      });

      const { uploadUrl, cdnUrl, key } = presignRes.data.data;

      await courseApi.uploadFileToS3(uploadUrl, file, (percent) => {
        setUploadProgress(percent);
      });

      return { cdnUrl, key };
    } catch (err) {
      console.error('[S3] Thumbnail upload error:', err);
      throw err;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, []);

  /**
   * Upload PREVIEW VIDEO lên S3
   * @param {File} file - Video file
   * @param {Object} meta - { courseSlug }
   * @returns {Promise<{ cdnUrl, key }>}
   */
  const uploadPreview = useCallback(async (file, meta = {}) => {
    setUploading(true);
    setUploadProgress(0);
    try {
      const presignRes = await courseApi.getPreviewPresignedUrl({
        fileName: file.name,
        fileType: file.type,
        courseSlug: meta.courseSlug || 'temp',
      });

      const { uploadUrl, cdnUrl, key } = presignRes.data.data;

      await courseApi.uploadFileToS3(uploadUrl, file, (percent) => {
        setUploadProgress(percent);
      });

      return { cdnUrl, key };
    } catch (err) {
      console.error('[S3] Preview upload error:', err);
      throw err;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, []);

  /**
   * Upload RESOURCE (PDF, Doc...) lên S3
   * @param {File} file - Document file
   * @param {Object} meta - { courseSlug, lectureTitle }
   * @returns {Promise<{ cdnUrl, key }>}
   */
  const uploadResource = useCallback(async (file, meta = {}) => {
    setUploading(true);
    setUploadProgress(0);
    try {
      const presignRes = await courseApi.getResourcePresignedUrl({
        fileName: file.name,
        fileType: file.type,
        courseSlug: meta.courseSlug || 'temp',
        lectureTitle: meta.lectureTitle || 'lecture',
      });

      const { uploadUrl, cdnUrl, key } = presignRes.data.data;

      await courseApi.uploadFileToS3(uploadUrl, file, (percent) => {
        setUploadProgress(percent);
      });

      return { cdnUrl, key };
    } catch (err) {
      console.error('[S3] Resource upload error:', err);
      throw err;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, []);

  return { uploading, uploadProgress, uploadVideo, uploadThumbnail, uploadPreview, uploadResource };
};
