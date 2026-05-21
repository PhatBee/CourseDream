import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronDown, ChevronUp, CheckCircle } from 'lucide-react-native';
import LectureItem from './LectureItem';

const CurriculumList = ({
  sections,
  currentLecture,
  completedLectures = [],
  onLecturePress,
  onToggleComplete,
}) => {
  // Mặc định mở section đầu tiên
  const [expandedSections, setExpandedSections] = useState({ 0: true });

  const toggleSection = (index) => {
    setExpandedSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <View style={styles.container}>
      {sections.map((section, secIndex) => {
        const isExpanded = !!expandedSections[secIndex];
        const sectionLectures = section.lectures || [];
        const completedInSection = sectionLectures.filter((l) =>
          completedLectures.includes(l._id)
        ).length;
        const allDone = sectionLectures.length > 0 && completedInSection === sectionLectures.length;

        return (
          <View key={section._id || secIndex} style={styles.section}>
            {/* ── Section Header ── */}
            <TouchableOpacity
              onPress={() => toggleSection(secIndex)}
              activeOpacity={0.75}
              style={styles.sectionHeader}
            >
              <View style={styles.sectionHeaderLeft}>
                {/* Section number badge */}
                <View style={[styles.sectionNumBadge, allDone && styles.sectionNumBadgeDone]}>
                  {allDone ? (
                    <CheckCircle size={13} color="#10b981" fill="#d1fae5" />
                  ) : (
                    <Text style={styles.sectionNumText}>{secIndex + 1}</Text>
                  )}
                </View>

                <View style={styles.sectionTitleArea}>
                  <Text style={styles.sectionTitle} numberOfLines={2}>
                    {section.title}
                  </Text>
                  <Text style={styles.sectionMeta}>
                    {completedInSection}/{sectionLectures.length} bài · Section {secIndex + 1}
                  </Text>
                </View>
              </View>

              {isExpanded ? (
                <ChevronUp size={18} color="#9ca3af" />
              ) : (
                <ChevronDown size={18} color="#9ca3af" />
              )}
            </TouchableOpacity>

            {/* ── Progress bar within section ── */}
            {sectionLectures.length > 0 && (
              <View style={styles.sectionProgress}>
                <View
                  style={[
                    styles.sectionProgressFill,
                    {
                      width: `${Math.round((completedInSection / sectionLectures.length) * 100)}%`,
                    },
                    allDone && styles.sectionProgressFillDone,
                  ]}
                />
              </View>
            )}

            {/* ── Lecture List ── */}
            {isExpanded && (
              <View>
                {sectionLectures.map((lecture, lecIndex) => {
                  const isCurrent = currentLecture?._id === lecture._id;
                  const isCompleted = completedLectures.includes(lecture._id);

                  return (
                    <LectureItem
                      key={lecture._id || lecIndex}
                      index={lecIndex}
                      lecture={lecture}
                      isCurrent={isCurrent}
                      isCompleted={isCompleted}
                      onPress={() => onLecturePress(lecture)}
                      onToggleComplete={() => onToggleComplete(lecture._id)}
                    />
                  );
                })}
              </View>
            )}
          </View>
        );
      })}

      {/* Bottom padding */}
      <View style={{ height: 40 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
  },
  section: {
    marginBottom: 2,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },

  // ── Section header ──
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
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
  sectionNumBadgeDone: {
    backgroundColor: '#d1fae5',
  },
  sectionNumText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#e11d48',
  },
  sectionTitleArea: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 20,
    marginBottom: 2,
  },
  sectionMeta: {
    fontSize: 11,
    color: '#9ca3af',
  },

  // ── Section progress bar ──
  sectionProgress: {
    height: 3,
    backgroundColor: '#f3f4f6',
    overflow: 'hidden',
  },
  sectionProgressFill: {
    height: '100%',
    backgroundColor: '#fda4af',
    borderRadius: 2,
  },
  sectionProgressFillDone: {
    backgroundColor: '#34d399',
  },
});

export default CurriculumList;