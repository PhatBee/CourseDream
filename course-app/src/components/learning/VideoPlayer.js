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
  Clock,
} from 'lucide-react-native';
import { courseApi } from '../../api/courseApi';

/**
 * VideoPlayer — Mobile, dùng expo-video
 * ─ AWS CloudFront Signed URL
 * ─ Resume từ last_watched_time (prop lastWatchedTime)
 * ─ Gửi onProgress mỗi 10s khi đang phát
 *
 * FIX: lastWatchedTimeRef tránh closure stale trong useEffect([videoUrl]).
 * useEffect([lastWatchedTime]) reactive seek khi fetchVideoProgress trả về sau.
 */
const VideoPlayer = ({
  currentLecture,
  courseId,
  thumbnail,
  lastWatchedTime = 0,
  onProgress,
  onComplete,
}) => {
  const videoViewRef = useRef(null);
  const progressIntervalRef = useRef(null);

  // ─── Ref luôn giữ giá trị lastWatchedTime mới nhất (tránh closure stale) ───
  const lastWatchedTimeRef = useRef(lastWatchedTime);

  const [videoUrl, setVideoUrl] = useState(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [urlError, setUrlError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ─── Fetch CloudFront Signed URL ─────────────────────────────────────────────
  const fetchVideoUrl = useCallback(async () => {
    if (!currentLecture?._id || !courseId) return;

    setIsLoadingUrl(true);
    setUrlError(null);
    setVideoUrl(null);
    // Reset ref khi đổi bài mới
    lastWatchedTimeRef.current = 0;

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

  // ─── Tạo player với expo-video ────────────────────────────────────────────────
  const player = useVideoPlayer(videoUrl || '', (p) => {
    p.loop = false;
    if (videoUrl) p.play();
  });

  // ─── Effect: URL thay đổi → load source + seek sau khi sẵn sàng ─────────────
  // Đọc lastWatchedTimeRef (không phải lastWatchedTime trực tiếp) để không stale
  useEffect(() => {
    if (!player || !videoUrl) return;

    const setupPlayer = async () => {
      try {
        await player.replaceAsync(videoUrl);
        player.play();

        // Seek đến vị trí đã xem sau khi player ready.
        // Dùng ref để đọc giá trị mới nhất tại thời điểm callback chạy.
        if (lastWatchedTimeRef.current > 5) {
          // Chờ player ổn định trước khi seek
          setTimeout(() => {
            try {
              if (player && lastWatchedTimeRef.current > 5) {
                player.currentTime = lastWatchedTimeRef.current;
              }
            } catch (e) {
              console.warn('[VideoPlayer] Seek (after replaceAsync) error:', e);
            }
          }, 600);
        }
      } catch (e) {
        console.warn('[VideoPlayer] replaceAsync error:', e);
      }
    };

    setupPlayer();
  }, [videoUrl]);

  // ─── Effect: lastWatchedTime prop thay đổi (fetchVideoProgress trả về sau) ──
  // FIX CHÍNH: fetchVideoProgress dispatch hoàn thành SAU khi setupPlayer() đã chạy.
  // → Sync ref + seek ngay nếu player đã sẵn sàng (đang phát hoặc pause).
  useEffect(() => {
    // Luôn sync ref trước tiên
    lastWatchedTimeRef.current = lastWatchedTime;

    if (!player || lastWatchedTime <= 5) return;

    // Nếu player đang có video (đang play hoặc pause), seek ngay lập tức
    try {
      // expo-video: player.status === 'readyToPlay' hoặc player.currentTime >= 0
      // Dùng try/catch vì API có thể chưa available
      const currentPos = player.currentTime;
      if (currentPos !== undefined && currentPos !== null) {
        // Player đã sẵn sàng → seek
        player.currentTime = lastWatchedTime;
      }
    } catch (e) {
      // Player chưa sẵn sàng — sẽ được xử lý bởi timeout trong setupPlayer
      console.warn('[VideoPlayer] Reactive seek error (will retry via setupPlayer):', e);
    }
  }, [lastWatchedTime]);

  // ─── Interval gửi onProgress mỗi 10s ─────────────────────────────────────────
  useEffect(() => {
    if (!player || !onProgress) return;

    const subscription = player.addListener('playingChange', ({ isPlaying }) => {
      if (isPlaying) {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = setInterval(() => {
          try {
            const currentTime = player.currentTime;
            if (currentTime > 0 && !player.paused) {
              onProgress(currentTime);
            }
          } catch (e) {
            // ignore
          }
        }, 10000);
      } else {
        // Khi pause: gửi ngay + clear interval
        try {
          const currentTime = player.currentTime;
          if (currentTime > 0) onProgress(currentTime);
        } catch (e) {}
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      }
    });

    return () => {
      subscription?.remove();
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [player, onProgress]);

  // ─── Lắng nghe khi video kết thúc ────────────────────────────────────────────
  useEffect(() => {
    if (!player || !onComplete) return;
    const subscription = player.addListener('playToEnd', () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      onComplete();
    });
    return () => subscription?.remove();
  }, [player, onComplete]);

  // ─── Fullscreen handler ────────────────────────────────────────────────────────
  const handleFullscreen = useCallback(() => {
    if (!videoViewRef.current || !videoUrl) return;
    if (isFullscreen) {
      videoViewRef.current.exitFullscreen();
    } else {
      videoViewRef.current.enterFullscreen();
    }
  }, [isFullscreen, videoUrl]);

  // ─── Chưa chọn bài học → Hiện Thumbnail ──────────────────────────────────────
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

  // ─── Loading Signed URL ───────────────────────────────────────────────────────
  if (isLoadingUrl) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#e11d48" />
        <Text style={styles.loadingText}>Đang tải video</Text>
      </View>
    );
  }

  // ─── Error ────────────────────────────────────────────────────────────────────
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

  // ─── Không có URL ──────────────────────────────────────────────────────────────
  if (!videoUrl) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Video không khả dụng</Text>
      </View>
    );
  }

  // ─── Main Video Player (expo-video) ───────────────────────────────────────────
  return (
    <View style={styles.container}>
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

      {/* Resume badge — hiện khi có lastWatchedTime > 5s */}
      {!isFullscreen && lastWatchedTime > 5 && (
        <View style={styles.resumeBadge} pointerEvents="none">
          <Clock size={11} color="#fff" />
          <Text style={styles.resumeText}>
            Tiếp tục từ {Math.floor(lastWatchedTime / 60)}:
            {String(Math.floor(lastWatchedTime % 60)).padStart(2, '0')}
          </Text>
        </View>
      )}

      {/* Nút fullscreen tùy chỉnh */}
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
  resumeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(225,29,72,0.88)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  resumeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default VideoPlayer;