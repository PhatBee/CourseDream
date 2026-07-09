// course-app/src/components/learning/QuizProgressMarkersMobile.js
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';

// ─── Helper: format giây → "mm:ss" ──────────────────────────────────────────
const formatTs = (sec) => {
  const s = Math.floor(Number(sec) || 0);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
};

// ─── MARKER DOT ─────────────────────────────────────────────────────────────
/**
 * MarkerDot — một chấm tròn đơn lẻ trên timeline
 *
 * Props:
 *   pct        - vị trí phần trăm [0..100]
 *   isDone     - đã hoàn thành quiz chưa?
 *   isNear     - video đang gần marker này (±3s)?
 *   timestamp  - giây (để hiển thị tooltip)
 *   trackWidth - chiều rộng track đã đo bằng onLayout (px)
 */
const MarkerDot = ({ pct, isDone, isNear, timestamp, trackWidth }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation khi gần marker
  React.useEffect(() => {
    if (isNear && !isDone) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.6,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isNear, isDone]);

  // Màu sắc theo trạng thái
  const dotColor = isDone ? '#10b981' : '#f59e0b';   // emerald | amber
  const dotBorderColor = isDone ? '#6ee7b7' : '#fde68a';

  // Tính toán left position (px) — trừ nửa dot width để center
  // trackWidth cần > 0 để tránh render sai vị trí
  const DOT_SIZE = 14;
  const leftPx = trackWidth > 0
    ? Math.max(0, Math.min((pct / 100) * trackWidth - DOT_SIZE / 2, trackWidth - DOT_SIZE))
    : null;

  if (leftPx === null) return null; // Chưa đo được width

  // Tooltip position: nếu marker ở gần đầu → tooltip bên phải, gần cuối → bên trái
  const tooltipSide = pct > 70 ? 'right' : 'left';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => setShowTooltip(prev => !prev)}
      hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
      style={[styles.markerWrapper, { left: leftPx }]}
    >
      {/* Pulse ring — hiện khi gần marker và chưa làm */}
      {isNear && !isDone && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pulseRing,
            {
              borderColor: dotColor,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
      )}

      {/* Dot chính */}
      <View
        style={[
          styles.dot,
          {
            backgroundColor: dotColor,
            borderColor: dotBorderColor,
            width: DOT_SIZE,
            height: DOT_SIZE,
            borderRadius: DOT_SIZE / 2,
          },
        ]}
      >
        <Text style={styles.dotLabel}>{isDone ? '✓' : '?'}</Text>
      </View>

      {/* Tooltip */}
      {showTooltip && (
        <View
          style={[
            styles.tooltip,
            tooltipSide === 'right'
              ? { right: 0 }
              : { left: 0 },
          ]}
          pointerEvents="none"
        >
          {/* Arrow */}
          <View
            style={[
              styles.tooltipArrow,
              tooltipSide === 'right'
                ? { alignSelf: 'flex-end', marginRight: DOT_SIZE / 2 - 4 }
                : { alignSelf: 'flex-start', marginLeft: DOT_SIZE / 2 - 4 },
            ]}
          />
          <View style={styles.tooltipBody}>
            <Text style={[styles.tooltipStatus, { color: isDone ? '#6ee7b7' : '#fcd34d' }]}>
              {isDone ? '✓ Đã hoàn thành' : '📋 Trắc nghiệm'}
            </Text>
            <Text style={styles.tooltipTime}>tại {formatTs(timestamp)}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ─── QUIZ PROGRESS MARKERS (Main Component) ─────────────────────────────────
/**
 * QuizProgressMarkersMobile
 *
 * Thanh tiến độ tùy biến với markers chấm tròn tại vị trí quiz.
 * Đặt bên dưới VideoView và trên/dưới native controls.
 *
 * Props:
 *   quizzes          - mảng quiz [{ timestamp, isActive, ... }]
 *   videoDuration    - tổng thời lượng video (giây)
 *   currentTime      - thời điểm hiện tại (giây) — cập nhật mỗi 500ms
 *   completedQuizzes - mảng [{ lectureId, quizIndex }]
 *   lectureId        - _id bài giảng hiện tại
 *   playedPercent    - % video đã xem [0..100] để render fill bar
 *   bufferedPercent  - % đã buffer [0..100] (optional)
 *   style            - style bổ sung cho container
 */
const QuizProgressMarkersMobile = ({
  quizzes = [],
  videoDuration = 0,
  currentTime = 0,
  completedQuizzes = [],
  lectureId,
  playedPercent = 0,
  bufferedPercent = 0,
  style,
}) => {
  // Đo chiều rộng track bằng onLayout — đây là cách chính xác nhất trên RN
  const [trackWidth, setTrackWidth] = useState(0);

  const handleTrackLayout = useCallback((e) => {
    const { width } = e.nativeEvent.layout;
    if (width > 0) setTrackWidth(width);
  }, []);

  // Lọc quiz active
  const activeQuizzes = quizzes.filter(q => q.isActive !== false);

  if (!activeQuizzes.length || videoDuration <= 0) return null;

  // Tính fill %
  const fillPct = Math.min(Math.max(playedPercent, 0), 100);
  const bufferPct = Math.min(Math.max(bufferedPercent, 0), 100);

  return (
    <View style={[styles.container, style]} pointerEvents="box-none">
      {/* ── Track tổng (background) ── */}
      <View style={styles.track} onLayout={handleTrackLayout} pointerEvents="box-none">

        {/* Buffer fill (màu xám nhạt) */}
        <View style={[styles.bufferFill, { width: `${bufferPct}%` }]} pointerEvents="none" />

        {/* Played fill (màu đỏ chính) */}
        <View style={[styles.playedFill, { width: `${fillPct}%` }]} pointerEvents="none" />

        {/* ── Quiz Markers — render sau track fills để đè lên ── */}
        {activeQuizzes.map((quiz, idx) => {
          const quizIndex = quizzes.indexOf(quiz);
          const ts = Number(quiz.timestamp);
          const pct = videoDuration > 0
            ? Math.min(Math.max((ts / videoDuration) * 100, 0.5), 99.5)
            : 0;

          const isDone = completedQuizzes.some(
            q => String(q.lectureId) === String(lectureId)
              && q.quizIndex === quizIndex
              && q.isCorrect !== false
          );
          const isNear = Math.abs(currentTime - ts) <= 3 && !isDone;

          return (
            <MarkerDot
              key={quiz._id || idx}
              pct={pct}
              isDone={isDone}
              isNear={isNear}
              timestamp={ts}
              trackWidth={trackWidth}
            />
          );
        })}
      </View>

      {/* ── Timestamp labels ── */}
      <View style={styles.timeRow} pointerEvents="none">
        <Text style={styles.timeLabel}>{formatTs(currentTime)}</Text>
        <Text style={styles.timeLabel}>{formatTs(videoDuration)}</Text>
      </View>
    </View>
  );
};


// ─── STYLES ─────────────────────────────────────────────────────────────────
const TRACK_HEIGHT = 4;
const DOT_HALF = 7; // = DOT_SIZE/2

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 12,
    paddingBottom: 6,
  },

  // ── Track ──
  track: {
    width: '100%',
    height: TRACK_HEIGHT,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: TRACK_HEIGHT / 2,
    // overflow hidden nhưng KHÔNG áp dụng vì markers cần nhô ra ngoài
    // → markers render với position absolute trong View cha không có overflow hidden
    position: 'relative',
    marginBottom: 4,
    // Đủ padding vertical để marker (14px) không bị clip
    marginVertical: DOT_HALF,
    overflow: 'visible',
  },

  bufferFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: TRACK_HEIGHT / 2,
  },

  playedFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#e11d48',
    borderRadius: TRACK_HEIGHT / 2,
  },

  // ── Marker ──
  markerWrapper: {
    position: 'absolute',
    top: -(DOT_HALF - TRACK_HEIGHT / 2), // Center dot trên track
    alignItems: 'center',
    zIndex: 10,
    // overflow visible mặc định trên RN, không cần khai báo
  },

  pulseRing: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    opacity: 0.7,
    // transform được inject từ Animated.Value
  },

  dot: {
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    // Bóng đổ cho dot nổi bật trên background
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
      },
      android: { elevation: 3 },
    }),
  },

  dotLabel: {
    fontSize: 6,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 8,
    includeFontPadding: false,
  },

  // ── Tooltip ──
  tooltip: {
    position: 'absolute',
    bottom: '100%',
    marginBottom: 6,
    zIndex: 20,
    minWidth: 120,
  },

  tooltipArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(17,24,39,0.95)',
    marginBottom: -1,
  },

  tooltipBody: {
    backgroundColor: 'rgba(17,24,39,0.95)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 2,
    // Shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: { elevation: 5 },
    }),
  },

  tooltipStatus: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  tooltipTime: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '500',
  },

  // ── Time labels ──
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },

  timeLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
});

export default QuizProgressMarkersMobile;
export { formatTs };
