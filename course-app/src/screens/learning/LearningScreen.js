import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  Linking,
  useWindowDimensions,
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
import QuizReviewSheetMobile from '../../components/learning/QuizReviewSheetMobile';
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

  // Dùng ref để tracking xem đã xử lý param từ notification chưa
  const processedParamsRef = useRef({
    discussionId: null,
    lectureId: null,
    replyId: null,
  });

  // ─── Refs và state cho Quiz Review ───────────────────────────────────────────
  // videoPlayerRef: điều khiển VideoPlayer (seekToQuiz) từ bên ngoài
  const videoPlayerRef = useRef(null);
  // isReviewOpen: trạng thái mở/đóng QuizReviewSheetMobile
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  // ─── States dành riêng cho xử lý Deep Link sang Thảo luận ────────────
  const [targetDiscussionId, setTargetDiscussionId] = useState(null);
  const [targetReplyId, setTargetReplyId] = useState(null);

  const { course, sections, currentLecture, progress, isLoading, lastWatchedTime, accumulatedSeconds } = useSelector(
    (state) => state.learning
  );

  const [localAccumulated, setLocalAccumulated] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  
  const completedQuizzes = useSelector((state) => state.learning.completedQuizzes) || [];

  const isQuizDone = useCallback((quizIndex) => {
    if (!currentLecture?._id) return false;
    return completedQuizzes.some(
      q => String(q.lectureId) === String(currentLecture._id)
        && Number(q.quizIndex) === Number(quizIndex)
        && q.isCorrect !== false
    );
  }, [completedQuizzes, currentLecture?._id]);

  useEffect(() => {
    setLocalAccumulated(accumulatedSeconds || 0);
  }, [accumulatedSeconds, currentLecture?._id]);

  const handleWatchStats = useCallback(({ localAccumulated: acc, videoDuration: dur }) => {
    setLocalAccumulated(acc);
    if (dur && dur > 0) setVideoDuration(dur);
  }, []);

  // ── Phát hiện landscape để điều chỉnh layout ────────────────────────────────────
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscape = windowWidth > windowHeight;

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

  // Xử lý notification deep link (khi có lectureId, discussionId trong route.params)
  useEffect(() => {
    const { lectureId: routeLectureId, discussionId: routeDiscussionId, replyId: routeReplyId } = route.params || {};

    if (
      routeLectureId &&
      (processedParamsRef.current.lectureId !== routeLectureId ||
       processedParamsRef.current.discussionId !== routeDiscussionId ||
       processedParamsRef.current.replyId !== routeReplyId)
    ) {
      if (sections.length > 0) {
        const allLecs = sections.flatMap((s) => s.lectures || []);
        const targetLec = allLecs.find((l) => l._id === routeLectureId);
        
        if (targetLec && currentLecture?._id !== targetLec._id) {
          dispatch(setCurrentLecture(targetLec));
        }

        if (routeDiscussionId) {
          setTargetDiscussionId(routeDiscussionId);
          setTargetReplyId(routeReplyId);
          setActiveTab('Discussion');
        } else {
          setActiveTab('Lectures');
        }

        // Đánh dấu đã xử lý
        processedParamsRef.current = {
          lectureId: routeLectureId,
          discussionId: routeDiscussionId,
          replyId: routeReplyId,
        };
      }
    }
  }, [route.params, sections, currentLecture?._id, dispatch]);

  const handleLecturePress = (lecture) => {
    dispatch(setCurrentLecture(lecture));
    setActiveTab('Lectures');
  };

  /**
   * Nhận progress từ VideoPlayer (mỗi 10s hoặc khi pause)
   * Dispatch saveVideoProgress để lưu lên server
   */
  const handleVideoProgress = (watchedSeconds, playbackRate = 1) => {
    if (!currentLecture?._id || !slug) return;
    dispatch(saveVideoProgress({
      courseSlug: slug,
      lectureId: currentLecture._id,
      watchedSeconds,
      playbackRate,
    }));
  };

  // ─── Loading ─────────────────────────────────────────────────────
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

  // ─── Shared sub-layouts (dùng lại cho cả portrait và landscape) ──────────
  const quizzes = currentLecture?.quizzes || [];
  const activeQuizzes = quizzes.filter(q => q.isActive !== false);

  const allQuizPassed = activeQuizzes.every((_, idx) => isQuizDone(idx));
  const hasVideo = (currentLecture?.duration || 0) > 0;
  const totalDuration = videoDuration || currentLecture?.duration || 1;
  const watchRatio = hasVideo ? (localAccumulated / totalDuration) : 1;
  const isWatchTimeOk = !hasVideo || watchRatio >= 0.7;

  const canComplete = isCompleted || (allQuizPassed && isWatchTimeOk);

  const renderInfoBar = () => currentLecture && (
    <View style={styles.infoBarContainer}>
      <View style={styles.infoBar}>
        <View style={styles.infoBarLeft}>
          <Text style={styles.lectureTitle} numberOfLines={1}>
            {currentLecture.title}
          </Text>
          <Text style={styles.progressLabel}>
            {completedCount}/{totalLectures} bài · {progressPct}% hoàn thành
          </Text>
        </View>

        <TouchableOpacity
          disabled={!canComplete}
          onPress={() => handleToggleComplete(currentLecture._id)}
          style={[
            styles.completeBtn,
            isCompleted && styles.completeBtnDone,
            !canComplete && styles.completeBtnDisabled
          ]}
          activeOpacity={0.8}
        >
          <CheckCircle size={15} color={isCompleted ? '#10b981' : !canComplete ? '#9ca3af' : '#fff'} />
          <Text style={[
            styles.completeBtnText,
            isCompleted && styles.completeBtnTextDone,
            !canComplete && styles.completeBtnTextDisabled
          ]}>
            {isCompleted ? 'Đã xong' : 'Hoàn thành'}
          </Text>
        </TouchableOpacity>

        {(currentLecture?.quizzes?.filter(q => q.isActive !== false).length > 0) && (
          <TouchableOpacity
            onPress={() => setIsReviewOpen(true)}
            style={styles.quizReviewBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.quizReviewBtnText}>
              📋 {currentLecture.quizzes.filter(q => q.isActive !== false).length}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Cảnh báo lý do chưa đủ điều kiện hoàn thành bài giảng */}
      {!isCompleted && !canComplete && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningTitle}>Điều kiện hoàn thành bài giảng:</Text>
          {!isWatchTimeOk && (
            <Text style={styles.warningText}>
              ⏱ Xem video học thực tế: {Math.round(watchRatio * 100)}% / 70%
            </Text>
          )}
          {!allQuizPassed && (
            <Text style={styles.warningText}>
              📝 Trả lời đúng tất cả Quiz của bài giảng
            </Text>
          )}
        </View>
      )}
    </View>
  );

  const renderNavRow = () => currentLecture && (
    <View style={styles.navRow}>
      <TouchableOpacity
        style={[styles.navBtn, !hasPrev && styles.navBtnDisabled]}
        onPress={handlePrev}
        disabled={!hasPrev}
        activeOpacity={0.75}
      >
        <ChevronLeft size={16} color={hasPrev ? '#e11d48' : '#d1d5db'} />
        <Text style={[styles.navBtnText, !hasPrev && styles.navBtnTextDisabled]}>Bài trước</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navBtn, !hasNext && styles.navBtnDisabled]}
        onPress={handleNext}
        disabled={!hasNext}
        activeOpacity={0.75}
      >
        <Text style={[styles.navBtnText, !hasNext && styles.navBtnTextDisabled]}>Bài tiếp</Text>
        <ChevronRight size={16} color={hasNext ? '#e11d48' : '#d1d5db'} />
      </TouchableOpacity>
    </View>
  );

  const renderTabContent = () => (
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

            {parsedResources.length > 0 ? (
              parsedResources.map((res, index) => (
                <ResourceItem key={index} resource={res} />
              ))
            ) : (
              <View style={styles.emptyResources}>
                <FileText size={32} color="#e5e7eb" />
                <Text style={styles.emptyResourcesText}>Không có tài liệu đính kèm</Text>
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
            isEnrolled={true}
            targetDiscussionId={targetDiscussionId}
            targetReplyId={targetReplyId}
            onConsumed={() => {
              setTargetDiscussionId(null);
              setTargetReplyId(null);
            }}
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
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {isLandscape ? (
        /* ───── LANDSCAPE: 2 cột ──────────────────────────────────────── */
        <View style={styles.landscapeWrapper}>

          {/* Cột trái: Video (55% width, full height) */}
          <View style={[styles.videoWrapper, { width: windowWidth * 0.55, height: windowHeight }]}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              activeOpacity={0.8}
            >
              <ChevronLeft size={22} color="#fff" />
            </TouchableOpacity>

            <VideoPlayer
              ref={videoPlayerRef}
              currentLecture={currentLecture}
              courseId={course._id}
              courseSlug={slug}
              thumbnail={course.thumbnail}
              lastWatchedTime={lastWatchedTime}
              accumulatedSeconds={accumulatedSeconds}
              onProgress={handleVideoProgress}
              onWatchStats={handleWatchStats}
              playerHeight={windowHeight}
              onComplete={() => {
                if (canComplete && !isCompleted && currentLecture?._id) {
                  handleToggleComplete(currentLecture._id);
                }
              }}
            />
          </View>

          {/* Cột phải: Info + Nav + Tabs (flex: 1) */}
          <View style={styles.landscapeRight}>
            {renderInfoBar()}
            {renderNavRow()}
            {renderTabContent()}
          </View>
        </View>
      ) : (
        /* ───── PORTRAIT: Layout gốc ─────────────────────────────────── */
        <>
          {/* ── 1. VIDEO PLAYER AREA ── */}
          <View style={styles.videoWrapper}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              activeOpacity={0.8}
            >
              <ChevronLeft size={22} color="#fff" />
            </TouchableOpacity>

            <VideoPlayer
              ref={videoPlayerRef}
              currentLecture={currentLecture}
              courseId={course._id}
              courseSlug={slug}
              thumbnail={course.thumbnail}
              lastWatchedTime={lastWatchedTime}
              accumulatedSeconds={accumulatedSeconds}
              onProgress={handleVideoProgress}
              onWatchStats={handleWatchStats}
              onComplete={() => {
                if (canComplete && !isCompleted && currentLecture?._id) {
                  handleToggleComplete(currentLecture._id);
                }
              }}
            />
          </View>

          {/* ── 2. LECTURE INFO BAR ── */}
          {renderInfoBar()}

          {/* ── 3. PREV / NEXT NAV ── */}
          {renderNavRow()}

          {/* ── 4. TABS & CONTENT ── */}
          {renderTabContent()}
        </>
      )}

      {currentLecture && (
        <QuizReviewSheetMobile
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          courseSlug={slug}
          lectureId={currentLecture._id}
          quizzes={currentLecture?.quizzes || []}
          onRetake={(quizIndex) => {
            const quiz = (currentLecture?.quizzes || [])[quizIndex];
            if (!quiz) return;
            const ts = Number(quiz.timestamp);
            videoPlayerRef.current?.seekToQuiz(ts);
          }}
          onRetakeAll={() => {}}
        />
      )}
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
  infoBarContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  completeBtnDisabled: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
    borderWidth: 1,
  },
  completeBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  completeBtnTextDone: { color: '#10b981' },
  completeBtnTextDisabled: { color: '#9ca3af' },
  warningContainer: {
    backgroundColor: '#fff1f2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#ffe4e6',
    gap: 2,
  },
  warningTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#e11d48',
  },
  warningText: {
    fontSize: 11,
    color: '#f43f5e',
    fontWeight: '500',
    paddingLeft: 4,
  },

  // ✅ Nút Xem lại câu hỏi (trong infoBar)
  quizReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#eef2ff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    marginLeft: 6,
  },
  quizReviewBtnText: {
    color: '#4f46e5',
    fontSize: 12,
    fontWeight: '700',
  },

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

  // ── Landscape layout ──
  landscapeWrapper: {
    flex: 1,
    flexDirection: 'row',
  },
  landscapeRight: {
    flex: 1,
    flexDirection: 'column',
    borderLeftWidth: 1,
    borderLeftColor: '#f3f4f6',
    backgroundColor: '#fff',
  },
});

export default LearningScreen;
