// client/src/components/learning/QuizProgressMarkers.jsx
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * formatTimestamp — chuyển giây → "mm:ss"
 */
const formatTimestamp = (sec) => {
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
};

/**
 * QuizMarkerDot — một chấm marker đơn lẻ (render bên trong container)
 *
 * Props:
 *   quiz        - quiz object { timestamp, question }
 *   duration    - tổng thời lượng video (giây)
 *   isDone      - quiz đã hoàn thành chưa?
 *   isNear      - video hiện tại đang gần marker này (<= 3s)?
 */
const QuizMarkerDot = ({ quiz, duration, isDone, isNear, index }) => {
  if (!duration || duration <= 0) return null;

  const ts = Number(quiz.timestamp);
  const pct = Math.min(Math.max((ts / duration) * 100, 0.5), 99.5);

  // Màu sắc marker theo trạng thái
  const dotColor = isDone
    ? '#10b981'   // emerald-500 — đã làm xong
    : '#f59e0b';  // amber-500  — chưa làm

  const glowColor = isDone
    ? 'rgba(16,185,129,0.5)'
    : 'rgba(245,158,11,0.6)';

  return (
    <div
      style={{
        position: 'absolute',
        left: `calc(${pct}% - 6px)`,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 20,
        // Đảm bảo không bị clip bởi overflow:hidden của progress bar
        pointerEvents: 'auto',
      }}
      className="quiz-marker-wrapper"
    >
      {/* ── Dot ── */}
      <div
        style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: dotColor,
          border: '2px solid rgba(255,255,255,0.9)',
          boxShadow: isNear
            ? `0 0 0 4px ${glowColor}, 0 0 12px ${glowColor}`
            : `0 0 0 0px transparent`,
          transition: 'box-shadow 0.3s ease, transform 0.2s ease',
          transform: isNear ? 'scale(1.35)' : 'scale(1)',
          cursor: 'pointer',
          position: 'relative',
        }}
        className="quiz-marker-dot"
      >
        {/* Icon "?" nhỏ bên trong chấm */}
        {!isDone && (
          <span
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 7,
              fontWeight: 900,
              color: 'white',
              lineHeight: 1,
              userSelect: 'none',
            }}
          >
            ?
          </span>
        )}
        {/* Checkmark khi đã hoàn thành */}
        {isDone && (
          <span
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 7,
              fontWeight: 900,
              color: 'white',
              lineHeight: 1,
              userSelect: 'none',
            }}
          >
            ✓
          </span>
        )}
      </div>

      {/* ── Tooltip ── */}
      <div
        className="quiz-marker-tooltip"
        style={{
          position: 'absolute',
          bottom: 'calc(100% + 10px)',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(17,24,39,0.95)',
          backdropFilter: 'blur(8px)',
          color: 'white',
          borderRadius: 8,
          padding: '6px 10px',
          whiteSpace: 'nowrap',
          fontSize: 11,
          fontWeight: 500,
          fontFamily: 'system-ui, sans-serif',
          pointerEvents: 'none',
          opacity: 0,
          transition: 'opacity 0.18s ease, transform 0.18s ease',
          transformOrigin: 'bottom center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          border: `1px solid ${isDone ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.4)'}`,
          lineHeight: 1.4,
          zIndex: 100,
        }}
      >
        {/* Badge trạng thái */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            marginBottom: 2,
            fontSize: 9,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: isDone ? '#6ee7b7' : '#fcd34d',
          }}
        >
          {isDone ? '✓ Đã hoàn thành' : '📋 Trắc nghiệm'}
        </span>
        <br />
        <span style={{ color: '#9ca3af', fontSize: 10 }}>
          tại {formatTimestamp(ts)}
        </span>
        {/* Arrow */}
        <div
          style={{
            position: 'absolute',
            bottom: -5,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 8,
            height: 8,
            backgroundColor: 'rgba(17,24,39,0.95)',
            borderRight: `1px solid ${isDone ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.4)'}`,
            borderBottom: `1px solid ${isDone ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.4)'}`,
            transform: 'translateX(-50%) rotate(45deg)',
          }}
        />
      </div>

      {/* Pulse ring khi gần marker */}
      {isNear && !isDone && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 20,
            height: 20,
            borderRadius: '50%',
            border: `2px solid ${dotColor}`,
            animation: 'quizMarkerPulse 1.2s ease-out infinite',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
};

/**
 * QuizProgressMarkers
 *
 * Component chính — inject markers container vào DOM của Video.js.
 *
 * Props:
 *   playerRef      - React ref trỏ tới video.js player instance
 *   quizzes        - mảng quiz objects [{ timestamp, question, ... }]
 *   videoDuration  - tổng thời lượng video (giây), lấy từ player.duration()
 *   currentTime    - thời điểm hiện tại của video (giây)
 *   completedQuizzes - mảng { lectureId, quizIndex } từ Redux state
 *   lectureId      - _id của lecture hiện tại (để filter completedQuizzes)
 */
const QuizProgressMarkers = ({
  playerRef,
  quizzes = [],
  videoDuration,
  currentTime = 0,
  completedQuizzes = [],
  lectureId,
}) => {
  const containerRef = useRef(null);
  const mountedRef = useRef(false);

  // ── Inject container vào DOM của Video.js ─────────────────────────────────
  useEffect(() => {
    if (!playerRef?.current || mountedRef.current || !quizzes.length) return;

    const tryMount = () => {
      const player = playerRef.current;
      if (!player || player.isDisposed()) return;

      // Video.js DOM: .vjs-progress-control > .vjs-progress-holder
      const progressHolder = player.el()?.querySelector('.vjs-progress-holder');
      if (!progressHolder) {
        // Player chưa ready, thử lại sau 200ms
        setTimeout(tryMount, 200);
        return;
      }

      // Đảm bảo .vjs-progress-holder có position relative
      progressHolder.style.position = 'relative';
      progressHolder.style.overflow = 'visible'; // Cho phép tooltip tràn ra ngoài

      // Tạo container div cho markers
      const container = document.createElement('div');
      container.className = 'vjs-quiz-markers-container';
      container.style.cssText = `
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 15;
        overflow: visible;
      `;
      progressHolder.appendChild(container);
      containerRef.current = container;
      mountedRef.current = true;
    };

    // Đảm bảo player đã ready
    const player = playerRef.current;
    if (player.isReady_) {
      tryMount();
    } else {
      player.ready(tryMount);
    }

    return () => {
      // Cleanup khi unmount hoặc lecture thay đổi
      if (containerRef.current && containerRef.current.parentNode) {
        containerRef.current.parentNode.removeChild(containerRef.current);
      }
      containerRef.current = null;
      mountedRef.current = false;
    };
  }, [playerRef, quizzes.length, lectureId]);

  // ── CSS animations (inject một lần vào <head>) ────────────────────────────
  useEffect(() => {
    if (document.getElementById('quiz-marker-styles')) return;

    const style = document.createElement('style');
    style.id = 'quiz-marker-styles';
    style.textContent = `
      @keyframes quizMarkerPulse {
        0%   { transform: translate(-50%, -50%) scale(1);   opacity: 0.8; }
        100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
      }

      /* Tooltip hover — dùng CSS sibling selector */
      .quiz-marker-wrapper:hover .quiz-marker-tooltip {
        opacity: 1 !important;
        transform: translateX(-50%) translateY(-3px) !important;
      }
      .quiz-marker-wrapper:hover .quiz-marker-dot {
        transform: scale(1.5) !important;
      }

      /* Đảm bảo .vjs-progress-control không clip tooltip */
      .video-js .vjs-progress-control {
        overflow: visible !important;
      }
      .video-js .vjs-progress-holder {
        overflow: visible !important;
      }
      .video-js .vjs-play-progress {
        overflow: visible !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const el = document.getElementById('quiz-marker-styles');
      if (el) el.remove();
    };
  }, []);

  // ── Render markers vào container qua Portal ───────────────────────────────
  if (!containerRef.current || !quizzes.length || !videoDuration) return null;

  const activeQuizzes = quizzes.filter(q => q.isActive !== false);

  return createPortal(
    <div style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}>
      {/* Cho phép hover events trên từng marker */}
      <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'auto' }}>
        {activeQuizzes.map((quiz, idx) => {
          const quizIndex = quizzes.indexOf(quiz);
          const isDone = completedQuizzes.some(
            q => String(q.lectureId) === String(lectureId) && q.quizIndex === quizIndex
          );
          const ts = Number(quiz.timestamp);
          const isNear = Math.abs(currentTime - ts) <= 3 && !isDone;

          return (
            <QuizMarkerDot
              key={quiz._id || idx}
              quiz={quiz}
              duration={videoDuration}
              isDone={isDone}
              isNear={isNear}
              index={idx}
            />
          );
        })}
      </div>
    </div>,
    containerRef.current
  );
};

export default QuizProgressMarkers;
export { formatTimestamp };
