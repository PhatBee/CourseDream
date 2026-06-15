// course-app/src/components/learning/VideoQuizOverlayMobile.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';

/**
 * VideoQuizOverlayMobile — hiển thị overlay quiz chặn video trên mobile
 *
 * Props:
 *   quiz      - { question, options: [{id, text}], hint }
 *   onSubmit  - async fn(answer) → { correct, hint }
 *   onCorrect - fn() resume video sau khi trả lời đúng
 */
const VideoQuizOverlayMobile = ({ quiz, onSubmit, onCorrect }) => {
  const [selected, setSelected]       = useState(null);
  const [feedback, setFeedback]       = useState(null); // null | 'correct' | 'wrong'
  const [hint, setHint]               = useState(null);
  const [isSubmitting, setSubmitting] = useState(false);

  if (!quiz) return null;

  const handleSelect = (id) => {
    if (feedback === 'correct' || isSubmitting) return;
    setSelected(id);
    setFeedback(null);
    setHint(null);
  };

  const handleSubmit = async () => {
    if (!selected || isSubmitting || feedback === 'correct') return;
    setSubmitting(true);

    const result = await onSubmit(selected);

    if (result.correct) {
      setFeedback('correct');
      setTimeout(() => onCorrect(), 1300);
    } else {
      setFeedback('wrong');
      setHint(result.hint);
      setSelected(null);
    }
    setSubmitting(false);
  };

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      supportedOrientations={['portrait', 'landscape']}
    >
      {/* Overlay full màn hình */}
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerLabel}>❓ Câu hỏi kiểm tra</Text>
              <Text style={styles.headerSub}>Trả lời đúng để tiếp tục xem video</Text>
            </View>

            {/* Scrollable Content inside card */}
            <ScrollView
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
            >
              {/* Question */}
              <Text style={styles.question}>{quiz.question}</Text>

              {/* Options */}
              <View style={styles.optionsContainer}>
                {(quiz.options || []).map((opt) => {
                  const isSelected = selected === opt.id;
                  const isWrong    = feedback === 'wrong' && isSelected;

                  let btnStyle    = styles.optionBtn;
                  let textStyle   = styles.optionText;
                  let badgeStyle  = styles.optionBadge;
                  let badgeText   = styles.optionBadgeText;

                  if (isSelected) {
                    btnStyle   = [styles.optionBtn, styles.optionBtnSelected];
                    badgeStyle = [styles.optionBadge, styles.optionBadgeSelected];
                    badgeText  = [styles.optionBadgeText, styles.optionBadgeTextSelected];
                  }
                  if (isWrong) {
                    btnStyle   = [styles.optionBtn, styles.optionBtnWrong];
                    textStyle  = [styles.optionText, styles.optionTextWrong];
                  }

                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => handleSelect(opt.id)}
                      style={btnStyle}
                      disabled={feedback === 'correct'}
                      activeOpacity={0.7}
                    >
                      <View style={badgeStyle}>
                        <Text style={badgeText}>{opt.id}</Text>
                      </View>
                      <Text style={textStyle}>{opt.text}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Hint */}
              {hint ? (
                <View style={styles.hintBox}>
                  <Text style={styles.hintText}>💡 {hint}</Text>
                </View>
              ) : null}

              {/* Correct feedback */}
              {feedback === 'correct' ? (
                <View style={styles.correctBox}>
                  <Text style={styles.correctText}>✅ Chính xác! Video sẽ tiếp tục phát...</Text>
                </View>
              ) : null}

              {/* Wrong (no hint) feedback */}
              {feedback === 'wrong' && !hint ? (
                <View style={styles.wrongBox}>
                  <Text style={styles.wrongText}>❌ Chưa đúng rồi, hãy thử lại!</Text>
                </View>
              ) : null}

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!selected || feedback === 'correct' || isSubmitting}
                style={[
                  styles.submitBtn,
                  (!selected || feedback === 'correct' || isSubmitting) && styles.submitBtnDisabled,
                ]}
                activeOpacity={0.8}
              >
                {isSubmitting
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.submitBtnText}>
                      {isSubmitting ? 'Đang kiểm tra...' : 'Xác nhận đáp án'}
                    </Text>
                }
              </TouchableOpacity>
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  safeArea: {
    width: '100%',
    maxWidth: 420,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
    maxHeight: '90%', // Tránh tràn màn hình khi xoay ngang
  },
  header: {
    backgroundColor: '#e11d48',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  scrollContainer: {
    width: '100%',
  },
  scrollContent: {
    paddingBottom: 8,
  },
  question: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  optionsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    marginBottom: 6,
  },
  optionBtnSelected: {
    borderColor: '#e11d48',
    backgroundColor: '#fff1f2',
  },
  optionBtnWrong: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  optionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  optionBadgeSelected: {
    backgroundColor: '#e11d48',
    borderColor: '#e11d48',
  },
  optionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9ca3af',
  },
  optionBadgeTextSelected: {
    color: '#fff',
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  optionTextWrong: {
    color: '#dc2626',
  },
  hintBox: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 10,
    padding: 10,
  },
  hintText: {
    fontSize: 13,
    color: '#92400e',
    lineHeight: 18,
  },
  correctBox: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 10,
    padding: 10,
  },
  correctText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  wrongBox: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 10,
  },
  wrongText: {
    fontSize: 13,
    color: '#991b1b',
  },
  submitBtn: {
    margin: 16,
    marginTop: 8,
    backgroundColor: '#e11d48',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  submitBtnDisabled: {
    opacity: 0.45,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default VideoQuizOverlayMobile;
