import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  Linking,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  FileText,
  Link as LinkIcon,
  Download,
  File,
} from 'lucide-react-native';

// Import Actions & Components
import {
  fetchLearningCourse,
  setCurrentLecture,
  toggleLecture,
  resetLearning,
  fetchVideoProgress,
  saveVideoProgress,
} from '../../features/learning/learningSlice';
import VideoPlayer from '../../components/learning/VideoPlayer';
import LearningTabs from '../../components/learning/LearningTabs';
import CurriculumList from '../../components/learning/CurriculumList';
import DiscussionMobile from '../../components/course/DiscussionMobile';

// ─── Resource Item (giống web client) ───────────────────────────────────────
const ResourceItem = ({ resource }) => {
  const isLink = resource.type === 'link';
  const handleOpen = () => {
    if (resource.url) Linking.openURL(resource.url).catch(() => {});
  };

  return (
    <TouchableOpacity
      onPress={handleOpen}
      activeOpacity={0.75}
      style={styles.resourceItem}
    >
      <View style={styles.resourceIcon}>
        {isLink ? (
          <LinkIcon size={16} color="#e11d48" />
        ) : (
          <File size={16} color="#e11d48" />
        )}
      </View>
      <View style={styles.resourceInfo}>
        <Text style={styles.resourceTitle} numberOfLines={1}>
          {resource.title || 'Untitled'}
        </Text>
        <Text style={styles.resourceType}>
          {isLink ? 'External Link' : 'File Download'}
        </Text>
      </View>
      <Download size={14} color="#d1d5db" />
    </TouchableOpacity>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
const LearningScreen = ({ route, navigation }) => {
  // 1. Lấy toàn bộ tham số được Notification truyền tải sang
  const { slug, discussionId, replyId } = route.params || {};
  const dispatch = useDispatch();

  // 2. Nếu có discussionId -> Tự động select activeTab là "Discussion"
  const [activeTab, setActiveTab] = useState(
    discussionId ? "Discussion" : "Lectures",
  );

  const { course, sections, currentLecture, progress, isLoading, lastWatchedTime } = useSelector(
    (state) => state.learning
  );

  // ─── Parse resources của bài học hiện tại ─────────────────────────────────
  const parsedResources = useMemo(() => {
    if (!currentLecture?.resources || !Array.isArray(currentLecture.resources)) return [];
    return currentLecture.resources
      .filter(Boolean)
      .map((r) => {
        if (typeof r === 'object') return r;
        try { return JSON.parse(r); } catch { return null; }
      })
      .filter(Boolean);
  }, [currentLecture?.resources]);

  // ─── Điều hướng bài học ───────────────────────────────────────────────────
  const allLectures = sections.flatMap((s) => s.lectures || []);
  const currentIndex = currentLecture
    ? allLectures.findIndex((l) => l._id === currentLecture._id)
    : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allLectures.length - 1;

  const handlePrev = () => {
    if (hasPrev) {
      dispatch(setCurrentLecture(allLectures[currentIndex - 1]));
      setActiveTab('Lectures');
    }
  };

  const handleNext = () => {
    if (hasNext) {
      dispatch(setCurrentLecture(allLectures[currentIndex + 1]));
      setActiveTab('Lectures');
    }
  };

  const { user } = useSelector((state) => state.auth);

  const handleToggleComplete = async (lectureId) => {
    await dispatch(toggleLecture({ courseSlug: slug, lectureId }));
  };

  useEffect(() => {
    if (slug) dispatch(fetchLearningCourse(slug));
    return () => { dispatch(resetLearning()); };
  }, [dispatch, slug]);

  // Khi currentLecture thay đổi → fetch last_watched_time
  useEffect(() => {
    if (!currentLecture?._id || !slug) return;
    dispatch(fetchVideoProgress({ courseSlug: slug, lectureId: currentLecture._id }));
  }, [currentLecture?._id, slug, dispatch]);

  // Khi chuyển bài → reset tab về Lectures
  useEffect(() => {
    setActiveTab('Lectures');
  }, [currentLecture?._id]);

  const handleLecturePress = (lecture) => {
    dispatch(setCurrentLecture(lecture));
  };

  /**
   * Nhận progress từ VideoPlayer (mỗi 10s hoặc khi pause)
   * Dispatch saveVideoProgress để lưu lên server
   */
  const handleVideoProgress = (watchedSeconds) => {
    if (!currentLecture?._id || !slug) return;
    dispatch(saveVideoProgress({
      courseSlug: slug,
      lectureId: currentLecture._id,
      watchedSeconds,
    }));
  };

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (isLoading || !course) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e11d48" />
        <Text style={styles.loadingText}>Đang tải khóa học...</Text>
      </View>
    );
  }

  const isCompleted = progress?.completedLectures?.includes(currentLecture?._id);
  const completedCount = progress?.completedLectures?.length || 0;
  const totalLectures = allLectures.length;
  const progressPct = totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {/* ── 1. VIDEO PLAYER AREA ── */}
      <View style={styles.videoWrapper}>
        {/* Back button overlay */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.8}
        >
          <ChevronLeft size={22} color="#fff" />
        </TouchableOpacity>

        <VideoPlayer
          currentLecture={currentLecture}
          courseId={course._id}
          thumbnail={course.thumbnail}
          lastWatchedTime={lastWatchedTime}
          onProgress={handleVideoProgress}
          onComplete={() => {
            if (!isCompleted && currentLecture?._id) {
              handleToggleComplete(currentLecture._id);
            }
          }}
        />
      </View>

      {/* ── 2. LECTURE INFO BAR ── */}
      {currentLecture && (
        <View style={styles.infoBar}>
          <View style={styles.infoBarLeft}>
            <Text style={styles.lectureTitle} numberOfLines={1}>
              {currentLecture.title}
            </Text>
            <Text style={styles.progressLabel}>
              {completedCount}/{totalLectures} bài · {progressPct}% hoàn thành
            </Text>
          </View>

          {/* Mark Complete */}
          <TouchableOpacity
            onPress={() => handleToggleComplete(currentLecture._id)}
            style={[styles.completeBtn, isCompleted && styles.completeBtnDone]}
            activeOpacity={0.8}
          >
            <CheckCircle size={15} color={isCompleted ? '#10b981' : '#fff'} />
            <Text style={[styles.completeBtnText, isCompleted && styles.completeBtnTextDone]}>
              {isCompleted ? 'Đã xong' : 'Hoàn thành'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── 3. PREV / NEXT NAV ── */}
      {currentLecture && (
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.navBtn, !hasPrev && styles.navBtnDisabled]}
            onPress={handlePrev}
            disabled={!hasPrev}
            activeOpacity={0.75}
          >
            <ChevronLeft size={16} color={hasPrev ? '#e11d48' : '#d1d5db'} />
            <Text style={[styles.navBtnText, !hasPrev && styles.navBtnTextDisabled]}>
              Bài trước
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navBtn, !hasNext && styles.navBtnDisabled]}
            onPress={handleNext}
            disabled={!hasNext}
            activeOpacity={0.75}
          >
            <Text style={[styles.navBtnText, !hasNext && styles.navBtnTextDisabled]}>
              Bài tiếp
            </Text>
            <ChevronRight size={16} color={hasNext ? '#e11d48' : '#d1d5db'} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── 4. TABS & CONTENT ── */}
      <View style={styles.contentArea}>
        <LearningTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          resourceCount={parsedResources.length}
        />

        {/* ── Tab: Bài giảng ── */}
        {activeTab === 'Lectures' && (
          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollArea}>
            <CurriculumList
              sections={sections}
              currentLecture={currentLecture}
              completedLectures={progress?.completedLectures || []}
              onLecturePress={handleLecturePress}
              onToggleComplete={handleToggleComplete}
            />
          </ScrollView>
        )}

        {/* ── Tab: Tổng quan ── */}
        {activeTab === 'Overview' && (
          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollArea}>
            <View style={styles.overviewContainer}>
              <Text style={styles.overviewTitle}>{course.title}</Text>
              <Text style={styles.overviewInstructor}>
                {course.instructor?.name || 'Instructor'}
              </Text>

                {/* Progress bar */}
                <View style={styles.progressBarWrapper}>
                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
                  </View>
                  <Text style={styles.progressBarLabel}>{progressPct}%</Text>
                </View>

              <Text style={styles.overviewSectionTitle}>Mô tả khóa học</Text>
              <Text style={styles.overviewDesc}>
                {course.description || 'Không có mô tả.'}
              </Text>
            </View>
          </ScrollView>
        )}

        {/* ── Tab: Tài liệu ── */}
        {activeTab === 'Resources' && (
          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollArea}>
            <View style={styles.resourcesContainer}>
              <View style={styles.resourcesHeader}>
                <FileText size={16} color="#e11d48" />
                <Text style={styles.resourcesTitle}>
                  Tài liệu đính kèm ({parsedResources.length})
                </Text>
              </View>
            )}

            {/* ── Tab: Tài liệu ── */}
            {activeTab === 'Resources' && (
              <View style={styles.resourcesContainer}>
                <View style={styles.resourcesHeader}>
                  <FileText size={16} color="#e11d48" />
                  <Text style={styles.resourcesTitle}>
                    Tài liệu đính kèm ({parsedResources.length})
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        )}

        {/* ── Tab: Thảo luận ── */}
        {activeTab === 'Discussion' && (
          currentLecture ? (
            <DiscussionMobile
              courseId={course._id}
              lectureId={currentLecture._id}
              user={user}
            />
          ) : (
            <View style={styles.emptyDiscussion}>
              <Text style={styles.emptyDiscussionText}>
                Chọn một bài giảng để xem phần Hỏi Đáp tương ứng.
              </Text>
            </View>
          )
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    gap: 12,
  },
  loadingText: { color: '#9ca3af', fontSize: 14 },

  // ── Video ──
  videoWrapper: { position: 'relative' },
  backBtn: {
    position: 'absolute',
    top: 44,
    left: 14,
    zIndex: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Info bar ──
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#fff',
  },
  infoBarLeft: { flex: 1, marginRight: 10 },
  lectureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  progressLabel: { fontSize: 11, color: '#9ca3af' },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#e11d48',
    borderRadius: 10,
  },
  completeBtnDone: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#6ee7b7',
  },
  completeBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  completeBtnTextDone: { color: '#10b981' },

  // ── Prev/Next ──
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#fff',
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#fda4af',
    borderRadius: 10,
    backgroundColor: '#fff5f7',
  },
  navBtnDisabled: { borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
  navBtnText: { fontSize: 13, fontWeight: '600', color: '#e11d48' },
  navBtnTextDisabled: { color: '#d1d5db' },

  // ── Content area ──
  contentArea: { flex: 1 },
  scrollArea: { flex: 1 },

  // ── Empty discussion ──
  emptyDiscussion: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyDiscussionText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    fontWeight: '500',
  },

  // ── Overview tab ──
  overviewContainer: { padding: 20, paddingBottom: 40 },
  overviewTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  overviewInstructor: { fontSize: 13, color: '#6b7280', marginBottom: 16 },
  progressBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  progressBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', backgroundColor: '#e11d48', borderRadius: 3 },
  progressBarLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e11d48',
    minWidth: 36,
    textAlign: 'right',
  },
  overviewSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  overviewDesc: { fontSize: 14, color: '#4b5563', lineHeight: 22 },

  // ── Resources tab ──
  resourcesContainer: { padding: 16, paddingBottom: 40 },
  resourcesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  resourcesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  resourceIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fff1f2',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  resourceInfo: { flex: 1 },
  resourceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  resourceType: {
    fontSize: 11,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyResources: {
    alignItems: 'center',
    paddingTop: 40,
    gap: 10,
  },
  emptyResourcesText: {
    fontSize: 14,
    color: '#9ca3af',
  },
});

export default LearningScreen;
