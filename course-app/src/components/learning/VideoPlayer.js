import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Image } from 'expo-image';
import {
  Cloud,
  AlertCircle,
  RefreshCw,
  PlayCircle,
} from 'lucide-react-native';
import { courseApi } from '../../api/courseApi';

/**
 * VideoPlayer — Mobile version đồng bộ với web client
 * - Chỉ dùng AWS CloudFront Signed URL (expo-av)
 * - Không dùng YouTube / Vimeo / Dailymotion embed
 */
const VideoPlayer = ({ currentLecture, courseId, thumbnail, onComplete }) => {
  const videoRef = useRef(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [urlError, setUrlError] = useState(null);

  // ─── Fetch CloudFront Signed URL ────────────────────────────────────────────
  const fetchVideoUrl = useCallback(async () => {
    if (!currentLecture?._id || !courseId) return;

    setIsLoadingUrl(true);
    setUrlError(null);
    setVideoUrl(null);

    try {
      const res = await courseApi.getVideoPlayUrl(courseId, currentLecture._id);
      const { videoUrl: signedUrl } = res.data.data;
      setVideoUrl(signedUrl);
    } catch (err) {
      console.error('[VideoPlayer] Failed to get signed URL:', err);
      // Fallback: dùng videoUrl trực tiếp nếu có
      if (currentLecture?.videoUrl) {
        setVideoUrl(currentLecture.videoUrl);
      } else {
        setUrlError('Không thể tải video. Vui lòng thử lại.');
      }
    } finally {
      setIsLoadingUrl(false);
    }
  }, [currentLecture?._id, courseId]);

  useEffect(() => {
    if (currentLecture?._id) {
      fetchVideoUrl();
    }
  }, [fetchVideoUrl]);

  // ─── Chưa chọn bài học → Hiện Thumbnail ──────────────────────────────────
  if (!currentLecture) {
    return (
      <View style={styles.container}>
        <Image
          source={thumbnail ? { uri: thumbnail.url || thumbnail } : null}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
        {/* Dark overlay */}
        <View style={styles.overlay} />
        <View style={styles.placeholderContent}>
          <View style={styles.playIconWrapper}>
            <PlayCircle size={48} color="#fff" />
          </View>
          <Text style={styles.placeholderText}>Chọn bài giảng để bắt đầu</Text>
        </View>
      </View>
    );
  }

  // ─── Loading Signed URL ──────────────────────────────────────────────────
  if (isLoadingUrl) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#e11d48" />
        <Text style={styles.loadingText}>Đang tải video</Text>
      </View>
    );
  }

  // ─── Error ───────────────────────────────────────────────────────────────
  if (urlError) {
    return (
      <View style={styles.container}>
        <AlertCircle size={40} color="#e11d48" />
        <Text style={styles.errorText}>{urlError}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchVideoUrl}>
          <RefreshCw size={14} color="#fff" />
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Không có URL ─────────────────────────────────────────────────────────
  if (!videoUrl) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Video không khả dụng</Text>
      </View>
    );
  }

  // ─── CloudFront Badge ─────────────────────────────────────────────────────
  const isCFUrl = videoUrl.includes('cloudfront.net');

  // ─── Main Video Player (expo-av) ──────────────────────────────────────────
  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        key={currentLecture._id}
        style={StyleSheet.absoluteFill}
        source={{ uri: videoUrl }}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        isLooping={false}
        shouldPlay={true}
        onPlaybackStatusUpdate={(status) => {
          if (status.didJustFinish && onComplete) {
            onComplete();
          }
        }}
      />

      {/* CloudFront Badge
      {isCFUrl && (
        <View style={styles.cfBadge}>
          <Cloud size={11} color="#60a5fa" />
          <Text style={styles.cfBadgeText}>CloudFront CDN</Text>
        </View>
      )} */}
    </View>
  );
};

const PLAYER_HEIGHT = 230;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: PLAYER_HEIGHT,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  placeholderContent: {
    alignItems: 'center',
    gap: 12,
  },
  playIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(225,29,72,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginTop: 12,
  },
  errorText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 24,
    marginTop: 10,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#e11d48',
    borderRadius: 10,
  },
  retryText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  cfBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  cfBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
});

export default VideoPlayer;