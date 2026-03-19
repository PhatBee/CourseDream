// src/config/aws.js
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';
import { getSignedUrl as getCFSignedUrl } from '@aws-sdk/cloudfront-signer';

const REGION = process.env.AWS_REGION || 'ap-southeast-1';
const BUCKET = process.env.AWS_S3_BUCKET_NAME;
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;
const CLOUDFRONT_DISTRIBUTION_ID = process.env.CLOUDFRONT_DISTRIBUTION_ID;

// Khởi tạo S3 Client
export const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Khởi tạo CloudFront Client
export const cfClient = new CloudFrontClient({
  region: 'us-east-1', // CloudFront dùng us-east-1
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Tạo presigned URL để upload trực tiếp lên S3 từ Frontend
 * @param {string} key - S3 object key (đường dẫn)
 * @param {string} contentType - MIME type của file
 * @param {number} expiresIn - Thời gian hết hạn (giây), default 20 phút
 */
export const generatePresignedUploadUrl = async (key, contentType, expiresIn = 1200) => {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
  return {
    uploadUrl,
    key,
    cdnUrl: `https://${CLOUDFRONT_DOMAIN}/${key}`,
  };
};

/**
 * Tạo presigned URL để stream/xem video (read-only)
 * @param {string} key - S3 object key
 * @param {number} expiresIn - Thời gian hết hạn (giây), default 1 giờ
 */
export const generatePresignedReadUrl = async (key, expiresIn = 3600) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  return await getSignedUrl(s3Client, command, { expiresIn });
};

/**
 * Xóa object khỏi S3
 * @param {string} key - S3 object key
 */
export const deleteS3Object = async (key) => {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  await s3Client.send(command);
};

/**
 * Tạo CloudFront URL từ S3 key (public CDN URL)
 * @param {string} key - S3 object key
 */
export const getCDNUrl = (key) => {
  if (!key) return null;
  return `https://${CLOUDFRONT_DOMAIN}/${key}`;
};

/**
 * Tạo S3 key theo cấu trúc chuẩn
 * Structure: course/{courseId}/lecture/{lectureId}/video.mp4
 */
export const buildS3Key = {
  video: (courseSlug, lectureTitle, fileName) => {
    const ext = fileName.split('.').pop();
    const safeLecture = lectureTitle.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    return `courses/${courseSlug}/lectures/${safeLecture}_${Date.now()}.${ext}`;
  },
  thumbnail: (courseSlug, fileName) => {
    const ext = fileName.split('.').pop();
    return `courses/${courseSlug}/thumbnails/thumb_${Date.now()}.${ext}`;
  },
  resource: (courseSlug, lectureTitle, fileName) => {
    const safeLecture = lectureTitle.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const safeFile = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `courses/${courseSlug}/resources/${safeLecture}/${Date.now()}_${safeFile}`;
  },
  preview: (courseSlug, fileName) => {
    const ext = fileName.split('.').pop();
    return `courses/${courseSlug}/previews/preview_${Date.now()}.${ext}`;
  },
};

/**
 * Tạo CloudFront Signed URL cho việc PHÁT VIDEO (Private Content)
 * 
 * Theo plan_2.md:
 * - DB CHỈ lưu object_key (ví dụ: courses/abc/lectures/xyz_123.mp4)
 * - Backend tạo signed URL ngắn hạn khi học viên bấm xem
 * - Frontend dùng URL này để phát qua Video.js, KHÔNG lưu lại
 * 
 * @param {string} objectKey - S3 object key từ DB (vd: courses/abc/lectures/video.mp4)
 * @param {number} expiresInSeconds - Thời gian hết hạn (mặc định 3600 = 1 giờ)
 * @returns {string} - CloudFront Signed URL
 */
export const generateSignedVideoUrl = (objectKey, expiresInSeconds = 3600) => {
  const cfPrivateKey = process.env.CLOUDFRONT_PRIVATE_KEY;
  const cfKeyPairId = process.env.CLOUDFRONT_KEY_PAIR_ID;

  // Nếu chưa cấu hình CloudFront Signed URL (chưa có private key)
  // → Fallback về public CDN URL (phù hợp cho môi trường dev/demo)
  if (!cfPrivateKey || !cfKeyPairId || cfKeyPairId === 'YOUR_KEY_PAIR_ID') {
    console.warn('[AWS] CloudFront private key not configured, returning public CDN URL');
    return `https://${CLOUDFRONT_DOMAIN}/${objectKey}`;
  }

  const url = `https://${CLOUDFRONT_DOMAIN}/${objectKey}`;
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  try {
    return getCFSignedUrl({
      url,
      keyPairId: cfKeyPairId,
      privateKey: cfPrivateKey.replace(/\\n/g, '\n'), // Xử lý newline trong .env
      dateLessThan: new Date(expiresAt * 1000).toISOString(),
    });
  } catch (err) {
    console.error('[CloudFront] Failed to sign URL:', err.message);
    // Fallback về public CDN URL
    return `https://${CLOUDFRONT_DOMAIN}/${objectKey}`;
  }
};

/**
 * Parse CDN URL → lấy object_key (dùng khi cần lưu lại key từ URL)
 * @param {string} cdnUrl - ví dụ: https://d2xxx.cloudfront.net/courses/abc/video.mp4
 * @returns {string} - object_key: courses/abc/video.mp4
 */
export const extractKeyFromCDNUrl = (cdnUrl) => {
  if (!cdnUrl) return null;
  try {
    const url = new URL(cdnUrl);
    return url.pathname.slice(1); // Bỏ leading /
  } catch {
    return cdnUrl;
  }
};

export { BUCKET, CLOUDFRONT_DOMAIN };
