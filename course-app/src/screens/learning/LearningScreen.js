import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronLeft, ChevronRight, CheckCircle, BookOpen, List } from 'lucide-react-native';

// Import Actions & Components
import {
  fetchLearningCourse,
  setCurrentLecture,
  toggleLecture,
  resetLearning,
} from '../../features/learning/learningSlice';
import VideoPlayer from '../../components/learning/VideoPlayer';
import LearningTabs from '../../components/learning/LearningTabs';
import CurriculumList from '../../components/learning/CurriculumList';

const LearningScreen = ({ route, navigation }) => {
  const { slug } = route.params;
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('Lectures');

  const { course, sections, currentLecture, progress, isLoading } = useSelector(
    (state) => state.learning
  );

  // ─── Điều hướng bài học kế tiếp / trước đó ──────────────────────────────
  const allLectures = sections.flatMap((s) => s.lectures || []);
  const currentIndex = currentLecture
    ? allLectures.findIndex((l) => l._id === currentLecture._id)
    : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allLectures.length - 1;

  const handlePrev = () => {
    if (hasPrev) dispatch(setCurrentLecture(allLectures[currentIndex - 1]));
  };

  const handleNext = () => {
    if (hasNext) dispatch(setCurrentLecture(allLectures[currentIndex + 1]));
  };

  const handleToggleComplete = async (lectureId) => {
    await dispatch(toggleLecture({ courseSlug: slug, lectureId }));
  };

  useEffect(() => {
    if (slug) {
      dispatch(fetchLearningCourse(slug));
    }
    return () => {
      dispatch(resetLearning());
    };
  }, [dispatch, slug]);

  const handleLecturePress = (lecture) => {
    dispatch(setCurrentLecture(lecture));
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
            {/* Progress */}
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
            <CheckCircle
              size={15}
              color={isCompleted ? '#10b981' : '#fff'}
            />
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
        <LearningTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {activeTab === 'Lectures' ? (
            <CurriculumList
              sections={sections}
              currentLecture={currentLecture}
              completedLectures={progress?.completedLectures || []}
              onLecturePress={handleLecturePress}
              onToggleComplete={handleToggleComplete}
            />
          ) : (
            /* ── Tab "Overview" ── */
            <View style={styles.overviewContainer}>
              {/* Course title */}
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

              {/* Description */}
              <Text style={styles.overviewSectionTitle}>Mô tả khóa học</Text>
              <Text style={styles.overviewDesc}>
                {course.description || 'Không có mô tả.'}
              </Text>

              {/* AWS CloudFront note
              <View style={styles.cfNote}>
                <Text style={styles.cfNoteText}>
                  🔒 Video được bảo mật và phân phối qua{' '}
                  <Text style={styles.cfNoteStrong}>AWS CloudFront CDN</Text>
                </Text>
              </View> */}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    gap: 12,
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 14,
  },

  // ── Video ──
  videoWrapper: {
    position: 'relative',
  },
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
  infoBarLeft: {
    flex: 1,
    marginRight: 10,
  },
  lectureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  progressLabel: {
    fontSize: 11,
    color: '#9ca3af',
  },
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
  completeBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  completeBtnTextDone: {
    color: '#10b981',
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
  navBtnDisabled: {
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  navBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e11d48',
  },
  navBtnTextDisabled: {
    color: '#d1d5db',
  },

  // ── Content area ──
  contentArea: {
    flex: 1,
  },

  // ── Overview tab ──
  overviewContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  overviewInstructor: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 16,
  },
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
  progressBarFill: {
    height: '100%',
    backgroundColor: '#e11d48',
    borderRadius: 3,
  },
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
  overviewDesc: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22,
  },
  cfNote: {
    marginTop: 20,
    backgroundColor: '#f0f9ff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  cfNoteText: {
    fontSize: 12,
    color: '#0369a1',
    lineHeight: 18,
  },
  cfNoteStrong: {
    fontWeight: '700',
  },
});

export default LearningScreen;