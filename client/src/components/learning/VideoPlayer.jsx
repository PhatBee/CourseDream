// src/components/learning/VideoPlayer.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Download,
  File,
  Link as LinkIcon,
  Cloud,
  AlertCircle,
  Loader2,
  RefreshCw,
  BookOpen,
  FileText,
  MessageSquare,
} from "lucide-react";
import { courseApi } from "../../api/courseApi";
import CourseDiscussion from "../../features/discussion/CourseDiscussion";
import { useLocation } from "react-router-dom";
import { useVideoQuiz } from "../../features/learning/useVideoQuiz";
import VideoQuizOverlay from "./VideoQuizOverlay";
import QuizProgressMarkers from "./QuizProgressMarkers";
import QuizReviewModal from "./QuizReviewModal";
import { toast } from "react-toastify";


// ======================== VIDEO.JS PLAYER ========================

/**
 * VideoJSPlayer
 * @prop {string}   src
 * @prop {string}   poster
 * @prop {number}   startTime    - Thời điểm bắt đầu (giây) khi resume
 * @prop {Function} onReady
 * @prop {Function} onTimeUpdate - (currentTime) => void
 * @prop {Function} onSeeking    - (seekTo) => void  — kiểm tra quiz block
 * @prop {Function} onSeeked     - (seekTo) => void  — cập nhật vị trí đã seek xong
 * @prop {Function} onProgress   - (currentTime) => void — gọi mỗi 10s
 * @prop {Function} onEnded
 * @prop {Function} onPlayerReady - cb(player) — expose player ref ra ngoài
 */
const VideoJSPlayer = ({ src, poster, startTime = 0, onReady, onTimeUpdate, onSeeking, onSeeked, onProgress, onEnded, onPlayerReady }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  // Ref luôn giữ giá trị startTime mới nhất — tránh closure stale
  const startTimeRef = useRef(startTime);

  useEffect(() => {
    if (!playerRef.current && videoRef.current) {
      playerRef.current = videojs(videoRef.current, {
        controls: true,
        autoplay: false,
        preload: "metadata",
        fluid: true,
        responsive: true,
        poster: poster || "",
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
        controlBar: {
          children: [
            "playToggle",
            "skipBackward",
            "skipForward",
            "volumePanel",
            "currentTimeDisplay",
            "timeDivider",
            "durationDisplay",
            "progressControl",
            "playbackRateMenuButton",
            "fullscreenToggle",
          ],
          skipButtons: { forward: 10, backward: 10 },
        },
        html5: {
          vhs: {
            overrideNative: true,
            enableLowInitialPlaylist: true,
          },
        },
      });

      playerRef.current.on("ready", () => {
        if (onReady) onReady(playerRef.current);
        if (onPlayerReady) onPlayerReady(playerRef.current);
      });

      playerRef.current.on("timeupdate", () => {
        if (onTimeUpdate) onTimeUpdate(playerRef.current.currentTime());
      });

      // ── Seek blocking cho quiz ─────────────────────────────────────────
      // ✅ FIX v3: Gọi onSeeking TRƯỚC để notifySeekStart đóng băng lastKnownTimeRef
      // ngay khi seeking bắt đầu — timeupdate bắn song song sẽ bị bỏ qua.
      playerRef.current.on("seeking", () => {
        if (onSeeking) onSeeking(playerRef.current.currentTime(), playerRef.current);
      });

      // ✅ FIX v3: seeked → notifySeekEnd → mở khóa isSeekingRef + cập nhật lastKnownTimeRef
      playerRef.current.on("seeked", () => {
        if (onSeeked) onSeeked(playerRef.current.currentTime());
      });

      playerRef.current.on("ended", () => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        if (onEnded) onEnded();
      });

      // Interval gửi progress mỗi 10s khi đang play
      playerRef.current.on("play", () => {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = setInterval(() => {
          if (playerRef.current && !playerRef.current.paused() && !playerRef.current.ended()) {
            const currentTime = playerRef.current.currentTime();
            if (onProgress && currentTime > 0) onProgress(currentTime);
          }
        }, 10000);
      });

      playerRef.current.on("pause", () => {
        if (playerRef.current && onProgress) {
          const currentTime = playerRef.current.currentTime();
          if (currentTime > 0) onProgress(currentTime);
        }
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      });
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  // ─── Effect: load source mới ─────────────────────────────────────────────
  useEffect(() => {
    if (!playerRef.current || !src) return;

    playerRef.current.src({ src, type: "video/mp4" });
    if (poster) playerRef.current.poster(poster);

    // Một lần duy nhất: seek đến vị trí resume sau khi metadata load
    playerRef.current.one("loadedmetadata", () => {
      if (startTimeRef.current > 0 && playerRef.current) {
        playerRef.current.currentTime(startTimeRef.current);
      }
    });
  }, [src]);

  // ─── Effect: startTime prop thay đổi ─────────────────────────────────────
  useEffect(() => {
    startTimeRef.current = startTime;

    if (!playerRef.current || startTime <= 0) return;

    // readyState >= 1 (HAVE_METADATA): seek ngay lập tức
    if (playerRef.current.readyState() >= 1) {
      playerRef.current.currentTime(startTime);
    } else {
      // Metadata chưa load: gắn thêm handler (trường hợp startTime update
      // trước loadedmetadata event, đảm bảo seek không bị bỏ sót)
      playerRef.current.one("loadedmetadata", () => {
        if (startTimeRef.current > 0 && playerRef.current) {
          playerRef.current.currentTime(startTimeRef.current);
        }
      });
    }
  }, [startTime]);



  return (
    <div data-vjs-player className="w-full">
      <video
        crossOrigin="anonymous"
        ref={videoRef}
        className="video-js vjs-big-play-centered vjs-theme-custom w-full"
      />
    </div>
  );
};


// ======================== RESOURCE ITEM ========================

const ResourceItem = ({ resource }) => {
  const isLink = resource.type === "link";
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-rose-200 hover:shadow-sm transition-all group"
    >
      <div className="w-9 h-9 bg-rose-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-rose-100 transition-colors">
        {isLink ? (
          <LinkIcon size={16} className="text-rose-500" />
        ) : (
          <File size={16} className="text-rose-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700 truncate group-hover:text-rose-600 transition-colors">
          {resource.title || "Untitled"}
        </p>
        <p className="text-xs text-gray-400 uppercase tracking-wide">
          {isLink ? "External Link" : "File Download"}
        </p>
      </div>
      <Download
        size={14}
        className="text-gray-300 group-hover:text-rose-400 transition-colors flex-shrink-0"
      />
    </a>
  );
};

// ======================== MAIN VIDEO PLAYER ========================

/**
 * VideoPlayer — chỉ render nội dung (video + info bên dưới).
 * Không tự scroll; overflow được quản lý bởi component cha (CoursePlayer > main).
 */
const VideoPlayer = ({
  lecture,
  courseId,
  courseSlug,       // ── THÊM: dùng cho quiz API
  lastWatchedTime,
  onNext,
  onPrevious,
  onToggleComplete,
  onVideoProgress,
  isCompleted,
  user,
  isEnrolled,
  isInstructor,
}) => {
  const location = useLocation();

  // ─── Quiz logic ───────────────────────────────────────────────────────────
  const quizzes = lecture?.quizzes || [];
  const playerInstanceRef = useRef(null); // giữ video.js player instance
  const [isReviewOpen, setIsReviewOpen] = useState(false); // Quiz Review panel

  const {
    onTimeUpdate: quizTimeUpdate,
    onSeeked: quizSeeked,
    checkSeekBlock,
    notifySeekStart, // ✅ FIX v3: đóng băng lastKnownTimeRef khi user bắt đầu seek
    notifySeekEnd,   // ✅ FIX v3: mở khóa sau khi seeked
    submitAnswer,
    resetQuizAttempt,
    resetAllQuizAttempts,
    reset: resetQuiz,
    activeQuiz,
    quizBlocked,
    completedQuizzes, // dùng để tô màu markers đã hoàn thành
    lastKnownTimeRef, // vị trí trước khi seek
    pendingRetakeRef, // ✅ FIX v3: guaranteed trigger sau retake
  } = useVideoQuiz(courseSlug, lecture?._id, quizzes);

  // Reset quiz khi đổi bài giảng
  useEffect(() => {
    resetQuiz();
  }, [lecture?._id, resetQuiz]);

  // Sync lastKnownTimeRef với lastWatchedTime khi thay đổi bài giảng hoặc có tiến độ đã lưu
  useEffect(() => {
    if (lastKnownTimeRef) {
      lastKnownTimeRef.current = lastWatchedTime || 0;
    }
  }, [lastWatchedTime, lecture?._id, lastKnownTimeRef]);

  // Pause video khi có quiz active
  useEffect(() => {
    if (quizBlocked && playerInstanceRef.current) {
      try { playerInstanceRef.current.pause(); } catch (_) {}
    }
  }, [quizBlocked]);

  // ─── handleSeeking: chặn FORWARD seek qua quiz chưa làm ────────────────────
  /**
   * ✅ FIX v3: Gọi notifySeekStart() ĐẦU TIÊN — đóng băng lastKnownTimeRef
   * TRƯỚC khi timeupdate (vốn có thể bắn đồng thời) có cơ hội ghi đè.
   * Sau đó mới gọi checkSeekBlock — lúc này lastKnownTimeRef đáng tin cậy.
   */
  const handleSeeking = useCallback((seekTo, player) => {
    // ✅ Bước 1: đóng băng lastKnownTimeRef ngay lập tức
    notifySeekStart();
    // ✅ Bước 2: kiểm tra block với beforeTime đáng tin cậy
    const beforeTime = lastKnownTimeRef?.current ?? 0;
    const { blocked, revertTo } = checkSeekBlock(seekTo, beforeTime);
    if (blocked && player) {
      try { player.currentTime(revertTo); } catch (_) {}
      toast.warning('⚠️ Hãy trả lời câu hỏi trước khi xem tiếp!', { toastId: 'quiz-block', autoClose: 2500 });
    }
  }, [notifySeekStart, checkSeekBlock, lastKnownTimeRef]);

  // ─── handleRetakeQuiz — tua video về vị trí quiz sau khi reset ────────────
  /**
   * ✅ FIX v3: Dùng pendingRetakeRef để đảm bảo quiz overlay hiện lại.
   *
   * Vấn đề cũ: player.play() sau currentTime(ts-1) khiến Video.js nhảy cóc
   * — timeupdate bắn với diff > 1.5s → không pass isNormalProgression
   * → triggeredRef đã xóa nhưng quiz KHÔNG được dispatch.
   *
   * Giải pháp mới: Set pendingRetakeRef trước seek → onTimeUpdate kiểm tra
   * pendingRetakeRef với cửa sổ rộng hơn [ts-0.5, ts+3] → guaranteed trigger.
   */
  const handleRetakeQuiz = useCallback((quizIndex) => {
    const quiz = quizzes[quizIndex];
    if (!quiz || !playerInstanceRef.current) return;
    const ts = Number(quiz.timestamp);
    try {
      // ✅ Bước 1: đăng ký pending trigger TRƯỚC khi seek
      if (pendingRetakeRef) {
        pendingRetakeRef.current = quizIndex;
      }
      // ✅ Bước 2: tua về 1s trước quiz và play
      playerInstanceRef.current.currentTime(Math.max(0, ts - 1));
      playerInstanceRef.current.play();
    } catch (_) {}
  }, [quizzes, pendingRetakeRef]);


  const [videoUrl, setVideoUrl] = useState(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [urlError, setUrlError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'resources'

  // ─── Quiz Markers state ───────────────────────────────────────────────────
  const [videoDuration, setVideoDuration] = useState(0); // tổng thời lượng video
  const [markerCurrentTime, setMarkerCurrentTime] = useState(0); // currentTime cho markers

  const fetchVideoUrl = useCallback(async () => {
    if (!lecture?._id || !courseId) return;
    setIsLoadingUrl(true);
    setUrlError(null);
    setVideoUrl(null);
    try {
      const res = await courseApi.getVideoPlayUrl(courseId, lecture._id);
      const { videoUrl: signedUrl } = res.data.data;
      setVideoUrl(signedUrl);
    } catch (err) {
      console.error("[VideoPlayer] Failed to get signed URL:", err);
      if (lecture.videoUrl) {
        setVideoUrl(lecture.videoUrl);
      } else {
        setUrlError("Không thể tải video. Vui lòng thử lại.");
      }
    } finally {
      setIsLoadingUrl(false);
    }
  }, [lecture?._id, courseId]);

  useEffect(() => {
    fetchVideoUrl();

    // Kiểm tra xem URL có chứa param của thảo luận không
    const urlParams = new URLSearchParams(location.search);
    const hasDiscussionLink =
      urlParams.get("discussionId") || urlParams.get("replyId");

    if (hasDiscussionLink) {
      setActiveTab("discussion"); // Tự động mở tab Hỏi đáp
    } else {
      setActiveTab("overview"); // Mặc định mở Tổng quan
    }
  }, [fetchVideoUrl, location.search]);

  const parsedResources = React.useMemo(() => {
    if (!lecture?.resources || !Array.isArray(lecture.resources)) return [];
    return lecture.resources
      .filter(Boolean)
      .map((r) => {
        if (typeof r === "object") return r;
        try {
          return JSON.parse(r);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  }, [lecture?.resources]);

  const formatDuration = (seconds) => {
    if (!seconds) return "";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  if (!lecture) {
    return (
      <div
        className="flex flex-col items-center justify-center bg-gray-900"
        style={{ aspectRatio: "16/9" }}
      >
        <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mb-3">
          <Cloud size={28} className="text-gray-600" />
        </div>
        <p className="text-sm font-medium text-gray-400">
          Chọn bài giảng để bắt đầu
        </p>
      </div>
    );
  }

  const isCFUrl = videoUrl && videoUrl.includes("cloudfront.net");

  return (
    <>
    <div className="flex flex-col bg-white min-h-full">
      {/* ===== VIDEO AREA (dark background, aspect-ratio cố định) ===== */}
      <div className="w-full bg-black relative">
        {isLoadingUrl ? (
          <div
            className="w-full flex flex-col items-center justify-center text-white/60 bg-gray-950"
            style={{ aspectRatio: "16/9" }}
          >
            <Loader2 size={40} className="animate-spin text-rose-400 mb-3" />
            <p className="text-sm">Đang tải video</p>
          </div>
        ) : urlError ? (
          <div
            className="w-full flex flex-col items-center justify-center text-white/60 bg-gray-950"
            style={{ aspectRatio: "16/9" }}
          >
            <AlertCircle size={40} className="text-rose-400 mb-3" />
            <p className="text-sm text-center px-4">{urlError}</p>
            <button
              onClick={fetchVideoUrl}
              className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors"
            >
              <RefreshCw size={14} /> Thử lại
            </button>
          </div>
        ) : videoUrl ? (
          <>
            {/* Resume badge khi có lastWatchedTime > 10s */}
            {lastWatchedTime > 10 && !quizBlocked && (
              <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-rose-600/90 backdrop-blur-sm rounded-full px-3 py-1 pointer-events-none">
                <span className="text-white text-xs font-semibold">
                  ▶ Tiếp tục từ {Math.floor(lastWatchedTime / 60)}:{String(Math.floor(lastWatchedTime % 60)).padStart(2, '0')}
                </span>
              </div>
            )}
            <VideoJSPlayer
              key={lecture._id}
              src={videoUrl}
              poster={lecture.thumbnail || ""}
              startTime={lastWatchedTime || 0}
              onTimeUpdate={(t) => {
                quizTimeUpdate(t);
                setMarkerCurrentTime(t);
              }}
              onSeeking={handleSeeking}
              onSeeked={quizSeeked}
              onPlayerReady={(player) => {
                playerInstanceRef.current = player;
                // Lấy duration khi metadata đã load
                const updateDuration = () => {
                  const d = player.duration();
                  if (d && isFinite(d) && d > 0) setVideoDuration(d);
                };
                player.on('loadedmetadata', updateDuration);
                player.on('durationchange', updateDuration);
                updateDuration(); // Thử lấy ngay nếu đã sẵn sàng
              }}
              onProgress={onVideoProgress}
              onEnded={() => {
                if (!isCompleted) onToggleComplete?.();
              }}
            />
            {/* ── Quiz Progress Markers ─────────────────────────────────── */}
            {quizzes.length > 0 && videoDuration > 0 && (
              <QuizProgressMarkers
                playerRef={playerInstanceRef}
                quizzes={quizzes}
                videoDuration={videoDuration || lecture?.duration}
                currentTime={markerCurrentTime}
                completedQuizzes={completedQuizzes}
                lectureId={lecture?._id}
              />
            )}
            {/* ── Quiz Overlay ──────────────────────────────────────────── */}
            {activeQuiz && (
              <VideoQuizOverlay
                quiz={activeQuiz.quiz}
                onSubmit={(answer) => submitAnswer(activeQuiz.quizIndex, answer)}
                onCorrect={() => {
                  // ✅ FIX: Delay nhỏ trước khi resume → tránh race condition
                  // markQuizComplete dispatch xong mới play → checkSeekBlock sẽ thấy quiz đã done
                  setTimeout(() => {
                    if (playerInstanceRef.current) {
                      try { playerInstanceRef.current.play(); } catch (_) {}
                    }
                  }, 150);
                }}
              />
            )}
          </>
        ) : (
          <div
            className="w-full flex flex-col items-center justify-center text-white/40 bg-gray-950"
            style={{ aspectRatio: "16/9" }}
          >
            <p className="text-sm">Video không khả dụng</p>
          </div>
        )}
      </div>

      {/* ===== CONTENT BELOW VIDEO ===== */}
      <div className="flex-1 flex flex-col">
        {/* --- Lecture Title & Navigation --- */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            {/* Title */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 leading-snug">
                {lecture.title}
              </h1>
              {lecture.duration > 0 && (
                <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
                  <span>⏱</span>
                  {formatDuration(lecture.duration)}
                </p>
              )}
            </div>

            {/* Mark Complete Button */}
            <button
              onClick={onToggleComplete}
              className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all border shadow-sm ${isCompleted
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                : "bg-rose-600 text-white border-rose-600 hover:bg-rose-700 shadow-rose-200"
                }`}
            >
              <CheckCircle
                size={16}
                className={isCompleted ? "text-emerald-600" : "text-white"}
              />
              {isCompleted ? "Đã hoàn thành" : "Hoàn thành bài học"}
            </button>

            {/* Quiz Review Button — chỉ hiện khi có quiz active */}
            {quizzes.filter(q => q.isActive !== false).length > 0 && (
              <button
                id="quiz-review-btn"
                onClick={() => setIsReviewOpen(true)}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm
                           bg-indigo-50 text-indigo-700 border border-indigo-200
                           hover:bg-indigo-100 transition-all shadow-sm"
              >
                📋 Xem lại câu hỏi ({quizzes.filter(q => q.isActive !== false).length})
              </button>
            )}
          </div>

          {/* Prev / Next Navigation */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={onPrevious}
              className="flex items-center gap-1.5 px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-xl font-medium hover:border-rose-400 hover:text-rose-600 transition-all text-sm shadow-sm"
            >
              <ChevronLeft size={16} /> Bài trước
            </button>
            <button
              onClick={onNext}
              className="flex items-center gap-1.5 px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-xl font-medium hover:border-rose-400 hover:text-rose-600 transition-all text-sm shadow-sm"
            >
              Bài tiếp <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* --- Tabs (Overview / Resources / Discussion) --- */}
        <div className="flex gap-0 border-b border-gray-100 px-6">
          {[
            { id: "overview", label: "Tổng quan", icon: BookOpen },
            ...(parsedResources.length > 0
              ? [
                {
                  id: "resources",
                  label: `Tài liệu (${parsedResources.length})`,
                  icon: FileText,
                },
              ]
              : []),
            {
              id: "discussion",
              label: "Hỏi đáp & Thảo luận",
              icon: MessageSquare,
            }, // Tab mới
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${activeTab === id
                ? "border-rose-500 text-rose-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* --- Tab Content --- */}
        <div className="flex-1 px-6 py-5">
          {activeTab === "overview" && (
            <div className="space-y-4">
              {/* Lecture description */}
              {lecture.description ? (
                <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">
                  <p>{lecture.description}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-gray-300">
                  <BookOpen size={32} className="mb-2" />
                  <p className="text-sm text-gray-400">
                    Bài giảng này chưa có mô tả.
                  </p>
                </div>
              )}

              {/* CloudFront Info
              {isCFUrl && (
                <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3 mt-4">
                  <Cloud size={13} className="text-blue-400 flex-shrink-0" />
                  <span>
                    Video được phân phối qua{" "}
                    <strong className="text-gray-600">
                      AWS CloudFront CDN
                    </strong>{" "}
                    — bảo mật và tốc độ cao.
                  </span>
                </div>
              )} */}
            </div>
          )}

          {activeTab === "resources" && parsedResources.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Download size={15} className="text-rose-500" />
                Tài liệu đính kèm ({parsedResources.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {parsedResources.map((res, idx) => (
                  <ResourceItem key={idx} resource={res} />
                ))}
              </div>
            </div>
          )}

          {/* --- Discussion Section (Tab Thảo luận) --- */}
          {activeTab === "discussion" && (
            <div className="fade-in">
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <MessageSquare size={15} className="text-rose-500" />
                Thảo luận Bài giảng
              </h3>

              {/* TRUYỀN ĐẦY ĐỦ PROPS XUỐNG COURUSEDISCUSSION NẰM Ở ĐÂY */}
              <CourseDiscussion
                courseId={courseId}
                lectureId={lecture._id}
                user={user}
                isEnrolled={isEnrolled}
                isInstructor={isInstructor}
              />
            </div>
          )}
        </div>
      </div>
    </div>

    {/* ── Quiz Review Panel (ngoài flex container để không bị clip) ── */}
    <QuizReviewModal
      isOpen={isReviewOpen}
      onClose={() => setIsReviewOpen(false)}
      courseSlug={courseSlug}
      lectureId={lecture?._id}
      quizzes={quizzes}
      onRetake={handleRetakeQuiz}
      onRetakeAll={resetAllQuizAttempts}
    />
    </>
  );
};

export default VideoPlayer;
