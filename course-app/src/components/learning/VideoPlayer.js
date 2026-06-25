import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Image } from 'expo-image';
import {
  AlertCircle,
  RefreshCw,
  PlayCircle,
  Maximize2,
  Clock,
  Play,
  Pause,
  Minimize2,
  RotateCcw,
  RotateCw,
} from 'lucide-react-native';
import { courseApi } from '../../api/courseApi';
import { learningApi } from '../../api/learningApi';
import { useDispatch, useSelector } from 'react-redux';
import { markQuizComplete, showQuiz } from '../../features/learning/learningSlice';
import VideoQuizOverlayMobile from './VideoQuizOverlayMobile';
import QuizProgressMarkersMobile from './QuizProgressMarkersMobile';
import QuizReviewSheetMobile from './QuizReviewSheetMobile';
import CustomProgressBar from './CustomProgressBar';
import * as ScreenOrientation from 'expo-screen-orientation';


/**
 * VideoPlayer — Mobile, dùng expo-video
 * ─ AWS CloudFront Signed URL
 * ─ Resume từ last_watched_time (prop lastWatchedTime)
 * ─ Gửi onProgress mỗi 10s khi đang phát
 * ─ Interactive Quiz: poll currentTime mỗi 500ms, block seek
 *
 * FIX: lastWatchedTimeRef tránh closure stale trong useEffect([videoUrl]).
 * useEffect([lastWatchedTime]) reactive seek khi fetchVideoProgress trả về sau.
 */
const VideoPlayer = ({
  currentLecture,
  courseId,
  courseSlug,       // ── THÊM: dùng cho quiz API
  thumbnail,
  lastWatchedTime = 0,
  onProgress,
  onComplete,
}) => {
  const videoViewRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const quizTriggeredRef = useRef(new Set()); // ── Đã trigger quiz nào trong session

  const dispatch = useDispatch();
  const progress = useSelector((state) => state.learning.progress);
  const completedQuizzes = useSelector((state) => state.learning.completedQuizzes) || [];
  const isLoadingProgress = useSelector((state) => state.learning.isLoading);

  // ─── Ref luôn giữ giá trị lastWatchedTime mới nhất (tránh closure stale) ───
  const lastWatchedTimeRef = useRef(lastWatchedTime);
  const initialSeekDoneRef = useRef(false);
  const isSeekingRef = useRef(false);

  // ─── Quiz state ──────────────────────────────────────────────────────────
  const [activeQuiz, setActiveQuiz]         = useState(null);  // { quizIndex, quiz }
  const [quizBlocked, setQuizBlocked]       = useState(false);
  const [isReviewOpen, setIsReviewOpen]     = useState(false); // Quiz Review sheet

  // ✅ FIX: Dùng refs cho activeQuiz, quizBlocked, completedQuizzes và isLoadingProgress bên trong timeUpdate listener
  //    → tránh dependency array re-subscribe gây race condition
  //    → tránh closure stale khi completedQuizzes chưa load từ server
  const activeQuizRef = useRef(null);
  const quizBlockedRef = useRef(false);
  const completedQuizzesRef = useRef(completedQuizzes); // ✅ FIX: Ref cho completedQuizzes
  const isLoadingProgressRef = useRef(isLoadingProgress); // ✅ FIX: Ref cho isLoadingProgress
  const lastKnownTimeRef = useRef(0); // ✅ FIX: Vị trí trước khi seek

  // Sync refs với state
  useEffect(() => { activeQuizRef.current = activeQuiz; }, [activeQuiz]);
  useEffect(() => { quizBlockedRef.current = quizBlocked; }, [quizBlocked]);
  useEffect(() => { completedQuizzesRef.current = completedQuizzes; }, [completedQuizzes]);
  useEffect(() => { isLoadingProgressRef.current = isLoadingProgress; }, [isLoadingProgress]);

  // Reset initialSeekDone khi đổi bài mới
  useEffect(() => {
    initialSeekDoneRef.current = false;
  }, [currentLecture?._id]);

  const quizzes = currentLecture?.quizzes || [];

  const isQuizDone = useCallback((quizIndex) => {
    if (!currentLecture?._id) return false;
    return completedQuizzes.some(
      q => String(q.lectureId) === String(currentLecture._id)
        && q.quizIndex === quizIndex
        && q.isCorrect !== false // backward-compat
    );
  }, [completedQuizzes, currentLecture?._id]);

  const [videoUrl, setVideoUrl] = useState(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [urlError, setUrlError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef(null);

  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4000);
  }, []);

  const toggleControls = useCallback(() => {
    setShowControls(prev => !prev);
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  // Sync orientation unlock on unmount
  useEffect(() => {
    return () => {
      ScreenOrientation.unlockAsync().catch(() => {});
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // Listen to playingChange event to update local controls isPlaying state
  useEffect(() => {
    if (!player) return;
    const sub = player.addListener('playingChange', (event) => {
      setIsPlaying(event.isPlaying);
    });
    return () => sub.remove();
  }, [player]);

  // Auto hide controls in playing state
  useEffect(() => {
    if (isPlaying) {
      resetControlsTimeout();
    } else {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      setShowControls(true);
    }
  }, [isPlaying, resetControlsTimeout]);

  // Handle Fullscreen Toggle
  const handleFullscreenToggle = async () => {
    try {
      if (isFullscreen) {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        setIsFullscreen(false);
      } else {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);
        setIsFullscreen(true);
      }
    } catch (err) {
      console.warn('[VideoPlayer] Fullscreen toggle error:', err);
    }
  };

  // ✅ FIX: Forward seek restriction helper
  const findBlockedQuiz = useCallback((fromTime, toTime) => {
    if (!quizzes.length || toTime <= fromTime) return null;
    const sorted = [...quizzes]
      .map((q, i) => ({ ...q, index: i }))
      .filter(q => q.isActive !== false)
      .sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
    for (const quiz of sorted) {
      const ts = Number(quiz.timestamp);
      if (!isQuizDone(quiz.index) && ts > fromTime && toTime > ts) {
        return { quiz, revertTo: Math.max(0, ts - 1) };
      }
    }
    return null;
  }, [quizzes, isQuizDone]);

  const handleSeek = (seconds) => {
    if (player) {
      try {
        const fromTime = lastKnownTimeRef.current;
        // ✅ FIX: Check forward seek restriction
        if (seconds > fromTime) {
          const blocked = findBlockedQuiz(fromTime, seconds);
          if (blocked) {
            isSeekingRef.current = true;
            setMarkerCurrentTime(blocked.revertTo);
            player.currentTime = blocked.revertTo;
            setTimeout(() => { isSeekingRef.current = false; }, 800);
            return;
          }
        }
        isSeekingRef.current = true;
        setMarkerCurrentTime(seconds);
        player.currentTime = seconds;
        setTimeout(() => {
          isSeekingRef.current = false;
        }, 800);
      } catch (_) {
        isSeekingRef.current = false;
      }
    }
  };

  const handleRewind5s = () => {
    if (player) {
      try {
        isSeekingRef.current = true;
        const target = Math.max(0, player.currentTime - 5);
        setMarkerCurrentTime(target);
        player.currentTime = target;
        resetControlsTimeout();
        setTimeout(() => {
          isSeekingRef.current = false;
        }, 800);
      } catch (_) {
        isSeekingRef.current = false;
      }
    }
  };

  const handleForward5s = () => {
    if (player) {
      try {
        const fromTime = player.currentTime;
        const target = Math.min(videoDuration || player.duration || 0, fromTime + 5);
        // ✅ FIX: Check quiz block for +5s forward too
        const blocked = findBlockedQuiz(fromTime, target);
        if (blocked) {
          isSeekingRef.current = true;
          setMarkerCurrentTime(blocked.revertTo);
          player.currentTime = blocked.revertTo;
          resetControlsTimeout();
          setTimeout(() => { isSeekingRef.current = false; }, 800);
          return;
        }
        isSeekingRef.current = true;
        setMarkerCurrentTime(target);
        player.currentTime = target;
        resetControlsTimeout();
        setTimeout(() => {
          isSeekingRef.current = false;
        }, 800);
      } catch (_) {
        isSeekingRef.current = false;
      }
    }
  };

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  // ─── Marker tracking state ──────────────────────────────────────────────────────
  const [markerCurrentTime, setMarkerCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [playedPercent, setPlayedPercent] = useState(0);

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
    p.timeUpdateEventInterval = 0.25;
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
        if (lastWatchedTimeRef.current > 5 && !initialSeekDoneRef.current) {
          // Chờ player ổn định trước khi seek
          setTimeout(() => {
            try {
              if (player && lastWatchedTimeRef.current > 5 && !initialSeekDoneRef.current) {
                player.currentTime = lastWatchedTimeRef.current;
                initialSeekDoneRef.current = true;
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

    if (!player || lastWatchedTime <= 5 || initialSeekDoneRef.current) return;

    // Nếu player đang có video (đang play hoặc pause), seek ngay lập tức
    try {
      const currentPos = player.currentTime;
      if (currentPos !== undefined && currentPos !== null) {
        // Player đã sẵn sàng → seek
        player.currentTime = lastWatchedTime;
        initialSeekDoneRef.current = true;
      }
    } catch (e) {
      // Player chưa sẵn sàng — sẽ được xử lý bởi timeout trong setupPlayer
      console.warn('[VideoPlayer] Reactive seek error (will retry via setupPlayer):', e);
    }
  }, [lastWatchedTime]);

  // ─── Subscribe to player status — cập nhật currentTime & duration cho Markers, kiểm tra Gatekeeper ────────
  useEffect(() => {
    if (!player) return;

    const subscription = player.addListener('timeUpdate', (event) => {
      try {
        if (isSeekingRef.current) return;
        const ct = event.currentTime;
        const dur = player.duration;
        if (ct != null) {
          setMarkerCurrentTime(ct);
          lastKnownTimeRef.current = ct; // ✅ FIX: Track position
          if (dur && isFinite(dur) && dur > 0) {
            setVideoDuration(dur);
            setPlayedPercent((ct / dur) * 100);
          }

          // ✅ FIX: Dùng refs thay vì state/closure → tránh race condition. Bỏ qua nếu đang tải tiến độ/khóa học.
          if (activeQuizRef.current || quizBlockedRef.current || !quizzes.length || isLoadingProgressRef.current) return;

          // ✅ FIX: Đọc completedQuizzes từ ref (luôn cập nhật nhất)
          const currentCompletedQuizzes = completedQuizzesRef.current || [];

          // Sắp xếp các quiz theo thứ tự thời gian tăng dần
          const sortedQuizzes = [...quizzes]
            .map((q, i) => ({ ...q, index: i }))
            .filter((q) => q.isActive !== false)
            .sort((a, b) => Number(a.timestamp) - Number(b.timestamp));

          for (const quiz of sortedQuizzes) {
            const ts = Number(quiz.timestamp);
            const isDone = currentCompletedQuizzes.some(
              // ✅ FIX: Ép kiểu an toàn — MongoDB có thể trả về quizIndex là String hoặc Number.
              // Hỗ trợ cả q.lectureId (chuẩn) và q.lecture (fallback từ populate).
              (q) => {
                const qLectureId = String(q.lectureId || q.lecture || '');
                const qLectureMatch = qLectureId === String(currentLecture?._id);
                const qIndexMatch = Number(q.quizIndex) === Number(quiz.index);
                return qLectureMatch && qIndexMatch && q.isCorrect !== false;
              }
            );

            // ✅ FIX: Chỉ trigger khi video phát bình thường qua mốc (cửa sổ nhỏ),
            //    không trigger lại nếu đã triggered trong session này
            const inWindow = ct >= ts && ct <= ts + 2.5;
            if (inWindow && !isDone && !quizTriggeredRef.current.has(quiz.index)) {
              // Pause video và kéo ngược về đúng giây của Quiz
              try {
                player.pause();
                player.currentTime = ts;
              } catch (_) {}

              // Tự động thoát Fullscreen nếu đang bật
              try {
                if (isFullscreen) {
                  ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
                  setIsFullscreen(false);
                }
              } catch (_) {}

              quizTriggeredRef.current.add(quiz.index); // ✅ FIX: Đánh dấu đã trigger
              setActiveQuiz({ quizIndex: quiz.index, quiz });
              setQuizBlocked(true);
              break;
            }
          }
        }
      } catch (e) {
        console.warn('[VideoPlayer] timeUpdate handler error:', e);
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [player, quizzes, currentLecture?._id]); // ✅ FIX: Removed completedQuizzes from deps — read from ref instead

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

  // ─── Reset quiz state khi đổi bài giảng ─────────────────────────────────────
  useEffect(() => {
    quizTriggeredRef.current.clear();
    setActiveQuiz(null);
    setQuizBlocked(false);
  }, [currentLecture?._id]);

  // ─── submitAnswer (mobile) ────────────────────────────────────────────────────
  const handleQuizSubmit = useCallback(async (answer) => {
    if (!activeQuiz || !courseSlug || !currentLecture?._id) return { correct: false, hint: null };
    try {
      const res = await learningApi.submitQuizAnswer({
        courseSlug,
        lectureId: currentLecture._id,
        quizIndex: activeQuiz.quizIndex,
        answer,
      });
      const { correct, hint } = res.data.data;

      if (correct) {
        const lectureId = String(currentLecture._id);
        const quizIndex = activeQuiz.quizIndex;
        // Dispatch action to Redux store so that progress matches and is saved
        dispatch(markQuizComplete({ lectureId, quizIndex }));
      }
      return { correct, hint: hint || null };
    } catch (_) {
      return { correct: false, hint: null };
    }
  }, [activeQuiz, courseSlug, currentLecture?._id, dispatch]);

  const handleQuizCorrect = useCallback(() => {
    setActiveQuiz(null);
    setQuizBlocked(false);
    // ✅ FIX: Debounce 200ms trước khi resume → đợi completedQuizzes update trong Redux
    setTimeout(() => {
      try { player?.play(); } catch (_) {}
    }, 200);
  }, [player]);

  // ─── handleRetakeQuiz — tua video về vị trí quiz sau khi reset ────────────
  /**
   * ✅ FIX: Xóa quizIndex khỏi quizTriggeredRef TRƯỚC khi seek.
   * Nếu không xóa, listener timeUpdate lầm tưởng quiz đã trigger trong session
   * này và bỏ qua → VideoQuizOverlayMobile không bao giờ hiện lại.
   */
  const handleRetakeQuiz = useCallback((quizIndex) => {
    const quiz = quizzes[quizIndex];
    if (!quiz || !player) return;
    const ts = Number(quiz.timestamp);
    try {
      // ✅ Bước 1: Giải phóng quizIndex khỏi triggered set
      quizTriggeredRef.current.delete(quizIndex);
      // ✅ Bước 2: Tua về 1s trước mốc quiz và phát
      player.currentTime = Math.max(0, ts - 1);
      player.play();
    } catch (_) {}
  }, [quizzes, player]);

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
  const containerStyle = isFullscreen
    ? [styles.fullscreenContainer, { width: windowWidth, height: windowHeight }]
    : styles.container;

  const handlePlayPause = () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };

  return (
    <View style={containerStyle}>
      {/* Container của video view để bắt sự kiện tap */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={toggleControls}
        style={StyleSheet.absoluteFill}
      >
        <VideoView
          ref={videoViewRef}
          player={player}
          style={StyleSheet.absoluteFill}
          allowsPictureInPicture={false}
          nativeControls={false} // Tắt controls mặc định
          contentFit="contain"
        />
      </TouchableOpacity>

      {/* ── Custom Overlay Controls ── */}
      {showControls && (
        <View style={styles.controlsOverlay} pointerEvents="box-none">
          {/* Hàng nút điều khiển ở chính giữa màn hình */}
          <View style={styles.centerControlRow}>
            {/* Tua về 5s */}
            <TouchableOpacity 
              style={styles.centerControlBtn} 
              onPress={handleRewind5s}
              activeOpacity={0.8}
            >
              <RotateCcw size={22} color="#fff" />
              <Text style={styles.skipTimeText}>-5s</Text>
            </TouchableOpacity>

            {/* Nút Play/Pause chính giữa */}
            <TouchableOpacity 
              style={styles.playCenterBtn} 
              onPress={handlePlayPause}
              activeOpacity={0.8}
            >
              {isPlaying ? (
                <Pause size={28} color="#fff" />
              ) : (
                <Play size={28} color="#fff" />
              )}
            </TouchableOpacity>

            {/* Tua đi 5s */}
            <TouchableOpacity 
              style={styles.centerControlBtn} 
              onPress={handleForward5s}
              activeOpacity={0.8}
            >
              <RotateCw size={22} color="#fff" />
              <Text style={styles.skipTimeText}>+5s</Text>
            </TouchableOpacity>
          </View>

          {/* Thanh điều khiển ở cạnh dưới (Bottom Controls Bar) */}
          <View style={styles.bottomControlsBar} pointerEvents="box-none">
            {/* Custom Unified Progress Bar */}
            <View style={{ flex: 1 }} pointerEvents="box-none">
              <CustomProgressBar
                currentTime={markerCurrentTime}
                duration={videoDuration || currentLecture?.duration || 0}
                quizzes={quizzes}
                completedQuizzes={completedQuizzes}
                lectureId={currentLecture?._id}
                onSeek={handleSeek}
              />
            </View>

            {/* Nút Fullscreen tùy chỉnh */}
            <TouchableOpacity
              style={styles.fullscreenBtnCustom}
              onPress={handleFullscreenToggle}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {isFullscreen ? (
                <Minimize2 size={18} color="#fff" />
              ) : (
                <Maximize2 size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Resume badge — hiện khi có lastWatchedTime > 5s */}
      {!isFullscreen && lastWatchedTime > 5 && !activeQuiz && (
        <View style={styles.resumeBadge} pointerEvents="none">
          <Clock size={11} color="#fff" />
          <Text style={styles.resumeText}>
            Tiếp tục từ {Math.floor(lastWatchedTime / 60)}:
            {String(Math.floor(lastWatchedTime % 60)).padStart(2, '0')}
          </Text>
        </View>
      )}

      {/* Nút Xem lại câu hỏi — hiện khi có quiz và không fullscreen */}
      {!isFullscreen && !activeQuiz && quizzes.filter(q => q.isActive !== false).length > 0 && (
        <TouchableOpacity
          style={styles.reviewBtn}
          onPress={() => setIsReviewOpen(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.reviewBtnText}>
            📋 {quizzes.filter(q => q.isActive !== false).length}
          </Text>
        </TouchableOpacity>
      )}


      {/* ── Quiz Overlay — Sử dụng Modal hiển thị đè toàn màn hình ── */}
      {activeQuiz && (
        <VideoQuizOverlayMobile
          quiz={activeQuiz.quiz}
          onSubmit={handleQuizSubmit}
          onCorrect={handleQuizCorrect}
        />
      )}

      {/* ── Quiz Review Sheet ── */}
      <QuizReviewSheetMobile
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        courseSlug={courseSlug}
        lectureId={currentLecture?._id}
        quizzes={quizzes}
        onRetake={handleRetakeQuiz}
        onRetakeAll={() => {
          // Reset triggeredRef khi retake all
          quizTriggeredRef.current.clear();
        }}
      />
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
    position: 'relative',
  },
  fullscreenContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 9999,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  centerControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  centerControlBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  skipTimeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  playCenterBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  bottomControlsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingRight: 6,
    paddingVertical: 4,
  },
  fullscreenBtnCustom: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    zIndex: 12,
  },
  resumeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  // Nút Xem lại câu hỏi (góc trên bên trái video)
  reviewBtn: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(79,70,229,0.88)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    zIndex: 12,
  },
  reviewBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default VideoPlayer;