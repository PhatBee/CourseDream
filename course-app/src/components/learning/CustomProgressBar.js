// course-app/src/components/learning/CustomProgressBar.js
import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Platform,
} from 'react-native';

const CustomProgressBar = ({
  currentTime,
  duration,
  quizzes = [],
  completedQuizzes = [],
  lectureId,
  onSeek,
}) => {
  const [trackWidth, setTrackWidth] = useState(0);
  const [localSeekTime, setLocalSeekTime] = useState(null);
  const trackRef = useRef(null);

  // Refs để tránh closure stale trong PanResponder
  const trackWidthRef = useRef(0);
  const durationRef = useRef(duration);
  const onSeekRef = useRef(onSeek);
  const localSeekTimeRef = useRef(null);
  const trackLeftRef = useRef(null);

  // Đồng bộ refs ở mỗi lần render
  trackWidthRef.current = trackWidth;
  durationRef.current = duration;
  onSeekRef.current = onSeek;

  const updateLocalSeekTime = (value) => {
    localSeekTimeRef.current = value;
    setLocalSeekTime(value);
  };

  // Lọc quiz active
  const activeQuizzes = useMemo(() => quizzes.filter(q => q.isActive !== false), [quizzes]);

  // Tính toán phần trăm hiển thị
  const displayTime = localSeekTime !== null ? localSeekTime : currentTime;
  const playedPct = duration > 0 ? (displayTime / duration) * 100 : 0;
  const cappedPlayedPct = Math.min(Math.max(playedPct, 0), 100);

  // Đo chiều rộng và vị trí tuyệt đối khi component mount hoặc xoay màn hình
  const handleLayout = (e) => {
    const { width } = e.nativeEvent.layout;
    if (width > 0) {
      setTrackWidth(width);
      trackWidthRef.current = width;
    }
    if (trackRef.current) {
      trackRef.current.measure((x, y, w, h, pageX, pageY) => {
        if (w > 0) {
          setTrackWidth(w);
          trackWidthRef.current = w;
        }
        if (pageX !== undefined && pageX !== null) {
          trackLeftRef.current = pageX;
        }
      });
    }
  };

  // Tính thời gian dựa trên vị trí X (pageX/locationX)
  const calculateSeekTime = (evt, pageX, locationX) => {
    const width = trackWidthRef.current;
    const dur = durationRef.current;
    if (width <= 0 || dur <= 0) return 0;

    let localX = 0;
    if (trackLeftRef.current !== null && trackLeftRef.current !== undefined) {
      const x = pageX !== undefined && pageX !== null ? pageX : (evt?.nativeEvent?.pageX || 0);
      localX = x - trackLeftRef.current;
    } else {
      localX = locationX !== undefined && locationX !== null ? locationX : (evt?.nativeEvent?.locationX || 0);
    }

    const pct = localX / width;
    const targetSeconds = pct * dur;
    return Math.min(Math.max(targetSeconds, 0), dur);
  };

  // Tạo cử chỉ kéo (PanResponder) để trượt tua video
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const pageX = evt.nativeEvent.pageX;
        const locationX = evt.nativeEvent.locationX;
        const seekTime = calculateSeekTime(evt, pageX, locationX);
        updateLocalSeekTime(seekTime);
      },
      onPanResponderMove: (evt, gestureState) => {
        const pageX = gestureState.moveX || evt.nativeEvent.pageX;
        const locationX = evt.nativeEvent.locationX;
        const seekTime = calculateSeekTime(evt, pageX, locationX);
        updateLocalSeekTime(seekTime);
      },
      onPanResponderRelease: () => {
        if (localSeekTimeRef.current !== null) {
          onSeekRef.current(localSeekTimeRef.current);
          updateLocalSeekTime(null);
        }
      },
      onPanResponderTerminate: () => {
        updateLocalSeekTime(null);
      },
    })
  ).current;

  const formatTime = (sec) => {
    const s = Math.floor(sec || 0);
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Hàng hiển thị thời gian */}
      <View style={styles.timeRow} pointerEvents="none">
        <Text style={styles.timeText}>{formatTime(displayTime)}</Text>
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>

      {/* Vùng tương tác trượt */}
      <View 
        style={styles.trackContainer}
        {...panResponder.panHandlers}
      >
        {/* Đường ray thanh trượt */}
        <View 
          ref={trackRef}
          style={styles.trackLine} 
          onLayout={handleLayout}
          pointerEvents="none"
        >
          {/* Thanh đỏ phần tiến độ đã chạy */}
          <View style={[styles.playedFill, { width: `${cappedPlayedPct}%` }]} />

          {/* Núm kéo (Thumb) */}
          <View style={[styles.thumb, { left: `${cappedPlayedPct}%` }]} />

          {/* Chấm tròn Quiz (Markers) */}
          {trackWidth > 0 && activeQuizzes.map((quiz, idx) => {
            const quizIndex = quizzes.indexOf(quiz);
            const isDone = completedQuizzes.some(
              q => String(q.lectureId) === String(lectureId) && q.quizIndex === quizIndex
            );
            const markerPct = duration > 0 ? (quiz.timestamp / duration) * 100 : 0;
            const cappedMarkerPct = Math.min(Math.max(markerPct, 0.5), 99.5);

            return (
              <View
                key={quiz._id || idx}
                style={[
                  styles.markerDot,
                  {
                    left: `${cappedMarkerPct}%`,
                    backgroundColor: isDone ? '#10b981' : '#f59e0b',
                    borderColor: isDone ? '#34d399' : '#fcd34d',
                  }
                ]}
              >
                <Text style={styles.markerText}>{isDone ? '✓' : '?'}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const THUMB_SIZE = 14;
const MARKER_SIZE = 12;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  timeText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  trackContainer: {
    width: '100%',
    height: 24,
    justifyContent: 'center',
  },
  trackLine: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 2,
    position: 'relative',
  },
  playedFill: {
    height: '100%',
    backgroundColor: '#e11d48',
    borderRadius: 2,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#fff',
    top: -(THUMB_SIZE - 4) / 2,
    marginLeft: -THUMB_SIZE / 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.35,
        shadowRadius: 1.5,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  markerDot: {
    position: 'absolute',
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    borderWidth: 1.5,
    top: -(MARKER_SIZE - 4) / 2,
    marginLeft: -MARKER_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  markerText: {
    color: '#fff',
    fontSize: 7,
    fontWeight: '900',
    lineHeight: 8,
  },
});

export default CustomProgressBar;
