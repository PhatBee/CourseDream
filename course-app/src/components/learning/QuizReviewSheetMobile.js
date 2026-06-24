// course-app/src/components/learning/QuizReviewSheetMobile.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchQuizReview, removeQuizComplete, removeAllQuizzesForLecture } from '../../features/learning/learningSlice';
import { learningApi } from '../../api/learningApi';
import Toast from 'react-native-toast-message';

// ─── Format giây → mm:ss ─────────────────────────────────────────────────────
const fmt = (sec) => {
  const s = Math.floor(Number(sec) || 0);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

// ─── QuizReviewItem — 1 dòng quiz ────────────────────────────────────────────
const QuizReviewItem = ({ item, onRetake, isResetting }) => {
  const [expanded, setExpanded] = useState(false);
  const hasAttempt = Boolean(item.attempt);

  const statusColor = !hasAttempt ? '#d97706'
    : item.attempt.isCorrect ? '#059669'
    : '#dc2626';

  const statusBg = !hasAttempt ? '#fef3c7'
    : item.attempt.isCorrect ? '#d1fae5'
    : '#fee2e2';

  const statusText = !hasAttempt ? 'Chưa làm'
    : item.attempt.isCorrect ? `✓ Đúng · ${item.attempt.attempts} lần thử`
    : '✗ Sai';

  const statusIcon = !hasAttempt ? '🟡' : item.attempt.isCorrect ? '✅' : '❌';

  return (
    <View style={styles.item}>
      {/* Header row */}
      <View style={styles.itemHeader}>
        <Text style={styles.statusIcon}>{statusIcon}</Text>
        <Text style={styles.question} numberOfLines={expanded ? undefined : 2}>
          {item.question}
        </Text>
        <View style={styles.timestampBadge}>
          <Text style={styles.timestampText}>⏱ {fmt(item.timestamp)}</Text>
        </View>
      </View>

      {/* Status badge */}
      <View style={styles.badgeRow}>
        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
          <Text style={[styles.statusBadgeText, { color: statusColor }]}>
            {statusText}
          </Text>
        </View>

        {/* Toggle detail */}
        {hasAttempt && (
          <TouchableOpacity
            onPress={() => setExpanded(p => !p)}
            style={styles.expandBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.expandBtnText}>
              {expanded ? '▲ Ẩn chi tiết' : '▼ Xem chi tiết'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Expanded detail */}
      {expanded && hasAttempt && (
        <View style={styles.detail}>
          {/* Options */}
          {(item.options || []).map(opt => {
            const isSelected = opt.id === item.attempt.selectedAnswer;
            const isCorrect  = opt.id === item.correctAnswer;

            let optStyle = styles.option;
            let textStyle = styles.optionText;
            let suffix = '';

            if (isCorrect) {
              optStyle  = [styles.option, styles.optionCorrect];
              textStyle = [styles.optionText, { color: '#065f46' }];
              suffix    = ' ✓';
            } else if (isSelected && !isCorrect) {
              optStyle  = [styles.option, styles.optionWrong];
              textStyle = [styles.optionText, { color: '#991b1b' }];
              suffix    = ' ✗';
            }

            return (
              <View key={opt.id} style={optStyle}>
                <Text style={styles.optId}>{opt.id}.</Text>
                <Text style={textStyle}>{opt.text}{suffix}</Text>
              </View>
            );
          })}

          {/* Explanation */}
          {item.explanation ? (
            <View style={styles.explanationBox}>
              <Text style={styles.explanationText}>💡 Giải thích: {item.explanation}</Text>
            </View>
          ) : null}

          {/* Hint (khi sai và có gợi ý) */}
          {item.hint && !item.attempt.isCorrect ? (
            <View style={styles.hintBox}>
              <Text style={styles.hintText}>🔍 Gợi ý: {item.hint}</Text>
            </View>
          ) : null}
        </View>
      )}

      {/* Retake button */}
      {hasAttempt && (
        <TouchableOpacity
          onPress={onRetake}
          disabled={isResetting}
          style={[styles.retakeBtn, isResetting && { opacity: 0.5 }]}
          activeOpacity={0.7}
        >
          {isResetting
            ? <ActivityIndicator size="small" color="#4f46e5" />
            : <Text style={styles.retakeBtnText}>↺ Làm lại câu này</Text>
          }
        </TouchableOpacity>
      )}
    </View>
  );
};

// ─── QuizReviewSheetMobile — Modal chính ─────────────────────────────────────
/**
 * QuizReviewSheetMobile
 *
 * Hiển thị danh sách câu hỏi quiz theo dạng Modal (bottom sheet style).
 * Video tạm dừng khi modal mở (modal là native fullscreen).
 *
 * Props:
 *   isOpen      - boolean
 *   onClose     - fn()
 *   courseSlug  - string
 *   lectureId   - string
 *   quizzes     - mảng quiz gốc (để đếm số lượng)
 *   onRetake    - fn(quizIndex) — tua video về vị trí quiz sau khi reset
 *   onRetakeAll - fn() — callback sau khi reset tất cả
 */
const QuizReviewSheetMobile = ({
  isOpen,
  onClose,
  courseSlug,
  lectureId,
  quizzes = [],
  onRetake,
  onRetakeAll,
}) => {
  const dispatch = useDispatch();
  const { quizReviewData, isLoadingReview } = useSelector(s => s.learning);
  const [resettingIndex, setResettingIndex] = useState(null);
  const [isResettingAll, setIsResettingAll] = useState(false);

  // Fetch review data khi mở modal
  useEffect(() => {
    if (isOpen && courseSlug && lectureId) {
      dispatch(fetchQuizReview({ courseSlug, lectureId }));
    }
  }, [isOpen, courseSlug, lectureId]);

  // Reset 1 quiz (non-optimistic — server confirm trước)
  const handleRetakeOne = useCallback(async (quizIndex) => {
    if (resettingIndex !== null || isResettingAll) return;
    setResettingIndex(quizIndex);
    try {
      await learningApi.resetQuiz({ courseSlug, lectureId, quizIndex });
      dispatch(removeQuizComplete({ lectureId, quizIndex }));
      Toast.show({
        type: 'success',
        text1: '↺ Đã reset!',
        text2: 'Tua video về vị trí câu hỏi để làm lại.',
        visibilityTime: 4000,
      });
      onRetake?.(quizIndex);
      onClose();
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Không thể reset quiz',
        text2: 'Vui lòng thử lại.',
      });
    } finally {
      setResettingIndex(null);
    }
  }, [courseSlug, lectureId, dispatch, onRetake, onClose, resettingIndex, isResettingAll]);

  // Reset tất cả quiz
  const handleRetakeAll = useCallback(async () => {
    if (resettingIndex !== null || isResettingAll) return;
    setIsResettingAll(true);
    try {
      await learningApi.resetAllQuizzes({ courseSlug, lectureId });
      dispatch(removeAllQuizzesForLecture({ lectureId }));
      Toast.show({
        type: 'success',
        text1: '↺ Đã reset tất cả!',
        text2: 'Tua video để làm lại từ đầu.',
        visibilityTime: 4000,
      });
      onRetakeAll?.();
      onClose();
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Không thể reset tất cả quiz',
        text2: 'Vui lòng thử lại.',
      });
    } finally {
      setIsResettingAll(false);
    }
  }, [courseSlug, lectureId, dispatch, onRetakeAll, onClose, resettingIndex, isResettingAll]);

  const doneCount = quizReviewData.filter(q => q.attempt !== null).length;
  const activeItems = quizReviewData.filter(q => q.isActive !== false);

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>📋 Xem lại câu hỏi</Text>
            <Text style={styles.headerSub}>
              {doneCount}/{activeItems.length} câu đã hoàn thành
            </Text>
          </View>

          <View style={styles.headerActions}>
            {/* Retake All */}
            <TouchableOpacity
              onPress={handleRetakeAll}
              disabled={isResettingAll || doneCount === 0}
              style={[styles.retakeAllBtn, (isResettingAll || doneCount === 0) && { opacity: 0.4 }]}
              activeOpacity={0.7}
            >
              {isResettingAll
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.retakeAllText}>↺ Làm lại tất cả</Text>
              }
            </TouchableOpacity>

            {/* Close */}
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Content ── */}
        {isLoadingReview ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
          </View>
        ) : activeItems.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>❓</Text>
            <Text style={styles.emptyText}>Bài giảng này chưa có câu hỏi quiz.</Text>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={true}
          >
            {activeItems.map((item, idx) => (
              <QuizReviewItem
                key={idx}
                item={item}
                onRetake={() => handleRetakeOne(item.quizIndex)}
                isResetting={resettingIndex === item.quizIndex}
              />
            ))}
          </ScrollView>
        )}

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.footerTip}>
            💡 Sau khi reset, tua video về đúng mốc thời gian để làm lại câu hỏi.
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#4f46e5',
    gap: 10,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  retakeAllBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  retakeAllText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  closeBtn: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  // Loading & Empty
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 30,
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
  },

  // Item
  item: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  statusIcon: {
    fontSize: 14,
    flexShrink: 0,
    marginTop: 1,
  },
  question: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 20,
  },
  timestampBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    flexShrink: 0,
  },
  timestampText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  expandBtn: {
    paddingVertical: 2,
  },
  expandBtnText: {
    color: '#4f46e5',
    fontSize: 12,
    fontWeight: '600',
  },

  // Detail
  detail: {
    marginTop: 10,
    gap: 6,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  optionCorrect: {
    borderColor: '#10b981',
    backgroundColor: '#d1fae5',
  },
  optionWrong: {
    borderColor: '#ef4444',
    backgroundColor: '#fee2e2',
  },
  optId: {
    fontWeight: '700',
    fontSize: 13,
    color: '#374151',
    flexShrink: 0,
  },
  optionText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  explanationBox: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  explanationText: {
    fontSize: 13,
    color: '#92400e',
    lineHeight: 18,
  },
  hintBox: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  hintText: {
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },

  // Retake button
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 9,
    paddingHorizontal: 14,
    backgroundColor: '#eef2ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    alignSelf: 'flex-start',
    minWidth: 140,
  },
  retakeBtnText: {
    color: '#4f46e5',
    fontWeight: '600',
    fontSize: 13,
  },

  // Footer
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  footerTip: {
    fontSize: 11,
    color: '#9ca3af',
    lineHeight: 16,
  },
});

export default QuizReviewSheetMobile;
