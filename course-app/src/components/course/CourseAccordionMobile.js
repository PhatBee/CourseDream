import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { ChevronDown, ChevronUp, PlayCircle, Lock, AlertCircle, X, RefreshCw } from 'lucide-react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { courseApi } from '../../api/courseApi';

/**
 * CourseAccordionMobile
 * - Xóa bỏ YouTube / Dailymotion / Vimeo embed (WebView)
 * - Preview bài học miễn phí bằng AWS CloudFront Signed URL (getCoursePreviewUrl)
 * - Xoay ngang khi fullscreen
 */
const CourseAccordionMobile = ({ sections = [], courseSlug }) => {
  const [openSection, setOpenSection] = useState(null);

  // Preview modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [currentLecture, setCurrentLecture] = useState(null);

  // VideoView ref để gọi enterFullscreen()
  const videoViewRef = useRef(null);

  // ─── expo-video player (tạo 1 lần, thay source khi cần) ──────────────────
  const player = useVideoPlayer(previewUrl || '', (p) => {
    p.loop = false;
    if (previewUrl) p.play();
  });

  // Đồng bộ source khi previewUrl thay đổi
  useEffect(() => {
    if (!player || !previewUrl) return;
    player.replaceAsync(previewUrl);
    player.play();
  }, [previewUrl]);

  // ─── Mở preview bài học miễn phí ─────────────────────────────────────────
  const handlePreviewPress = useCallback(async (lecture) => {
    setPreviewTitle(lecture.title || 'Preview');
    setCurrentLecture(lecture);
    setPreviewUrl(null);
    setPreviewError(null);
    setIsLoading(true);
    setModalVisible(true);

    try {
      const res = await courseApi.getCoursePreviewUrl(courseSlug);
      const { previewUrl: url } = res.data.data;

      if (!url) {
        if (lecture.videoUrl) {
          setPreviewUrl(lecture.videoUrl);
        } else {
          setPreviewError('Bài học này chưa có video preview.');
        }
      } else {
        setPreviewUrl(url);
      }
    } catch (err) {
      console.error('[CourseAccordion] Preview fetch error:', err);
      if (lecture.videoUrl) {
        setPreviewUrl(lecture.videoUrl);
      } else {
        setPreviewError('Không thể tải video. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [courseSlug]);

  const handleCloseModal = useCallback(() => {
    // Thoát fullscreen nếu đang ở fullscreen trước khi đóng modal
    videoViewRef.current?.exitFullscreen();
    setModalVisible(false);
    setPreviewUrl(null);
    setPreviewError(null);
    setCurrentLecture(null);
    // Pause player
    if (player) player.pause();
  }, [player]);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.sectionHeading}>📚 Nội dung khóa học</Text>

      {sections.map((section, idx) => (
        <View key={section._id || idx} style={styles.sectionCard}>
          {/* ── Section Header ── */}
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setOpenSection(openSection === idx ? null : idx)}
            activeOpacity={0.8}
          >
            <View style={styles.sectionHeaderLeft}>
              <View style={styles.sectionNumBadge}>
                <Text style={styles.sectionNumText}>{idx + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle} numberOfLines={2}>
                  {section.title}
                </Text>
                <Text style={styles.sectionMeta}>
                  {section.lectures?.length || 0} bài giảng
                </Text>
              </View>
            </View>
            {openSection === idx ? (
              <ChevronUp size={18} color="#6b7280" />
            ) : (
              <ChevronDown size={18} color="#6b7280" />
            )}
          </TouchableOpacity>

          {/* ── Lecture List ── */}
          {openSection === idx && section.lectures && (
            <View style={styles.lectureList}>
              {section.lectures.map((lec, i) => {
                const isLast = i === section.lectures.length - 1;
                const isFree = lec.isPreviewFree && lec.videoUrl;

                return (
                  <View
                    key={lec._id || i}
                    style={[styles.lectureRow, !isLast && styles.lectureRowBorder]}
                  >
                    {isFree ? (
                      <TouchableOpacity
                        style={styles.lectureContent}
                        onPress={() => handlePreviewPress(lec)}
                        activeOpacity={0.75}
                      >
                        <View style={styles.playBadge}>
                          <PlayCircle size={16} color="#e11d48" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.lectureTitleFree} numberOfLines={2}>
                            {lec.title}
                          </Text>
                          <Text style={styles.previewLabel}>Xem thử miễn phí</Text>
                        </View>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.lectureContent}>
                        <View style={styles.lockBadge}>
                          <Lock size={14} color="#9ca3af" />
                        </View>
                        <Text style={styles.lectureTitleLocked} numberOfLines={2}>
                          {lec.title}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      ))}

      {/* ── Preview Modal ── */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />

          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {previewTitle}
            </Text>
            <TouchableOpacity
              onPress={handleCloseModal}
              style={styles.closeBtn}
              activeOpacity={0.8}
            >
              <X size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Video area */}
          <View style={styles.videoArea}>
            {isLoading ? (
              <View style={styles.centerState}>
                <ActivityIndicator size="large" color="#e11d48" />
                <Text style={styles.stateText}>Đang tải video...</Text>
              </View>
            ) : previewError ? (
              <View style={styles.centerState}>
                <AlertCircle size={40} color="#e11d48" />
                <Text style={styles.stateText}>{previewError}</Text>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={() => handlePreviewPress({ videoUrl: null, title: previewTitle })}
                >
                  <RefreshCw size={14} color="#fff" />
                  <Text style={styles.retryText}>Thử lại</Text>
                </TouchableOpacity>
              </View>
            ) : previewUrl ? (
              /*
               * VideoView của expo-video:
               * - allowsFullscreen: bật native fullscreen
               * - Native fullscreen tự xoay ngang (landscape) trên iOS/Android
               * - KHÔNG unmount component, KHÔNG cần expo-screen-orientation
               */
              <VideoView
                ref={videoViewRef}
                player={player}
                style={styles.video}
                fullscreenOptions={{ enterFullscreen: true, exitFullscreen: true }}
                allowsPictureInPicture={false}
                nativeControls
                contentFit="contain"
              />
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 16, marginBottom: 8 },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },

  // ── Section card ──
  sectionCard: {
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#fafafa',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 8,
    gap: 10,
  },
  sectionNumBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ffe4e6',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  sectionNumText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#e11d48',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 20,
    marginBottom: 2,
  },
  sectionMeta: { fontSize: 11, color: '#9ca3af' },

  // ── Lecture list ──
  lectureList: { paddingVertical: 4, backgroundColor: '#fff' },
  lectureRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  lectureRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  lectureContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#fff1f2',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  lockBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  lectureTitleFree: {
    fontSize: 14,
    fontWeight: '600',
    color: '#be123c',
    lineHeight: 19,
  },
  lectureTitleLocked: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 19,
    flex: 1,
  },
  previewLabel: {
    fontSize: 11,
    color: '#e11d48',
    marginTop: 2,
    fontWeight: '500',
  },

  // ── Modal ──
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#111',
  },
  modalTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginRight: 10,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoArea: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  centerState: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  stateText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#e11d48',
    borderRadius: 10,
  },
  retryText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});

export default CourseAccordionMobile;