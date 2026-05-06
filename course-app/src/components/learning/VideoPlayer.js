import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Image } from 'expo-image';
import {
  AlertCircle,
  RefreshCw,
  PlayCircle,
  Maximize2,
} from 'lucide-react-native';
import { courseApi } from '../../api/courseApi';

/**
 * VideoPlayer — Mobile, dùng expo-video (thay thế expo-av)
 * ─ AWS CloudFront Signed URL
 * ─ Fullscreen native: xoay ngang video, KHÔNG xoay app, KHÔNG unmount
 */
const VideoPlayer = ({ currentLecture, courseId, thumbnail, onComplete }) => {
  const videoViewRef = useRef(null);

  const [videoUrl, setVideoUrl] = useState(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [urlError, setUrlError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
    if (currentLecture?._id) fetchVideoUrl();
  }, [fetchVideoUrl]);

  // ─── Tạo player với expo-video ───────────────────────────────────────────
  // useVideoPlayer LUÔN được gọi, nhưng chỉ play khi có URL hợp lệ
  const player = useVideoPlayer(videoUrl || '', (p) => {
    p.loop = false;
    if (videoUrl) p.play();
  });

  // Đồng bộ source khi URL thay đổi
  useEffect(() => {
    if (!player || !videoUrl) return;
    player.replaceAsync(videoUrl);
    player.play();
  }, [videoUrl]);

  // Lắng nghe khi video kết thúc
  useEffect(() => {
    if (!player || !onComplete) return;
    const subscription = player.addListener('playToEnd', () => {
      onComplete();
    });
    return () => subscription?.remove();
  }, [player, onComplete]);

  // ─── Fullscreen handler (native expo-video) ───────────────────────────────
  const handleFullscreen = useCallback(() => {
    if (!videoViewRef.current || !videoUrl) return;
    if (isFullscreen) {
      videoViewRef.current.exitFullscreen();
    } else {
      videoViewRef.current.enterFullscreen();
    }
  }, [isFullscreen, videoUrl]);

  // ─── Chưa chọn bài học → Hiện Thumbnail ──────────────────────────────────
  if (!currentLecture) {
    return (
      <View style={styles.container}>
        <Image
          source={thumbnail ? { uri: thumbnail.url || thumbnail } : null}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
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

  // ─── Main Video Player (expo-video) ──────────────────────────────────────
  return (
    <View style={styles.container}>
      {/*
        VideoView của expo-video:
        - allowsFullscreen: bật native fullscreen
        - enterFullscreen() / exitFullscreen() qua ref
        - Fullscreen tích hợp sẵn hỗ trợ xoay ngang mà KHÔNG unmount component
        - nativeControls: bật controls (play/pause/seek/fullscreen)
      */}
      <VideoView
        ref={videoViewRef}
        player={player}
        style={StyleSheet.absoluteFill}
        fullscreenOptions={{ enterFullscreen: true, exitFullscreen: true }}
        allowsPictureInPicture={false}
        nativeControls
        contentFit="contain"
        onFullscreenEnter={() => setIsFullscreen(true)}
        onFullscreenExit={() => setIsFullscreen(false)}
      />

      {/* Nút fullscreen tùy chỉnh (bổ sung) */}
      {!isFullscreen && (
        <TouchableOpacity
          style={styles.fullscreenBtn}
          onPress={handleFullscreen}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Maximize2 size={16} color="#fff" />
        </TouchableOpacity>
      )}
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
  fullscreenBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VideoPlayer;